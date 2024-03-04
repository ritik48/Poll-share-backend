import mongoose from "mongoose";

const Schema = mongoose.Schema;

const commentSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
	comment: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const Comment = mongoose.model("comment", commentSchema);
export { Comment };
