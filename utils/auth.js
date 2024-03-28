import jwt from "jsonwebtoken";

import { User } from "../models/User.js";
import { ApiError } from "./ApiError.js";
import { asyncHandler } from "./asyncHandler.js";

const isAuthenticated = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token;
    console.log("token here = ", token);
    if (!token) {
        throw new ApiError("You are not logged in !!!", 401);
    }

    let verifyToken;
    try {
        verifyToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError("You are not authenticated. Login again", 403);
    }

    const user = await User.findById(verifyToken.userId);
    console.log(user);

    if (!user) {
        throw new ApiError("Invalid Access Token", 401);
    }
    req.user = user;

    next();
});

const generateAccessToken = (user) => {
    try {
        const token = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET
        );
        return token;
    } catch (error) {
        throw new ApiError(
            "Something went wrong while generating access token.",
            500
        );
    }
};

export { generateAccessToken, isAuthenticated };
