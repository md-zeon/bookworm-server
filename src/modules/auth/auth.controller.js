import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import CONFIG from "../../config/index.js";
import { usersCollection } from "../../config/mongodb.js";

const signupUser = async (req, res) => {
	try {
		const { name, email, password, photoURL } = req.body;

		// Validate input
		if (!name || !email || !password) {
			return res.status(400).json({
				success: false,
				message: "Name, email, and password are required",
			});
		}

		// Check existing user
		const existingUser = await usersCollection.findOne({ email });
		if (existingUser)
			return res
				.status(409)
				.json({ success: false, message: "Email already registered" });

		// Password validation
		if (password.length < 8) {
			return res.status(400).json({
				success: false,
				message: "Password must be at least 8 characters long",
			});
		}

		if (!/[A-Z]/.test(password)) {
			return res.status(400).json({
				success: false,
				message: "Password must include at least one uppercase letter",
			});
		}

		if (!/[a-z]/.test(password)) {
			return res.status(400).json({
				success: false,
				message: "Password must include at least one lowercase letter",
			});
		}

		if (!/\d/.test(password)) {
			return res.status(400).json({
				success: false,
				message: "Password must include at least one number",
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create user
		const newUser = {
			name,
			email,
			password: hashedPassword,
			role: "user",
			photoURL: photoURL || "",
			createdAt: new Date(),
		};
		const result = await usersCollection.insertOne(newUser);

		// JWT payload
		const tokenPayload = { id: result.insertedId, name, email, role: "user" };
		const token = jwt.sign(tokenPayload, CONFIG.jwt_secret, {
			expiresIn: "7d",
		});

		// Set cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: CONFIG.node_env === "production",
			sameSite: CONFIG.node_env === "production" ? "none" : "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			data: {
				id: result.insertedId,
				name,
				email,
				role: "user",
				photoURL: photoURL || "",
			},
		});
	} catch (error) {
		console.error("Signup error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

const signinUser = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validate input
		if (!email || !password)
			return res
				.status(400)
				.json({ success: false, message: "Email and password are required" });

		// Find user
		const user = await usersCollection.findOne({ email });
		if (!user)
			return res
				.status(401)
				.json({ success: false, message: "Invalid email or password" });

		// Compare password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch)
			return res
				.status(401)
				.json({ success: false, message: "Invalid email or password" });

		// JWT payload
		const tokenPayload = {
			id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		};

		const token = jwt.sign(tokenPayload, CONFIG.jwt_secret, {
			expiresIn: "7d",
		});

		// Set cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: CONFIG.node_env === "production",
			sameSite: CONFIG.node_env === "production" ? "none" : "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		res.status(200).json({
			success: true,
			message: "User logged in successfully",
			data: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				photoURL: user.photoURL || "",
			},
		});
	} catch (error) {
		console.error("Signin error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

const signoutUser = async (req, res) => {
	try {
		// Clear the token cookie
		res.clearCookie("token", {
			httpOnly: true,
			secure: CONFIG.node_env === "production",
			sameSite: CONFIG.node_env === "production" ? "none" : "lax",
		});

		res
			.status(200)
			.json({ success: true, message: "User signed out successfully" });
	} catch (error) {
		console.error("Signout error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

const authController = {
	signupUser,
	signinUser,
	signoutUser,
};

export default authController;
