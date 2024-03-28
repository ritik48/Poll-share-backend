import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    createPoll,
    fetchAllPolls,
    fetchPoll,
    voteOption,
} from "../controllers/poll.js";
import { isAuthenticated } from "../utils/auth.js";

const pollRouter = express.Router();

pollRouter.get("/", asyncHandler(fetchAllPolls));
pollRouter.post("/new", isAuthenticated, asyncHandler(createPoll));
pollRouter.get("/:id", asyncHandler(fetchPoll));
pollRouter.post("/vote/:id", asyncHandler(voteOption));

export { pollRouter };
