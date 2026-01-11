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

		if (existingUser) {
			return res.status(409).json({
				success: false,
				message: "Email already registered",
			});
		}

		// weak password check (at least 8 characters, uppercase, lowercase, number)
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

		if (!passwordRegex.test(password)) {
			return res.status(400).json({
				success: false,
				message:
					"Password must be at least 8 characters long and include uppercase, lowercase, and a number",
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

		// Insert into DB
		const result = await usersCollection.insertOne(newUser);

		// Create JWT
		const tokenPayload = {
			id: result.insertedId,
			name,
			email,
			role: "user",
		};

		const token = jwt.sign(tokenPayload, CONFIG.jwt_secret, {
			expiresIn: "7d",
		});

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			token,
			user: {
				id: result.insertedId,
				name,
				email,
				role: "user",
				photoURL: photoURL || "",
			},
		});
	} catch (error) {
		console.error("Signup error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const signinUser = (req, res) => {
	res.send("User logged in successfully.");
};

const authController = {
	signupUser,
	signinUser,
};

export default authController;
