import { ObjectId } from "mongodb";
import { reviewsCollection, booksCollection, userLibraryCollection } from "../../../config/mongodb.js";

const getPendingReviews = async (req, res) => {
	try {
		const { page = 1, limit = 10 } = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		const reviews = await reviewsCollection
			.aggregate([
				{ $match: { status: "pending" } },
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
					$lookup: {
						from: "users",
						localField: "userId",
						foreignField: "_id",
						as: "user",
					},
				},
				{ $unwind: "$user" },
				{ $skip: skip },
				{ $limit: parseInt(limit) },
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
						"user._id": 1,
						"user.name": 1,
						"user.email": 1,
					},
				},
			])
			.toArray();

		const total = await reviewsCollection.countDocuments({ status: "pending" });

		return res.status(200).json({
			success: true,
			message: "Pending reviews retrieved successfully",
			data: {
				reviews,
				pagination: {
					currentPage: parseInt(page),
					totalPages: Math.ceil(total / parseInt(limit)),
					totalReviews: total,
					hasNext: skip + parseInt(limit) < total,
					hasPrev: skip > 0,
				},
			},
		});
	} catch (error) {
		console.error("Error retrieving pending reviews:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const approveReview = async (req, res) => {
	try {
		const { reviewId } = req.params;

		const review = await reviewsCollection.findOne({ _id: new ObjectId(reviewId) });

		if (!review) {
			return res.status(404).json({
				success: false,
				message: "Review not found",
			});
		}

		if (review.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "Review has already been processed",
			});
		}

		await reviewsCollection.updateOne(
			{ _id: new ObjectId(reviewId) },
			{ $set: { status: "approved", updatedAt: new Date() } }
		);

		// Update book's average rating and total reviews
		await updateBookRating(review.bookId.toString());

		return res.status(200).json({
			success: true,
			message: "Review approved successfully",
		});
	} catch (error) {
		console.error("Error approving review:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const rejectReview = async (req, res) => {
	try {
		const { reviewId } = req.params;

		const review = await reviewsCollection.findOne({ _id: new ObjectId(reviewId) });

		if (!review) {
			return res.status(404).json({
				success: false,
				message: "Review not found",
			});
		}

		if (review.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "Review has already been processed",
			});
		}

		await reviewsCollection.updateOne(
			{ _id: new ObjectId(reviewId) },
			{ $set: { status: "rejected", updatedAt: new Date() } }
		);

		return res.status(200).json({
			success: true,
			message: "Review rejected successfully",
		});
	} catch (error) {
		console.error("Error rejecting review:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const deleteReview = async (req, res) => {
	try {
		const { reviewId } = req.params;

		const review = await reviewsCollection.findOne({ _id: new ObjectId(reviewId) });

		if (!review) {
			return res.status(404).json({
				success: false,
				message: "Review not found",
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

const getReviewStats = async (req, res) => {
	try {
		const stats = await reviewsCollection
			.aggregate([
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
					},
				},
			])
			.toArray();

		const totalReviews = await reviewsCollection.countDocuments();
		const pendingReviews = await reviewsCollection.countDocuments({ status: "pending" });

		return res.status(200).json({
			success: true,
			message: "Review stats retrieved successfully",
			data: {
				totalReviews,
				pendingReviews,
				stats: stats.reduce((acc, stat) => {
					acc[stat._id] = stat.count;
					return acc;
				}, {}),
			},
		});
	} catch (error) {
		console.error("Error retrieving review stats:", error);
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

const adminReviewController = {
	getPendingReviews,
	approveReview,
	rejectReview,
	deleteReview,
	getReviewStats,
};

export default adminReviewController;
