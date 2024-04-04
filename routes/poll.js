import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    createPoll,
    deletePoll,
    fetchAllPolls,
    fetchPoll,
    voteOption,
} from "../controllers/poll.js";
import { isAuthenticated } from "../utils/auth.js";

const pollRouter = express.Router();

pollRouter.get("/", asyncHandler(fetchAllPolls));
pollRouter.post("/new", isAuthenticated, asyncHandler(createPoll));
pollRouter.get("/:id", asyncHandler(fetchPoll));
pollRouter.delete("/:id", isAuthenticated, asyncHandler(deletePoll));
pollRouter.post("/vote/:id", isAuthenticated, asyncHandler(voteOption));

export { pollRouter };
