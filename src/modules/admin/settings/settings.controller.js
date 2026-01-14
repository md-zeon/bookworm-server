import { settingsCollection, usersCollection } from "../../../config/mongodb.js";

// Get current settings (create default if none exists)
const getSettings = async (req, res) => {
	try {
		let settings = await settingsCollection.findOne();

		// Create default settings if none exist
		if (!settings) {
			const defaultSettings = {
				// General Settings
				siteName: "Bookworm",
				siteDescription: "Your personal reading companion",
				maintenanceMode: false,
				
				// User Settings
				allowRegistration: true,
				requireEmailVerification: true,
				maxBooksPerUser: 100,
				
				// Review Settings
				requireReviewApproval: true,
				minReviewLength: 10,
				maxReviewLength: 1000,
				
				// Library Settings
				defaultShelf: "wantToRead",
				maxProgressPerDay: 50,
				allowDuplicateBooks: false,
				
				// Audit fields
				lastUpdatedBy: req.user._id,
				updatedAt: new Date(),
				createdAt: new Date()
			};

			const result = await settingsCollection.insertOne(defaultSettings);
			settings = { ...defaultSettings, _id: result.insertedId };
		}

		res.status(200).json({
			success: true,
			message: "Settings retrieved successfully",
			data: settings
		});
	} catch (error) {
		console.error("Get settings error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to retrieve settings"
		});
	}
};

// Update settings
const updateSettings = async (req, res) => {
	try {
		const {
			siteName,
			siteDescription,
			maintenanceMode,
			allowRegistration,
			requireEmailVerification,
			maxBooksPerUser,
			requireReviewApproval,
			minReviewLength,
			maxReviewLength,
			defaultShelf,
			maxProgressPerDay,
			allowDuplicateBooks
		} = req.body;

		// Validation
		if (siteName && siteName.length > 100) {
			return res.status(400).json({
				success: false,
				message: "Site name cannot exceed 100 characters"
			});
		}

		if (siteDescription && siteDescription.length > 500) {
			return res.status(400).json({
				success: false,
				message: "Site description cannot exceed 500 characters"
			});
		}

		if (maxBooksPerUser && (maxBooksPerUser < 1 || maxBooksPerUser > 1000)) {
			return res.status(400).json({
				success: false,
				message: "Max books per user must be between 1 and 1000"
			});
		}

		if (minReviewLength && (minReviewLength < 1 || minReviewLength > 100)) {
			return res.status(400).json({
				success: false,
				message: "Minimum review length must be between 1 and 100"
			});
		}

		if (maxReviewLength && (maxReviewLength < 50 || maxReviewLength > 5000)) {
			return res.status(400).json({
				success: false,
				message: "Maximum review length must be between 50 and 5000"
			});
		}

		if (maxProgressPerDay && (maxProgressPerDay < 1 || maxProgressPerDay > 100)) {
			return res.status(400).json({
				success: false,
				message: "Max progress per day must be between 1 and 100"
			});
		}

		if (defaultShelf && !["wantToRead", "currentlyReading", "finished"].includes(defaultShelf)) {
			return res.status(400).json({
				success: false,
				message: "Default shelf must be one of: wantToRead, currentlyReading, finished"
			});
		}

		// Get existing settings or create default
		let settings = await settingsCollection.findOne();
		if (!settings) {
			const defaultSettings = {
				siteName: "Bookworm",
				siteDescription: "Your personal reading companion",
				maintenanceMode: false,
				allowRegistration: true,
				requireEmailVerification: true,
				maxBooksPerUser: 100,
				requireReviewApproval: true,
				minReviewLength: 10,
				maxReviewLength: 1000,
				defaultShelf: "wantToRead",
				maxProgressPerDay: 50,
				allowDuplicateBooks: false,
				lastUpdatedBy: req.user._id,
				updatedAt: new Date(),
				createdAt: new Date()
			};
			const result = await settingsCollection.insertOne(defaultSettings);
			settings = { ...defaultSettings, _id: result.insertedId };
		}

		// Build update object
		const updateData = {
			...settings,
			...req.body,
			lastUpdatedBy: req.user._id,
			updatedAt: new Date()
		};

		// Update settings
		await settingsCollection.updateOne(
			{ _id: settings._id },
			{ $set: updateData }
		);

		// Return updated settings
		const updatedSettings = await settingsCollection.findOne({ _id: settings._id });

		res.status(200).json({
			success: true,
			message: "Settings updated successfully",
			data: updatedSettings
		});
	} catch (error) {
		console.error("Update settings error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to update settings"
		});
	}
};

// Reset settings to defaults
const resetSettings = async (req, res) => {
	try {
		const defaultSettings = {
			// General Settings
			siteName: "Bookworm",
			siteDescription: "Your personal reading companion",
			maintenanceMode: false,
			
			// User Settings
			allowRegistration: true,
			requireEmailVerification: true,
			maxBooksPerUser: 100,
			
			// Review Settings
			requireReviewApproval: true,
			minReviewLength: 10,
			maxReviewLength: 1000,
			
			// Library Settings
			defaultShelf: "wantToRead",
			maxProgressPerDay: 50,
			allowDuplicateBooks: false,
			
			// Audit fields
			lastUpdatedBy: req.user._id,
			updatedAt: new Date(),
			createdAt: new Date()
		};

		// Remove existing settings and insert defaults
		await settingsCollection.deleteMany({});
		const result = await settingsCollection.insertOne(defaultSettings);

		const newSettings = { ...defaultSettings, _id: result.insertedId };

		res.status(200).json({
			success: true,
			message: "Settings reset to defaults successfully",
			data: newSettings
		});
	} catch (error) {
		console.error("Reset settings error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to reset settings"
		});
	}
};

const settingsController = {
	getSettings,
	updateSettings,
	resetSettings
};

export default settingsController;
