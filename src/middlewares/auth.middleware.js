// sirf verfiy karga ki user h ki nhi h
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


export const verfiyJWT = asyncHandler (async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authrization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiError(401, "Unauthorized Requset")
        }
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        .select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Internal Server Error")
    }
})