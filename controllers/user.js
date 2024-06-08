import { query } from "express";
import { Poll } from "../models/Poll.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken } from "../utils/auth.js";

const getUser = async (req, res) => {
    res.status(200).json({ user: req.user });
};

const loginUser = async (req, res, next) => {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
        throw new ApiError("Provide username/email and password", 400);
    }

    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (!user) {
        throw new ApiError("User with this email/username does not exist", 401);
    }

    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) {
        throw new ApiError("Invalid credentials", 401);
    }

    const accessToken = generateAccessToken(user);
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };

    const userWithoutPassword = Object.assign({}, user.toJSON());
    delete userWithoutPassword.password;

    res.status(200)
        .cookie("token", accessToken, options)
        .json({
            message: `You are logged in, ${user.name}`,
            token: accessToken,
            user: userWithoutPassword,
        });
};

const createUser = async (req, res, next) => {
    const { name, username, email, password } = req.body;

    if ([name, username, password, email].some((e) => !e)) {
        throw new ApiError("You have to provide all the fields", 400);
    }

    //check if user already exists or not
    const userExist = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (userExist) {
        throw new ApiError("User with this email/username exists", 400);
    }

    //create new user
    const user = await User.create({
        name,
        username,
        email,
        password,
    });

    const accessToken = generateAccessToken(user);
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };

    res.status(201).cookie("token", accessToken, options).json({
        message: "User created successfully",
        success: true,
        user,
    });
};

const logoutUser = async (req, res, next) => {
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };
    res.status(200)
        .clearCookie("token", options)
        .json({ message: "User logged out successfully" });
};

const getUserCreatedPolls = async (req, res, next) => {
    const { id } = req.params;
    const { q, visibility, limit, offset } = req.query;

    if (!id) {
        throw new ApiError("User not provided", 401);
    }

    let visibilityQuery = {};
    if (visibility !== "all") {
        visibilityQuery.poll_status = visibility;
    }

    // Fetch polls and totalPolls based on (private, public, closed and active)

    let totalPolls;
    let polls;
    if (q === "all") {
        polls = await Poll.find({ user: id, ...visibilityQuery })
            .limit(limit)
            .skip(offset);

        totalPolls = await Poll.find({
            user: id,
            ...visibilityQuery,
        }).countDocuments();
    } else if (q === "active") {
        polls = await Poll.find({
            user: id,
            expiresAt: { $gt: new Date() },
            ...visibilityQuery,
        })
            .limit(limit)
            .skip(offset);

        totalPolls = await Poll.find({
            user: id,
            expiresAt: { $gt: new Date() },
            ...visibilityQuery,
        }).countDocuments();
    } else if (q === "closed") {
        polls = await Poll.find({
            user: id,
            expiresAt: { $lt: new Date() },
            ...visibilityQuery,
        })
            .limit(limit)
            .skip(offset);

        totalPolls = await Poll.find({
            user: id,
            expiresAt: { $lt: new Date() },
            ...visibilityQuery,
        }).countDocuments();
    }

    // include virtuals 'formattedVote'
    let pollsWithVirtuals = polls.map((poll) => poll.toObject());

    res.status(200).json({
        success: true,
        polls: pollsWithVirtuals,
        total: totalPolls,
    });
};

const getUserVotedPolls = async (req, res, next) => {
    const { id } = req.params;

    const { q = "all", visibility = "all", limit = 5, offset = 0 } = req.query;

    if (!id) {
        throw new ApiError("User not provided", 401);
    }

    let visibilityQuery = {};
    if (visibility !== "all") {
        visibilityQuery.poll_status = visibility;
    }

    // Fetch user voted polls and totalPolls based on (private, public, closed and active)

    let totalPolls;
    let polls;
    if (q === "all") {
        polls = await Poll.find({ "votes.user": id, ...visibilityQuery })
            .populate("user", "-password")
            .limit(limit)
            .skip(offset);

        totalPolls = await Poll.find({
            "votes.user": id,
            ...visibilityQuery,
        }).countDocuments();
    } else if (q === "active") {
        polls = await Poll.find({
            "votes.user": id,
            expiresAt: { $gt: new Date() },
            ...visibilityQuery,
        })
            .populate("user", "-password")
            .limit(limit)
            .skip(offset);

        totalPolls = await Poll.find({
            "votes.user": id,
            expiresAt: { $gt: new Date() },
            ...visibilityQuery,
        }).countDocuments();
    } else if (q === "closed") {
        polls = await Poll.find({
            "votes.user": id,
            expiresAt: { $lt: new Date() },
            ...visibilityQuery,
        })
            .populate("user", "-password")
            .limit(limit)
            .skip(offset);

        totalPolls = await Poll.find({
            "votes.user": id,
            expiresAt: { $lt: new Date() },
            ...visibilityQuery,
        }).countDocuments();
    }

    // // include virtuals 'formattedVote'
    let pollsWithVirtuals = polls.map((poll) => poll.toObject());

    res.status(200).json({
        success: true,
        polls: pollsWithVirtuals,
        total: totalPolls,
    });
};

const userStats = async (req, res, next) => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7); // Start of current week
    startOfWeek.setHours(startOfWeek.getHours() + 5);
    startOfWeek.setMinutes(startOfWeek.getMinutes() + 30);

    const endOfWeek = new Date();
    endOfWeek.setHours(endOfWeek.getHours() + 5);
    endOfWeek.setMinutes(endOfWeek.getMinutes() + 30);

    console.log(startOfWeek);
    console.log(endOfWeek);

    const last_seven_day_stats = await Poll.aggregate([
        {
            $match: {
                user: req.user._id,
            },
        },
        {
            $unwind: "$votes",
        },
        {
            $match: {
                "votes.votedAt": {
                    $gte: startOfWeek,
                    $lt: endOfWeek,
                },
            },
        },
        {
            $group: {
                _id: {
                    day: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$votes.votedAt",
                        },
                    },
                    option: "$votes.option",
                },
                count: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: "$_id.day",
                total: { $sum: "$count" },
            },
        },
        {
            $project: {
                _id: 0,
                day: "$_id",
                total: 1,
            },
        },
        { $sort: { day: 1 } },
    ]);

    // get total votes, views and total polls
    let user_polls_stats = await Poll.aggregate([
        {
            $match: {
                user: req.user._id,
            },
        },
        {
            $group: {
                _id: null,
                totalVotes: { $sum: { $size: "$votes" } },
                totalViews: { $sum: "$views" },
                totalPolls: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0, // exclude id from result
            },
        },
    ]);

    res.status(200).json({
        success: true,
        data: user_polls_stats[0],
        chart_data: last_seven_day_stats,
    });
};

export {
    loginUser,
    createUser,
    logoutUser,
    getUser,
    getUserCreatedPolls,
    userStats,
    getUserVotedPolls,
};
