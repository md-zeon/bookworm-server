import express from "express";
import libraryController from "./library.controller.js";
import authorize from "../../../middlewares/auth.js";

const router = express.Router();

router.use(authorize("user"));

// User library routes
router.post("/", libraryController.addToLibrary);
router.get("/", libraryController.getLibrary);
router.put("/:bookId/progress", libraryController.updateProgress);
router.delete("/:bookId", libraryController.removeFromLibrary);

export default router;
