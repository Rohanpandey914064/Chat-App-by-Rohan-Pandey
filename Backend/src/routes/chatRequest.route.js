import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import {
  sendRequest,
  getIncomingRequest,
  acceptRequest,
  rejectRequest,
} from "../controllers/chatRequest.controller.js";

const router = express.Router();
router.use(protectRoute);

// Send a chat request — rate limited to 5 per minute per user
router.post(
  "/",
  rateLimit({ windowMs: 60_000, max: 5, message: "Too many chat requests. Wait a moment." }),
  sendRequest
);

// Get current user's incoming pending request
router.get("/incoming", getIncomingRequest);

// Accept or reject a request
router.post("/:id/accept", acceptRequest);
router.post("/:id/reject", rejectRequest);

export default router;
