import express from "express";
import authorize from "../../../middlewares/auth.js";
import bookController from "./book.controller.js";
const router = express.Router();

// /api/admin/books

router.get("/", authorize("admin", "user"), bookController.getAllBooks);
router.post("/", authorize("admin"), bookController.createBook);
router.get("/:id", authorize("admin", "user"), bookController.getOneBook);
router.patch("/:id", authorize("admin"), bookController.updateBook);
router.delete("/:id", authorize("admin"), bookController.deleteBook);

const booksManagementRoutes = router;
export default booksManagementRoutes;
