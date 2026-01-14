import express from "express";
import adminReviewController from "./review.controller.js";
import authorize from "../../../middlewares/auth.js";

const router = express.Router();

// All routes are protected and require admin role
router.use(authorize("admin"));

// Admin review moderation routes
router.get("/pending", adminReviewController.getPendingReviews);
router.put("/:reviewId/approve", adminReviewController.approveReview);
router.put("/:reviewId/reject", adminReviewController.rejectReview);
router.delete("/:reviewId", adminReviewController.deleteReview);
router.get("/stats", adminReviewController.getReviewStats);
export default router;
