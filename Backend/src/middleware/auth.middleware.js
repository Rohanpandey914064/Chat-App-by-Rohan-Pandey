import {getAuth} from "@clerk/express";
import User from "../models/user.model.js";

export async function protectRoute(req, res, next) {
    try {
        const {userId} = getAuth(req);  
        if(!userId) {
            return res.status(401).json({message: "Unauthorized"});
        }
        const user = await User.findOne({clerkId: userId});
        if(!user) {
            return res.status(401).json({message: "Unauthorized - beta tum database me nahi ho"});
        }
        req.user = user;
        next();
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}
