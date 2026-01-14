import express from "express";
import bookController from "./book.controller.js";

const router = express.Router();

// /api/v1/user/books

// Get all books with search, filter, sort, and pagination
router.get("/", bookController.getBooks);

// Get a specific book by ID
router.get("/:id", bookController.getBookById);

// Get books by genre with pagination
router.get("/genre/:genre", bookController.getBooksByGenre);

// Get popular books (by reviews and rating)
router.get("/popular", bookController.getPopularBooks);

// Get newest books
router.get("/newest", bookController.getNewestBooks);

const userBooksRoutes = router;
export default userBooksRoutes;
