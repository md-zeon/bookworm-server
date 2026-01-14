import { ObjectId } from "mongodb";
import { userLibraryCollection, reviewsCollection, booksCollection, GenreCollection } from "../../../config/mongodb.js";

const getRecommendations = async (req, res) => {
	try {
		const userId = req.user._id;
		const limit = parseInt(req.query.limit) || 12;

		// Get user's reading history
		const userLibrary = await userLibraryCollection
			.find({
				userId: new ObjectId(userId),
				shelf: "read",
			})
			.toArray();

		if (userLibrary.length === 0) {
			// If no reading history, return popular books
			const popularBooks = await getPopularBooks(limit);
			return res.status(200).json({
				success: true,
				message: "No reading history found, showing popular books",
				data: {
					recommendations: popularBooks,
					reason: "No reading history available",
				},
			});
		}

		// Get user's genre preferences
		const genrePreferences = await getUserGenrePreferences(userId);

		// Get books similar to what user has read
		const similarBooks = await getSimilarBooks(userId, userLibrary, limit);

		// Get books from favorite genres
		const genreBasedBooks = await getGenreBasedBooks(genrePreferences, userLibrary, limit);

		// Get highly rated books from similar users
		const collaborativeFiltering = await getCollaborativeRecommendations(userId, limit);

		// Combine and deduplicate recommendations
		const allRecommendations = [
			...similarBooks,
			...genreBasedBooks,
			...collaborativeFiltering,
		];

		const uniqueRecommendations = allRecommendations.filter(
			(book, index, self) =>
				index === self.findIndex((b) => b._id.toString() === book._id.toString())
		);

		// Sort by score (if available) or rating
		const sortedRecommendations = uniqueRecommendations
			.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
			.slice(0, limit);

		return res.status(200).json({
			success: true,
			message: "Recommendations retrieved successfully",
			data: {
				recommendations: sortedRecommendations,
				reason: "Based on your reading history and preferences",
			},
		});
	} catch (error) {
		console.error("Error getting recommendations:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getUserGenrePreferences = async (userId) => {
	try {
		const genreStats = await userLibraryCollection
			.aggregate([
				{
					$match: {
						userId: new ObjectId(userId),
						shelf: "read",
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
						totalRating: { $sum: "$book.averageRating" },
					},
				},
				{
					$project: {
						genre: "$_id",
						booksRead: 1,
						averageRating: { $divide: ["$totalRating", "$booksRead"] },
					},
				},
				{ $sort: { booksRead: -1, averageRating: -1 } },
			])
			.toArray();

		return genreStats;
	} catch (error) {
		console.error("Error getting genre preferences:", error);
		return [];
	}
};

const getSimilarBooks = async (userId, userLibrary, limit) => {
	try {
		const bookIds = userLibrary.map((item) => item.bookId);
		const userGenres = await booksCollection
			.find({ _id: { $in: bookIds } })
			.project({ genre: 1 })
			.toArray();

		const genres = userGenres.map((book) => book.genre);

		const similarBooks = await booksCollection
			.aggregate([
				{
					$match: {
						_id: { $nin: bookIds },
						genre: { $in: genres },
						averageRating: { $gte: 3 },
					},
				},
				{ $sort: { averageRating: -1, totalReviews: -1 } },
				{ $limit: limit },
			])
			.toArray();

		return similarBooks;
	} catch (error) {
		console.error("Error getting similar books:", error);
		return [];
	}
};

const getGenreBasedBooks = async (genrePreferences, userLibrary, limit) => {
	try {
		if (genrePreferences.length === 0) return [];

		const favoriteGenres = genrePreferences.slice(0, 3).map((g) => g.genre);
		const excludeBookIds = userLibrary.map((item) => item.bookId);

		const genreBooks = await booksCollection
			.aggregate([
				{
					$match: {
						_id: { $nin: excludeBookIds },
						genre: { $in: favoriteGenres },
						averageRating: { $gte: 3.5 },
					},
				},
				{ $sort: { averageRating: -1, totalReviews: -1 } },
				{ $limit: limit },
			])
			.toArray();

		return genreBooks;
	} catch (error) {
		console.error("Error getting genre-based books:", error);
		return [];
	}
};

const getCollaborativeRecommendations = async (userId, limit) => {
	try {
		// Find users with similar reading tastes
		const userGenres = await getUserGenrePreferences(userId);
		const similarUsers = await findSimilarUsers(userId, userGenres);

		if (similarUsers.length === 0) return [];

		// Get books read by similar users that current user hasn't read
		const similarUserIds = similarUsers.map((u) => u.userId);
		const userLibraryBooks = await userLibraryCollection
			.find({ userId: new ObjectId(userId) })
			.project({ bookId: 1 })
			.toArray();

		const excludeBookIds = userLibraryBooks.map((item) => item.bookId);

		const collaborativeBooks = await userLibraryCollection
			.aggregate([
				{
					$match: {
						userId: { $in: similarUserIds },
						bookId: { $nin: excludeBookIds },
						shelf: "read",
					},
				},
				{
					$group: {
						_id: "$bookId",
						readCount: { $sum: 1 },
					},
				},
				{ $sort: { readCount: -1 } },
				{ $limit: limit },
				{
					$lookup: {
						from: "books",
						localField: "_id",
						foreignField: "_id",
						as: "book",
					},
				},
				{ $unwind: "$book" },
				{
					$replaceRoot: {
						newRoot: "$book",
					},
				},
			])
			.toArray();

		return collaborativeBooks;
	} catch (error) {
		console.error("Error getting collaborative recommendations:", error);
		return [];
	}
};

const findSimilarUsers = async (userId, userGenres) => {
	try {
		if (userGenres.length === 0) return [];

		const similarUsers = await userLibraryCollection
			.aggregate([
				{
					$match: {
						userId: { $ne: new ObjectId(userId) },
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
						_id: "$userId",
						genres: { $addToSet: "$book.genre" },
						booksRead: { $sum: 1 },
					},
				},
				{
					$addFields: {
						commonGenres: {
							$size: {
								$setIntersection: ["$genres", userGenres.map((g) => g.genre)],
							},
						},
					},
				},
				{ $match: { commonGenres: { $gte: 2 } } },
				{ $sort: { commonGenres: -1, booksRead: -1 } },
				{ $limit: 10 },
			])
			.toArray();

		return similarUsers;
	} catch (error) {
		console.error("Error finding similar users:", error);
		return [];
	}
};

const getPopularBooks = async (limit) => {
	try {
		const popularBooks = await booksCollection
			.aggregate([
				{ $match: { totalReviews: { $gte: 5 } } },
				{ $sort: { averageRating: -1, totalReviews: -1 } },
				{ $limit: limit },
			])
			.toArray();

		return popularBooks;
	} catch (error) {
		console.error("Error getting popular books:", error);
		return [];
	}
};

const recommendationsController = {
	getRecommendations,
};

export default recommendationsController;
