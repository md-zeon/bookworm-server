import { ObjectId } from "mongodb";
import { usersCollection } from "../../../config/mongodb.js";

// Get all users
const getAllUsers = async (req, res) => {
	try {
		const users = await usersCollection
			.find({})
			.project({ password: 0 })
			.toArray(); // exclude password
		res.status(200).json({
			success: true,
			message: "Users retrieved successfully",
			data: users,
		});
	} catch (err) {
		console.error("Get Users Error:", err);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

// Change user role (user <-> admin)
const updateUserRole = async (req, res) => {
	try {
		const { id } = req.params;
		const { role } = req.body;

		if (!["user", "admin"].includes(role)) {
			return res.status(400).json({ success: false, message: "Invalid role" });
		}

		// admin cannot change their own role
		if (req.user && req.user._id.toString() === id) {
			return res
				.status(400)
				.json({ success: false, message: "Cannot change your own role" });
		}

		const result = await usersCollection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: { role, roleUpdatedAt: new Date(), updatedAt: new Date() } },
		);

		if (result.matchedCount === 0)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });

		const updatedUser = await usersCollection.findOne(
			{ _id: new ObjectId(id) },
			{ projection: { password: 0 } },
		);

		res.status(200).json({
			success: true,
			message: "User role updated successfully",
			data: updatedUser,
		});
	} catch (err) {
		console.error("Update Role Error:", err);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

// Delete a user
const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		// admin cannot delete their own account
		if (req.user && req.user._id.toString() === id) {
			return res
				.status(400)
				.json({ success: false, message: "Cannot delete your own account" });
		}

		const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

		if (result.deletedCount === 0)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });

		res
			.status(200)
			.json({ success: true, message: "User deleted successfully" });
	} catch (err) {
		console.error("Delete User Error:", err);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

const userManagementController = {
	getAllUsers,
	updateUserRole,
	deleteUser,
};

export default userManagementController;
