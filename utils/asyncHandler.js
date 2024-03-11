import { ApiError } from "./ApiError.js";


const asyncHandler = (fn) => async (req, res, next) => {
	try {
		await fn(req, res, next);
	} catch (error) {
		next(new ApiError(error.message, 401));
	}
};

export { asyncHandler };