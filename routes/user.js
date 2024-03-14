import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginUser, createUser, logoutUser } from "../controllers/user.js";
import { isAuthenticated } from "../utils/auth.js";

const userRouter = express.Router();

userRouter.post("/login", asyncHandler(loginUser));
userRouter.post("/signup", asyncHandler(createUser));
userRouter.get("/secret", isAuthenticated, (req, res) => {
	const { name } = req.user;
	res.json({ message: `you are logged in, ${name}` });
});
userRouter.post("/logout", isAuthenticated, logoutUser);

export { userRouter };
