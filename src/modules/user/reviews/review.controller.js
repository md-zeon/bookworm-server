import { ObjectId } from "mongodb";
import { reviewsCollection, booksCollection, userLibraryCollection } from "../../../config/mongodb.js";

const submitReview = async (req, res) => {
	try {
		const { bookId } = req.params;
		const { rating, text } = req.body;
		const userId = req.user._id;

		if (!rating || rating < 1 || rating > 5) {
			return res.status(400).json({
				success: false,
				message: "Rating is required and must be between 1 and 5",
			});
		}

		if (!text || text.trim().length < 10) {
			return res.status(400).json({
				success: false,
				message: "Review text is required and must be at least 10 characters long",
			});
		}

		// Check if user has read the book
		const libraryItem = await userLibraryCollection.findOne({
			userId: new ObjectId(userId),
			bookId: new ObjectId(bookId),
			shelf: "read",
		});

		if (!libraryItem) {
			return res.status(400).json({
				success: false,
				message: "You can only review books you have finished reading",
			});
		}

		// Check if book exists
		const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
		if (!book) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		// Check if user already reviewed this book
		const existingReview = await reviewsCollection.findOne({
			userId: new ObjectId(userId),
			bookId: new ObjectId(bookId),
		});

		if (existingReview) {
			return res.status(409).json({
				success: false,
				message: "You have already reviewed this book",
			});
		}

		const review = {
			userId: new ObjectId(userId),
			bookId: new ObjectId(bookId),
			rating,
			text: text.trim(),
			status: "pending", // pending, approved, rejected
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await reviewsCollection.insertOne(review);

		// Update book's average rating and total reviews
		await updateBookRating(bookId);

		return res.status(201).json({
			success: true,
			message: "Review submitted successfully",
			data: {
				...review,
				_id: result.insertedId,
			},
		});
	} catch (error) {
		console.error("Error submitting review:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getUserReviews = async (req, res) => {
	try {
		const userId = req.user._id;
		const { status } = req.query; // approved, pending, rejected

		const matchStage = { userId: new ObjectId(userId) };
		if (status && ["approved", "pending", "rejected"].includes(status)) {
			matchStage.status = status;
		}

		const reviews = await reviewsCollection
			.aggregate([
				{ $match: matchStage },
				{ $sort: { createdAt: -1 } },
				{
					$lookup: {
						from: "books",
						localField: "bookId",
						foreignField: "_id",
						as: "book",
					},
				},
				{ $unwind: "$book" },
				{
					$project: {
						_id: 1,
						rating: 1,
						text: 1,
						status: 1,
						createdAt: 1,
						updatedAt: 1,
						"book._id": 1,
						"book.title": 1,
						"book.author": 1,
						"book.coverImage": 1,
					},
				},
			])
			.toArray();

		return res.status(200).json({
			success: true,
			message: "Reviews retrieved successfully",
			data: reviews,
		});
	} catch (error) {
		console.error("Error retrieving reviews:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getBookReviews = async (req, res) => {
	try {
		const { bookId } = req.params;

		// Check if book exists
		const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
		if (!book) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		const reviews = await reviewsCollection
			.aggregate([
				{ $match: { bookId: new ObjectId(bookId), status: "approved" } },
				{ $sort: { createdAt: -1 } },
				{
					$lookup: {
						from: "users",
						localField: "userId",
						foreignField: "_id",
						as: "user",
					},
				},
				{ $unwind: "$user" },
				{
					$project: {
						_id: 1,
						rating: 1,
						text: 1,
						status: 1,
						createdAt: 1,
						updatedAt: 1,
						"user._id": 1,
						"user.name": 1,
						"user.photoURL": 1,
					},
				},
			])
			.toArray();

		return res.status(200).json({
			success: true,
			message: "Book reviews retrieved successfully",
			data: reviews,
		});
	} catch (error) {
		console.error("Error retrieving book reviews:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const updateReview = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const { rating, text } = req.body;
		const userId = req.user._id;

		if (!rating || rating < 1 || rating > 5) {
			return res.status(400).json({
				success: false,
				message: "Rating is required and must be between 1 and 5",
			});
		}

		if (!text || text.trim().length < 10) {
			return res.status(400).json({
				success: false,
				message: "Review text is required and must be at least 10 characters long",
			});
		}

		const review = await reviewsCollection.findOne({
			_id: new ObjectId(reviewId),
			userId: new ObjectId(userId),
		});

		if (!review) {
			return res.status(404).json({
				success: false,
				message: "Review not found or you don't have permission to edit it",
			});
		}

		if (review.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "Cannot edit a review that has been approved or rejected",
			});
		}

		const updatedReview = {
			rating,
			text: text.trim(),
			updatedAt: new Date(),
		};

		await reviewsCollection.updateOne(
			{ _id: new ObjectId(reviewId) },
			{ $set: updatedReview }
		);

		return res.status(200).json({
			success: true,
			message: "Review updated successfully",
			data: { ...review, ...updatedReview },
		});
	} catch (error) {
		console.error("Error updating review:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const deleteReview = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const userId = req.user._id;

		const review = await reviewsCollection.findOne({
			_id: new ObjectId(reviewId),
			userId: new ObjectId(userId),
		});

		if (!review) {
			return res.status(404).json({
				success: false,
				message: "Review not found or you don't have permission to delete it",
			});
		}

		await reviewsCollection.deleteOne({ _id: new ObjectId(reviewId) });

		// Update book's average rating and total reviews
		await updateBookRating(review.bookId.toString());

		return res.status(200).json({
			success: true,
			message: "Review deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting review:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const updateBookRating = async (bookId) => {
	try {
		const result = await reviewsCollection
			.aggregate([
				{ $match: { bookId: new ObjectId(bookId), status: "approved" } },
				{
					$group: {
						_id: null,
						averageRating: { $avg: "$rating" },
						totalReviews: { $sum: 1 },
					},
				},
			])
			.toArray();

		const { averageRating = 0, totalReviews = 0 } = result[0] || {};

		await booksCollection.updateOne(
			{ _id: new ObjectId(bookId) },
			{
				$set: {
					averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
					totalReviews,
				},
			}
		);
	} catch (error) {
		console.error("Error updating book rating:", error);
	}
};

const reviewController = {
	submitReview,
	getUserReviews,
	getBookReviews,
	updateReview,
	deleteReview,
};

export default reviewController;
