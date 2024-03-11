import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

import { userRouter } from "./routes/user.js";
import { connectDB } from "./db/db.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", userRouter);

app.use((err, req, res, next) => {
	const { status = 500, message = "Something went wrong" } = err;
	res.status(status).json({
		message,
	});
});

connectDB()
	.then(() => {
		app.listen(3000, () => {
			console.log("Listening on port 3000...");
		});
	})
	.catch((err) => {
		console.log("Cannot connect to databse ", err);
		process.exit(1);
	});
