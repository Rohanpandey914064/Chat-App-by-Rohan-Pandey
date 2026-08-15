import mongoose from "mongoose";

export async function connectDB() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is required leke aao usko please ");
        }

        const conn = await mongoose.connect(mongoUri);
        console.log("MongoDB connected",conn.connection.host);
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1); // Exit the process with failure
    }
} 