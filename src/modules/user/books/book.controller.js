import { ObjectId } from "mongodb";
import { booksCollection } from "../../../config/mongodb.js";

const getBooks = async (req, res) => {
	try {
		const { search, genre, sortBy, page = 1, limit = 10 } = req.query;
		
		const query = {};
		
		// Search functionality
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ author: { $regex: search, $options: "i" } },
			];
		}
		
		// Genre filter
		if (genre) {
			query.genre = genre;
		}
		
		// Sorting
		const sort = {};
		if (sortBy === "title") {
			sort.title = 1;
		} else if (sortBy === "author") {
			sort.author = 1;
		} else if (sortBy === "rating") {
			sort.averageRating = -1;
		} else if (sortBy === "date") {
			sort.createdAt = -1;
		} else {
			sort.createdAt = -1; // Default sort by newest
		}
		
		// Pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);
		const limitNum = parseInt(limit);
		
		const books = await booksCollection
			.find(query)
			.sort(sort)
			.skip(skip)
			.limit(limitNum)
			.toArray();
		
		const total = await booksCollection.countDocuments(query);
		
		return res.status(200).json({
			success: true,
			message: "Books retrieved successfully",
			data: {
				books,
				pagination: {
					currentPage: parseInt(page),
					totalPages: Math.ceil(total / limitNum),
					totalBooks: total,
					hasNext: skip + limitNum < total,
					hasPrev: page > 1,
				},
			},
		});
	} catch (error) {
		console.error("Error retrieving books:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getBookById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) {
			return res.status(400).json({
				success: false,
				message: "Book ID is required",
			});
		}

		const book = await booksCollection.findOne({ _id: new ObjectId(id) });
		if (!book) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Book retrieved successfully",
			data: book,
		});
	} catch (error) {
		console.error("Error retrieving book:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getBooksByGenre = async (req, res) => {
	try {
		const { genre } = req.params;
		const { page = 1, limit = 10 } = req.query;
		
		if (!genre) {
			return res.status(400).json({
				success: false,
				message: "Genre is required",
			});
		}
		
		const query = { genre };
		const skip = (parseInt(page) - 1) * parseInt(limit);
		const limitNum = parseInt(limit);
		
		const books = await booksCollection
			.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNum)
			.toArray();
		
		const total = await booksCollection.countDocuments(query);
		
		return res.status(200).json({
			success: true,
			message: "Books retrieved successfully",
			data: {
				books,
				pagination: {
					currentPage: parseInt(page),
					totalPages: Math.ceil(total / limitNum),
					totalBooks: total,
					hasNext: skip + limitNum < total,
					hasPrev: page > 1,
				},
			},
		});
	} catch (error) {
		console.error("Error retrieving books by genre:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getPopularBooks = async (req, res) => {
	try {
		const { limit = 10 } = req.query;
		const limitNum = parseInt(limit);
		
		const books = await booksCollection
			.find()
			.sort({ totalReviews: -1, averageRating: -1 })
			.limit(limitNum)
			.toArray();
		
		return res.status(200).json({
			success: true,
			message: "Popular books retrieved successfully",
			data: books,
		});
	} catch (error) {
		console.error("Error retrieving popular books:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getNewestBooks = async (req, res) => {
	try {
		const { limit = 10 } = req.query;
		const limitNum = parseInt(limit);
		
		const books = await booksCollection
			.find()
			.sort({ createdAt: -1 })
			.limit(limitNum)
			.toArray();
		
		return res.status(200).json({
			success: true,
			message: "Newest books retrieved successfully",
			data: books,
		});
	} catch (error) {
		console.error("Error retrieving newest books:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const bookController = {
	getBooks,
	getBookById,
	getBooksByGenre,
	getPopularBooks,
	getNewestBooks,
};

export default bookController;
