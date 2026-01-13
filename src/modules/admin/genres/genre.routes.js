import express from "express";
import authorize from "../../../middlewares/auth";
import genreController from "./genre.controller";

const router = express.Router();

// Both admin and user can access
router.get("/", authorize("admin", "user"), genreController.getAllGenres);

// Admin only
router.post("/", authorize("admin"), genreController.createGenre);
router.patch("/:id", authorize("admin"), genreController.updateGenre);
router.delete("/:id", authorize("admin"), genreController.deleteGenre);

const genreManagementRoutes = router;
export default genreManagementRoutes;
