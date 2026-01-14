import express from "express";
import reviewController from "./review.controller.js";
import authorize from "../../../middlewares/auth.js";

const router = express.Router();

router.use(authorize("user"));

// User review routes
router.post("/books/:bookId", reviewController.submitReview);
router.get("/", reviewController.getUserReviews);
router.get("/books/:bookId", reviewController.getBookReviews);
router.put("/:reviewId", reviewController.updateReview);
router.delete("/:reviewId", reviewController.deleteReview);

export default router;
