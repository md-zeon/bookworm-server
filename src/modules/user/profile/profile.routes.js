import express from "express";
import profileController from "./profile.controller.js";
import authorize from "../../../middlewares/auth.js";

const router = express.Router();

// All routes are protected
router.use(authorize("user", "admin"));

// User profile routes
router.get("/", profileController.getCurrentUserProfile);
router.put("/", profileController.updateCurrentUserProfile);

export default router;
