import { Poll } from "../models/Poll.js";
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

// CREATE A NEW POLL
const createPoll = async (req, res, next) => {
	const { title, options } = req.body;

	if (!title) {
		throw new ApiError("Please provide title for the poll", 401);
	}
	if (options.length < 2) {
		throw new ApiError("Please provide at least two options", 401);
	}

	await Poll.create({ title, options, user: req.user._id });

	res.status(201).json({ message: "Poll created successfully." });
};

const voteOption = async (req, res, next) => {
	const { id } = req.params;
	let { choice } = req.query;

	if (!id || !choice) {
		throw new ApiError("Invalid response", 401);
	}
	const poll = await Poll.findById(id);
	if (!parseInt(choice) || poll.options.length < choice) {
		throw new ApiError("Invalid choice", 401);
	}

	if (!poll.votes.has(choice)) {
		poll.votes.set(choice, 0);
	}
	const currentVoteCount = parseInt(poll.votes.get(choice));
	poll.votes.set(choice, currentVoteCount + 1);

	await poll.save();

	res.status(201).json({ message: "Success" });
};

export { fetchAllPolls, fetchPoll, createPoll, voteOption };
