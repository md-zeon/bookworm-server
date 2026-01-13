import jwt from "jsonwebtoken";
import CONFIG from "../config/index.js";
import { usersCollection } from "../config/mongodb.js";

const authorize = (...roles) => {
	return async (req, res, next) => {
		try {
			const token = req.cookies.token;
			console.log("Auth Token:", token);
			if (!token) {
				return res
					.status(401)
					.json({ success: false, message: "Unauthorized: No token provided" });
			}

			const decoded = jwt.verify(token, CONFIG.jwt_secret);
			console.log("Decoded Token:", decoded);

			// Fetch the latest user from DB
			const user = await usersCollection.findOne({ email: decoded.email });

			console.log("Authenticated User:", user);

			if (!user)
				return res
					.status(401)
					.json({ success: false, message: "User not found" });

			// Force logout if role changed
			if (decoded.roleUpdatedAt !== user.roleUpdatedAt.toISOString()) {
				res.clearCookie("token", {
					httpOnly: true,
					secure: CONFIG.node_env === "production",
					sameSite: CONFIG.node_env === "production" ? "none" : "lax",
				});

				return res.status(401).json({
					success: false,
					message: "Role changed. Please log in again.",
				});
			}

			if (roles.length && !roles.includes(decoded.role)) {
				return res.status(403).json({
					success: false,
					message: "Forbidden: You don't have enough permissions",
				});
			}

			req.user = user;
			next();
		} catch (error) {
			res.status(401).json({
				success: false,
				message: error.message || "Unauthorized: Access is denied",
			});
		}
	};
};

export default authorize;
