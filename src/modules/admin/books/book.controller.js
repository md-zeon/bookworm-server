/**
 * {
  _id: ObjectId,
  title: String,          // Required, max 200 chars
  author: String,         // Required, max 100 chars
  genre: ObjectId,        // Required, references Genre collection
  description: String,    // Optional, max 2000 chars
  coverImage: String,     // Required, Cloudinary URL
  totalPages: Number,     // Required, minimum 1
  averageRating: Number,  // Default 0, range 0-5
  totalReviews: Number,   // Default 0
  createdAt: Date,        // Default current date
  updatedAt: Date         // Default current date
}
  **Indexes**:

- `title`: Text index for search functionality
- `author`: Text index for search functionality
- `genre`: Index for filtering by genre
- `averageRating`: Index for sorting by rating

**Validation Rules** (to be implemented in application logic):

- Title and author are required
- Genre must reference an existing genre
- Cover image URL is required
- Total pages must be positive (minimum 1)
- Average rating must be between 0-5
 */

import { ObjectId } from "mongodb";
import { booksCollection } from "../../../config/mongodb.js";

const createBook = async (req, res) => {
	try {
		const { title, author, genre, description, coverImage, totalPages } =
			req.body;

		// Validation
		if (!title) {
			return res.status(400).json({
				success: false,
				message: "Title is required",
			});
		}
		if (!author) {
			return res
				.status(400)
				.json({ success: false, message: "Author is required" });
		}
		if (!genre) {
			return res
				.status(400)
				.json({ success: false, message: "Genre is required" });
		}
		if (description && description.length > 2000) {
			return res
				.status(400)
				.json({ success: false, message: "Description too long" });
		}
		if (!coverImage) {
			return res
				.status(400)
				.json({ success: false, message: "Cover image is required" });
		}
		if (!totalPages || totalPages < 1) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid total pages" });
		}

		const newBook = {
			title,
			author,
			genre,
			description: description || "",
			coverImage,
			totalPages,
			averageRating: 0,
			totalReviews: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await booksCollection.insertOne(newBook);
		return res.status(201).json({
			success: true,
			message: "Book created successfully",
			data: { _id: result.insertedId, ...newBook },
		});
	} catch (error) {
		console.error("Error creating book:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// Get all books + search, filter, sort can be added later
const getAllBooks = async (req, res) => {
	try {
		const { search, genre } = req?.query;

		const query = {};

		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ author: { $regex: search, $options: "i" } },
			];
		}

		if (genre) {
			query.genre = genre;
		}

		const books = await booksCollection.find(query).toArray();
		console.log(books);
		return res.status(200).json({
			success: true,
			message: "Books retrieved successfully",
			data: books,
		});
	} catch (error) {
		console.error("Error retrieving books:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getOneBook = async (req, res) => {
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
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const updateBook = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, author, genre, description, coverImage, totalPages } =
			req.body;

		// Validation and update logic

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

		const updatedBook = {
			...(title && { title }),
			...(author && { author }),
			...(genre && { genre }),
			...(description !== undefined && { description }),
			...(coverImage && { coverImage }),
			...(totalPages && { totalPages }),
			updatedAt: new Date(),
		};

		const result = await booksCollection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: updatedBook },
		);

		if (result.matchedCount === 0) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Book updated successfully",
			data: { _id: book._id, ...updatedBook },
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const deleteBook = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) {
			return res.status(400).json({
				success: false,
				message: "Book ID is required",
			});
		}

		const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
		if (result.deletedCount === 0) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Book deleted successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const bookController = {
	createBook,
	getAllBooks,
	getOneBook,
	updateBook,
	deleteBook,
};

export default bookController;
