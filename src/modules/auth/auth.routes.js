import express from "express";
import userController from "./auth.controller.js";

const router = express.Router();

router.post("/signup", userController.signupUser);
router.post("/signin", userController.signinUser);

const authRoutes = router;

export default authRoutes;
