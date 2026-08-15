//const express = require("express");
import express from "express";
import cors from "cors";
import "dotenv/config";

import fs from "fs";
import path from "path";
import {connectDB} from "./lib/db.js";
import { clerkMiddleware } from '@clerk/express'

const app = express();
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
const publicDir = path.join(process.cwd(), "public");

app.use(express.json());
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(clerkMiddleware())

if(fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get("/{*any}", (req, res, next) => {
        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
    });
}   


app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server mast chal raha hai" });
});

app.listen(PORT, ()=> {
    connectDB();
    console.log(`Rohan bhaiya ka server running on port number ${PORT} or kya bas`)
});