import express from "express";
import authorize from "../../../middlewares/auth.js";
import userManagementController from "./user.controller.js";
const router = express.Router();

// /api/v1/admin/users

// middleware to authorize admin users
router.use(authorize("admin"));

// Get all users
router.get("/", userManagementController.getAllUsers);

// Update user role
router.patch("/:id/role", userManagementController.updateUserRole);

// Delete user
router.delete("/:id", userManagementController.deleteUser);

const userManagementRoutes = router;
export default userManagementRoutes;
