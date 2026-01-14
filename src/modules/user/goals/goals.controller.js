import { ObjectId } from "mongodb";
import { readingGoalsCollection, userLibraryCollection } from "../../../config/mongodb.js";

const setReadingGoal = async (req, res) => {
	try {
		const { annualGoal } = req.body;
		const userId = req.user._id;

		if (!annualGoal || annualGoal < 1) {
			return res.status(400).json({
				success: false,
				message: "Annual reading goal is required and must be greater than 0",
			});
		}

		const currentYear = new Date().getFullYear();
		const startDate = new Date(currentYear, 0, 1); // January 1st of current year

		const goal = {
			userId: new ObjectId(userId),
			annualGoal,
			currentYear,
			startDate,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await readingGoalsCollection.updateOne(
			{ userId: new ObjectId(userId) },
			{ $set: goal },
			{ upsert: true }
		);

		return res.status(200).json({
			success: true,
			message: "Reading goal set successfully",
			data: {
				...goal,
				_id: result.upsertedId || (await readingGoalsCollection.findOne({ userId: new ObjectId(userId) }))._id,
			},
		});
	} catch (error) {
		console.error("Error setting reading goal:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getReadingStats = async (req, res) => {
	try {
		const userId = req.user._id;
		const currentYear = new Date().getFullYear();

		// Get reading goal
		const goal = await readingGoalsCollection.findOne({ userId: new ObjectId(userId) });

		// Get library stats
		const stats = await userLibraryCollection
			.aggregate([
				{
					$match: {
						userId: new ObjectId(userId),
						updatedAt: { $gte: new Date(currentYear, 0, 1) },
					},
				},
				{
					$group: {
						_id: null,
						booksRead: {
							$sum: { $cond: [{ $eq: ["$shelf", "read"] }, 1, 0] },
						},
						booksCurrentlyReading: {
							$sum: { $cond: [{ $eq: ["$shelf", "currentlyReading"] }, 1, 0] },
						},
						booksWantToRead: {
							$sum: { $cond: [{ $eq: ["$shelf", "wantToRead"] }, 1, 0] },
						},
						totalPagesRead: {
							$sum: { $cond: [{ $eq: ["$shelf", "read"] }, "$progress", 0] },
						},
						totalPagesCurrentlyReading: {
							$sum: { $cond: [{ $eq: ["$shelf", "currentlyReading"] }, "$progress", 0] },
						},
					},
				},
			])
			.toArray();

		const currentStats = stats[0] || {
			booksRead: 0,
			booksCurrentlyReading: 0,
			booksWantToRead: 0,
			totalPagesRead: 0,
			totalPagesCurrentlyReading: 0,
		};

		// Calculate reading streak
		const readingStreak = await calculateReadingStreak(userId);

		return res.status(200).json({
			success: true,
			message: "Reading stats retrieved successfully",
			data: {
				goal: goal || null,
				stats: {
					...currentStats,
					year: currentYear,
				},
				readingStreak,
			},
		});
	} catch (error) {
		console.error("Error retrieving reading stats:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getMonthlyProgress = async (req, res) => {
	try {
		const userId = req.user._id;
		const { year = new Date().getFullYear() } = req.query;
		const targetYear = parseInt(year);

		const monthlyProgress = await userLibraryCollection
			.aggregate([
				{
					$match: {
						userId: new ObjectId(userId),
						shelf: "read",
						updatedAt: {
							$gte: new Date(targetYear, 0, 1),
							$lt: new Date(targetYear + 1, 0, 1),
						},
					},
				},
				{
					$group: {
						_id: { $month: "$updatedAt" },
						booksRead: { $sum: 1 },
						totalPages: { $sum: "$progress" },
					},
				},
				{ $sort: { _id: 1 } },
				{
					$group: {
						_id: null,
						months: {
							$push: {
								month: "$_id",
								booksRead: "$booksRead",
								totalPages: "$totalPages",
							},
						},
					},
				},
			])
			.toArray();

		// Fill in missing months with 0
		const months = Array.from({ length: 12 }, (_, i) => ({
			month: i + 1,
			booksRead: 0,
			totalPages: 0,
		}));

		if (monthlyProgress[0]) {
			monthlyProgress[0].months.forEach((monthData) => {
				months[monthData.month - 1] = monthData;
			});
		}

		return res.status(200).json({
			success: true,
			message: "Monthly progress retrieved successfully",
			data: {
				year: targetYear,
				months,
			},
		});
	} catch (error) {
		console.error("Error retrieving monthly progress:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getGenreBreakdown = async (req, res) => {
	try {
		const userId = req.user._id;
		const currentYear = new Date().getFullYear();

		const genreBreakdown = await userLibraryCollection
			.aggregate([
				{
					$match: {
						userId: new ObjectId(userId),
						shelf: "read",
						updatedAt: { $gte: new Date(currentYear, 0, 1) },
					},
				},
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
					$group: {
						_id: "$book.genre",
						booksRead: { $sum: 1 },
						totalPages: { $sum: "$progress" },
					},
				},
				{ $sort: { booksRead: -1 } },
			])
			.toArray();

		return res.status(200).json({
			success: true,
			message: "Genre breakdown retrieved successfully",
			data: {
				year: currentYear,
				genres: genreBreakdown,
			},
		});
	} catch (error) {
		console.error("Error retrieving genre breakdown:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const calculateReadingStreak = async (userId) => {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		let currentStreak = 0;
		let longestStreak = 0;
		let lastReadDate = null;

		// Get all read books sorted by date
		const readBooks = await userLibraryCollection
			.find({
				userId: new ObjectId(userId),
				shelf: "read",
			})
			.sort({ updatedAt: -1 })
			.toArray();

		if (readBooks.length === 0) {
			return {
				current: 0,
				longest: 0,
				lastReadDate: null,
			};
		}

		// Calculate streaks
		let tempStreak = 0;
		let tempLongest = 0;

		for (let i = 0; i < readBooks.length; i++) {
			const bookDate = new Date(readBooks[i].updatedAt);
			bookDate.setHours(0, 0, 0, 0);

			if (i === 0) {
				lastReadDate = bookDate;
				tempStreak = 1;
				tempLongest = 1;
			} else {
				const prevBookDate = new Date(readBooks[i - 1].updatedAt);
				prevBookDate.setHours(0, 0, 0, 0);

				const diffTime = Math.abs(bookDate.getTime() - prevBookDate.getTime());
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

				if (diffDays <= 1) {
					tempStreak++;
					tempLongest = Math.max(tempLongest, tempStreak);
				} else {
					tempStreak = 1;
				}
			}
		}

		return {
			current: tempStreak,
			longest: tempLongest,
			lastReadDate,
		};
	} catch (error) {
		console.error("Error calculating reading streak:", error);
		return {
			current: 0,
			longest: 0,
			lastReadDate: null,
		};
	}
};

const goalsController = {
	setReadingGoal,
	getReadingStats,
	getMonthlyProgress,
	getGenreBreakdown,
};

export default goalsController;
