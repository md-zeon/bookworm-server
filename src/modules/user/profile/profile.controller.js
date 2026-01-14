import { usersCollection } from "../../../config/mongodb.js";

const getCurrentUserProfile = async (req, res) => {
	try {
		const userId = req.user._id;

		const user = await usersCollection.findOne(
			{ _id: userId },
			{ projection: { password: 0 } } // exclude password
		);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Profile retrieved successfully",
			data: user,
		});
	} catch (error) {
		console.error("Error getting user profile:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const updateCurrentUserProfile = async (req, res) => {
	try {
		const userId = req.user._id;
		const { name, email, photoURL } = req.body;

		// Validate input
		if (name && name.trim().length < 2) {
			return res.status(400).json({
				success: false,
				message: "Name must be at least 2 characters long",
			});
		}

		if (email && !/^\S+@\S+\.\S+$/.test(email)) {
			return res.status(400).json({
				success: false,
				message: "Invalid email format",
			});
		}

		// Check if email is already taken by another user
		if (email) {
			const existingUser = await usersCollection.findOne({ 
				email: email.trim(),
				_id: { $ne: userId }
			});
			
			if (existingUser) {
				return res.status(409).json({
					success: false,
					message: "Email is already taken",
				});
			}
		}

		// Prepare update data
		const updateData = {};
		if (name) updateData.name = name.trim();
		if (email) updateData.email = email.trim();
		if (photoURL !== undefined) updateData.photoURL = photoURL;

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid fields to update",
			});
		}

		updateData.updatedAt = new Date();

		const result = await usersCollection.updateOne(
			{ _id: userId },
			{ $set: updateData }
		);

		if (result.matchedCount === 0) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Get updated user data
		const updatedUser = await usersCollection.findOne(
			{ _id: userId },
			{ projection: { password: 0 } }
		);

		return res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		console.error("Error updating user profile:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const profileController = {
	getCurrentUserProfile,
	updateCurrentUserProfile,
};

export default profileController;
