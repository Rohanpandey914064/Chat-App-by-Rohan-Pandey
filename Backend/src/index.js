//const express = require("express");
import express from "express";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT;
console.log(process.env.NAME);

app.listen(PORT, ()=> console.log(`Rohan bhaiya ka server running on port number ${PORT} or kya bas`));