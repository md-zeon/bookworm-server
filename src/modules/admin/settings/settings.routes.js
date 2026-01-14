import express from "express";
import authorize from "../../../middlewares/auth.js";
import settingsController from "./settings.controller.js";

const router = express.Router();

// All routes require admin authorization
router.use(authorize("admin"));

// GET /api/admin/settings - Get current settings
router.get("/", settingsController.getSettings);

// PUT /api/admin/settings - Update settings
router.put("/", settingsController.updateSettings);

// DELETE /api/admin/settings/reset - Reset settings to defaults
router.delete("/reset", settingsController.resetSettings);

const settingsRoutes = router;
export default settingsRoutes;
