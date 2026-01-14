import { ObjectId } from "mongodb";
import { userLibraryCollection, booksCollection } from "../../../config/mongodb.js";

const addToLibrary = async (req, res) => {
	try {
		const { bookId } = req.body;
		const userId = req.user._id;

		if (!bookId) {
			return res.status(400).json({
				success: false,
				message: "Book ID is required",
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

		const { shelf = "wantToRead", progress = 0 } = req.body;

		if (!["wantToRead", "currentlyReading", "read"].includes(shelf)) {
			return res.status(400).json({
				success: false,
				message: "Invalid shelf. Must be: wantToRead, currentlyReading, or read",
			});
		}

		if (progress < 0 || progress > book.totalPages) {
			return res.status(400).json({
				success: false,
				message: `Progress must be between 0 and ${book.totalPages}`,
			});
		}

		const libraryItem = {
			userId: new ObjectId(userId),
			bookId: new ObjectId(bookId),
			shelf,
			progress,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await userLibraryCollection.updateOne(
			{ userId: new ObjectId(userId), bookId: new ObjectId(bookId) },
			{ $set: libraryItem },
			{ upsert: true }
		);

		return res.status(200).json({
			success: true,
			message: "Book added to library successfully",
			data: {
				...libraryItem,
				_id: result.upsertedId || (await userLibraryCollection.findOne({ userId: new ObjectId(userId), bookId: new ObjectId(bookId) }))._id,
			},
		});
	} catch (error) {
		console.error("Error adding to library:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getLibrary = async (req, res) => {
	try {
		const userId = req.user._id;
		const { shelf } = req.query;

		const matchStage = { userId: new ObjectId(userId) };
		if (shelf && ["wantToRead", "currentlyReading", "read"].includes(shelf)) {
			matchStage.shelf = shelf;
		}

		const libraryItems = await userLibraryCollection
			.aggregate([
				{ $match: matchStage },
				{ $sort: { updatedAt: -1 } },
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
						shelf: 1,
						progress: 1,
						createdAt: 1,
						updatedAt: 1,
						"book._id": 1,
						"book.title": 1,
						"book.author": 1,
						"book.genre": 1,
						"book.coverImage": 1,
						"book.totalPages": 1,
						"book.averageRating": 1,
					},
				},
			])
			.toArray();

		return res.status(200).json({
			success: true,
			message: "Library retrieved successfully",
			data: libraryItems,
		});
	} catch (error) {
		console.error("Error retrieving library:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const updateProgress = async (req, res) => {
	try {
		const { bookId } = req.params;
		const { progress } = req.body;
		const userId = req.user._id;

		if (!progress && progress !== 0) {
			return res.status(400).json({
				success: false,
				message: "Progress is required",
			});
		}

		// Check if book exists in user's library
		const libraryItem = await userLibraryCollection.findOne({
			userId: new ObjectId(userId),
			bookId: new ObjectId(bookId),
		});

		if (!libraryItem) {
			return res.status(404).json({
				success: false,
				message: "Book not found in your library",
			});
		}

		// Get book to validate progress
		const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
		if (!book) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		if (progress < 0 || progress > book.totalPages) {
			return res.status(400).json({
				success: false,
				message: `Progress must be between 0 and ${book.totalPages}`,
			});
		}

		const updatedItem = {
			progress,
			shelf: progress === book.totalPages ? "read" : libraryItem.shelf,
			updatedAt: new Date(),
		};

		await userLibraryCollection.updateOne(
			{ _id: libraryItem._id },
			{ $set: updatedItem }
		);

		return res.status(200).json({
			success: true,
			message: "Progress updated successfully",
			data: { ...libraryItem, ...updatedItem },
		});
	} catch (error) {
		console.error("Error updating progress:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const removeFromLibrary = async (req, res) => {
	try {
		const { bookId } = req.params;
		const userId = req.user._id;

		const result = await userLibraryCollection.deleteOne({
			userId: new ObjectId(userId),
			bookId: new ObjectId(bookId),
		});

		if (result.deletedCount === 0) {
			return res.status(404).json({
				success: false,
				message: "Book not found in your library",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Book removed from library successfully",
		});
	} catch (error) {
		console.error("Error removing from library:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const libraryController = {
	addToLibrary,
	getLibrary,
	updateProgress,
	removeFromLibrary,
};

export default libraryController;
