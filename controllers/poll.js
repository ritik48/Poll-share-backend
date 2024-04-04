import { Poll } from "../models/Poll.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

// GET ALL POLLS
const fetchAllPolls = async (req, res, next) => {
    const polls = await Poll.find({}).populate("user", "-password");

    res.status(200).json({ polls });
};

// GET POLL BY ID
const fetchPoll = async (req, res, next) => {
    const { id } = req.params;
    const poll = await Poll.findById(id).populate("user", "-password");

    if (!poll) {
        throw new ApiError("Cannot find this poll", 404);
    }

    res.status(200).json({ poll });
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
    const { title, options } = req.body;

    if (!title) {
        throw new ApiError("Please provide title for the poll", 401);
    }
    if (options.length < 2) {
        throw new ApiError("Please provide at least two options", 401);
    }

    const poll = await Poll.create({ title, options, user: req.user._id });

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
    const poll = await Poll.findById(id);
    if (isNaN(parseInt(choice)) || poll.options.length < parseInt(choice)) {
        throw new ApiError("Invalid choice", 401);
    }

    if (!poll.votes.has(choice)) {
        poll.votes.set(choice, 0);
    }

    const currentVoteCount = parseInt(poll.votes.get(choice));

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

        poll.votes.set(choice, currentVoteCount + 1);
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

            poll.votes.set(choice, currentVoteCount - 1);
        } else {
            updatedUser = await User.findOneAndUpdate(
                { _id: req.user._id, "vote.poll_id": id }, // Find the user and the vote element with the specified poll_id
                { $set: { "vote.$.poll_choice": choice } }, // Update the poll_choice for the found element
                { new: true } // To return the updated document
            );

            const previousVoteCount = parseInt(poll.votes.get(previousChoice));
            poll.votes.set(previousChoice, previousVoteCount - 1);

            poll.votes.set(choice, currentVoteCount + 1);
        }
    }

    await poll.save();

    res.status(201).json({
        message: "success",
        success: true,
        user: updatedUser,
    });
};

export { fetchAllPolls, fetchPoll, createPoll, voteOption };
