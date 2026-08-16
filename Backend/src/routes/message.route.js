import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar , getConversationsForSidebar , getMessages ,sendMessage } from "../controllers/message.controller.js";
import { upload }from "../middleware/upload.middleware.js";

const router = express.Router();
router.use(protectRoute); // Apply the protectRoute middleware to all routes in this router

router.get("/users", getUsersForSidebar);
router.get("/conversations", getConversationsForSidebar);
router.get("/:id", getMessages);
router.post("/send/:id",upload.single("media") ,sendMessage);

export default router;