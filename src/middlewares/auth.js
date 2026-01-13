import jwt from "jsonwebtoken";
import CONFIG from "../config";

const authorize = (...roles) => {
	return async (req, res, next) => {
		try {
			const token = req.cookies.token;
			if (!token) {
				return res
					.status(401)
					.json({ success: false, message: "Unauthorized: No token provided" });
			}

			const decoded = jwt.verify(token, CONFIG.jwt_secret);

			if (roles.length && !roles.includes(decoded.role)) {
				return res.status(403).json({
					success: false,
					message: "Forbidden: You don't have enough permissions",
				});
			}

			req.user = decoded;

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
