import mongoose from "mongoose";
import bcrypt from "bcrypt";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
    },
});

userSchema.methods.isPasswordValid = async function (password) {
    const verify = await bcrypt.compare(password, this.password);
    console.log("verify = ", verify);
    return verify;
};

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const passwordHash = await bcrypt.hash(this.password, 10);
    this.password = passwordHash;

    next();
});

const User = mongoose.model("user", userSchema);
export { User };
