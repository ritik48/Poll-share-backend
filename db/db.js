import mongoose from "mongoose";

const connectDB = async () => {
	const connection = await mongoose.connect("mongodb://127.0.0.1:27017/poll-share");
	console.log("Database connected: ", connection.connection.host);
};

export { connectDB };
