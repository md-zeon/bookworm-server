import express from "express";
import goalsController from "./goals.controller.js";
import authorize from "../../../middlewares/auth.js";

const router = express.Router();

// All routes are protected
router.use(authorize("user", "admin"));

// User goals and stats routes
router.post("/goals", goalsController.setReadingGoal);
router.get("/stats", goalsController.getReadingStats);
router.get("/stats/monthly", goalsController.getMonthlyProgress);
router.get("/stats/genres", goalsController.getGenreBreakdown);

export default router;
