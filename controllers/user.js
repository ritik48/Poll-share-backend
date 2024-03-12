import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken } from "../utils/auth.js";

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
	const options = { httpOnly: true, secure: true };

	res
		.status(200)
		.cookie("token", accessToken, options)
		.json({
			message: `You are logged in, ${user.name}`,
			token: accessToken,
		});
};

const createUser = async (req, res, next) => {
	const { name, username, email, password } = req.body;

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

	res.status(201).json({
		message: "User created successfully",
	});
};

const logoutUser = async (req, res, next) => {
	const options = { httpOnly: true, secure: true };
	res
		.status(200)
		.clearCookie("token", options)
		.json({ message: "User logged out successfully" });
};

export { loginUser, createUser, logoutUser };
