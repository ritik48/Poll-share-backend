import mongoose from "mongoose";

const Schema = mongoose.Schema;

const pollSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        options: {
            type: [String],
            required: true,
        },
        votes: {
            type: [
                {
                    option: Number, // Option voted for
                    votedAt: {
                        type: Date,
                        default: Date.now, // Timestamp when the vote was casted
                    },
                    user: {
                        // user who cast the vote
                        type: Schema.Types.ObjectId,
                        ref: "user",
                    },
                },
            ],
            default: [], // Default to an empty array
        },
        views: {
            type: Number,
        },
        poll_status: {
            type: String,
        },
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: "comment",
            },
        ],
        user: {
            type: Schema.Types.ObjectId,
            ref: "user",
        },
        image: {
            type: String,
        },
        category: {
            type: [String],
        },
        publishedAt: {
            type: Date,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

pollSchema.set("toObject", { virtuals: true });
pollSchema.set("toJson", { virtuals: true });

pollSchema.virtual("formattedVote").get(function () {
    const votes = {};
    Array.from({ length: this.options.length }, (_, i) => (votes[i] = 0));

    this.votes.forEach((vote) => {
        if (votes.hasOwnProperty(vote.option)) {
            votes[vote.option]++;
        }
    });
    return votes;
});

pollSchema.virtual("isLive").get(function () {
    const isPollLive = this.expiresAt > new Date();

    return isPollLive;
});

pollSchema.virtual("totalVotes").get(function () {
    const total = this.votes.length;

    return total;
});

const Poll = mongoose.model("Poll", pollSchema);

export { Poll };
