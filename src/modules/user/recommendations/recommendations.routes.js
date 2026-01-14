import express from "express";
import recommendationsController from "./recommendations.controller.js";
import authorize from "../../../middlewares/auth.js";

const router = express.Router();

// All routes are protected
router.use(authorize("user"));

// User recommendations routes
router.get("/recommendations", recommendationsController.getRecommendations);

export default router;
