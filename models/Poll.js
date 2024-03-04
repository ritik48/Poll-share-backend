import mongoose from "mongoose";

const Schema = mongoose.Schema;

const pollSchema = new Schema({
	title: {
		type: String,
		required: true,
	},
	options: {
		type: [String],
		required: true,
	},
	votes: {
		type: Map, // Using Map to store key-value pairs
		of: Number, // Value type is Number, representing vote counts
		default: new Map(), // Default to an empty Map
	},
	comments: [
		{
			type: Schema.Types.ObjectId,
			ref: "Comment",
		},
	],
	user: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const Poll = mongoose.model("Poll", pollSchema);

export { Poll };
