import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMe, getAvailableUsers } from "../controllers/user.controller.js";

const router = express.Router();
router.use(protectRoute);

router.get("/me", getMe);
router.get("/available", getAvailableUsers);

export default router;
