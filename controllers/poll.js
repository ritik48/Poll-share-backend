import mongoose from "mongoose";
import { Poll } from "../models/Poll.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

// GET ALL POLLS
const fetchAllPolls = async (req, res, next) => {
    const { q="all", visibility="all", limit=10, offset=0 } = req.query;

    let visibilityQuery = {};
    if (visibility !== "all") {
        visibilityQuery.poll_status = visibility;
    }

    // Fetch polls and totalPolls based on (private, public, closed and active)

    let totalPolls;
    let polls;
    if (q === "all") {
        polls = await Poll.find({ ...visibilityQuery })
            .populate("user")
            .limit(limit)
            .skip(offset);

        totalPolls = await Poll.find({
            ...visibilityQuery,
        }).countDocuments();
    } else if (q === "active") {
        polls = await Poll.find({
            expiresAt: { $gt: new Date() },
            ...visibilityQuery,
        })
            .populate("user")
            .limit(limit)
            .skip(offset);

        totalPolls = await Poll.find({
            expiresAt: { $gt: new Date() },
            ...visibilityQuery,
        }).countDocuments();
    } else if (q === "closed") {
        polls = await Poll.find({
            expiresAt: { $lt: new Date() },
            ...visibilityQuery,
        })
            .populate("user")
            .limit(limit)
            .skip(offset);

        totalPolls = await Poll.find({
            expiresAt: { $lt: new Date() },
            ...visibilityQuery,
        }).countDocuments();
    }

    // include virtuals 'formattedVote'
    let pollsWithVirtuals = polls.map((poll) => poll.toObject());

    res.status(200).json({
        polls: pollsWithVirtuals,
        total: totalPolls,
        success: true,
    });
};

// GET POLL BY ID
const fetchPoll = async (req, res, next) => {
    const { id } = req.params;
    const poll = await Poll.findById(id).populate("user", "-password");

    if (!poll) {
        throw new ApiError("Cannot find this poll", 404);
    }

    // include virtuals 'formattedVote'
    const p = poll.toObject();
    let pollsWithVirtuals = { ...p };

    res.status(200).json({ polls: pollsWithVirtuals });
};

export const deletePoll = async (req, res, next) => {
    const { id } = req.params;
    await Poll.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "Poll deleted successfully",
    });
};

// CREATE A NEW POLL
const createPoll = async (req, res, next) => {
    const { title, options, expiresAt, category, status } = req.body;

    const poll_visibility = status ? "private" : "public";

    if (!title) {
        throw new ApiError("Please provide title for the poll", 401);
    }
    if (options.length < 2) {
        throw new ApiError("Please provide at least two options", 401);
    }

    const poll = await Poll.create({
        title,
        options,
        user: req.user._id,
        expiresAt,
        category,
        poll_status: poll_visibility,
    });

    res.status(201).json({
        message: "Poll created successfully.",
        success: true,
        poll,
    });
};

const voteOption = async (req, res, next) => {
    const { id } = req.params;
    let { choice } = req.query;

    if (!id || !choice) {
        throw new ApiError("Invalid response", 401);
    }
    let poll = await Poll.findById(id);
    if (isNaN(parseInt(choice)) || poll.options.length < parseInt(choice)) {
        throw new ApiError("Invalid choice", 401);
    }

    const hasVotedBefore = await User.findOne({
        _id: req.user._id,
        "vote.poll_id": id,
    });

    let updatedUser;

    if (!hasVotedBefore) {
        updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $push: { vote: { poll_id: id, poll_choice: choice } } },
            { new: true }
        );

        // Add the users current choice
        const votedTime = new Date();
        votedTime.setSeconds(votedTime.getSeconds() + 19800);

        poll = await Poll.findByIdAndUpdate(
            id,
            {
                $push: {
                    votes: {
                        option: choice,
                        votedAt: votedTime,
                        user: req.user._id,
                    },
                },
            },
            { new: true }
        );
    } else {
        const previousChoice = hasVotedBefore.vote
            .find((v) => v.poll_id.toString() === id)
            .poll_choice.toString();

        if (previousChoice === choice) {
            updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                {
                    $pull: { vote: { poll_id: id } },
                },
                { new: true }
            );

            const userId = new mongoose.Types.ObjectId(req.user._id);

            // Remove the users previous choice
            poll = await Poll.findByIdAndUpdate(
                id,
                {
                    $pull: {
                        votes: {
                            user: userId,
                        },
                    },
                },
                { new: true }
            );
        } else {
            updatedUser = await User.findOneAndUpdate(
                { _id: req.user._id, "vote.poll_id": id }, // Find the user and the vote element with the specified poll_id
                { $set: { "vote.$.poll_choice": choice } }, // Update the poll_choice for the found element
                { new: true } // To return the updated document
            );

            const userId = new mongoose.Types.ObjectId(req.user._id);

            // Remove the users previous choice
            poll = await Poll.findByIdAndUpdate(
                id,
                {
                    $pull: {
                        votes: {
                            user: userId,
                        },
                    },
                },
                { new: true }
            );

            // Add the users current choice
            const votedTime = new Date();
            votedTime.setSeconds(votedTime.getSeconds() + 19800);

            poll = await Poll.findByIdAndUpdate(
                id,
                {
                    $push: {
                        votes: {
                            option: choice,
                            votedAt: votedTime,
                            user: req.user._id,
                        },
                    },
                },
                { new: true }
            );
        }
    }

    res.status(201).json({
        message: "success",
        success: true,
        user: updatedUser,
        poll,
    });
};

export { fetchAllPolls, fetchPoll, createPoll, voteOption };
