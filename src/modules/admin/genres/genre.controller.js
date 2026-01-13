import { ObjectId } from "mongodb";
import { GenreCollection } from "../../../config/mongodb.js";

const createGenre = async (req, res) => {
	try {
		const { name } = req.body;

		if (!name) {
			return res
				.status(400)
				.json({ success: false, message: "Genre name is required." });
		}

		// existing genre
		const existingGenre = await GenreCollection.findOne({
			name: { $regex: `^${name.trim()}$`, $options: "i" },
		});

		if (existingGenre) {
			return res
				.status(409)
				.json({ success: false, message: "Genre already exists." });
		}

		const newGenre = {
			name: name.trim(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const result = await GenreCollection.insertOne(newGenre);

		return res.status(201).json({
			success: true,
			message: "Genre created successfully.",
			data: {
				_id: result.insertedId,
				name: newGenre.name,
				createdAt: newGenre.createdAt,
				updatedAt: newGenre.updatedAt,
			},
		});
	} catch (error) {
		console.error("Error creating genre:", error);

		res.status(500).json({
			success: false,
			message: "Internal Server Error",
			error: error.message,
		});
	}
};

const getAllGenres = async (req, res) => {
	try {
		const genres = await GenreCollection.find({}).toArray();

		return res.status(200).json({
			success: true,
			message: "Genres retrieved successfully.",
			data: genres,
		});
	} catch (error) {
		console.error("Error getting genres:", error);
		res.status(500).json({
			success: false,
			message: "Internal Server Error",
		});
	}
};

const updateGenre = async (req, res) => {
	try {
		const { id } = req.params;
		const { name } = req.body;
		if (!name) {
			return res
				.status(400)
				.json({ success: false, message: "Genre name is required." });
		}

		const existingGenre = await GenreCollection.findOne({
			_id: new ObjectId(id),
		});

		if (!existingGenre) {
			return res
				.status(404)
				.json({ success: false, message: "Genre not found." });
		}

		const updatedGenre = {
			name: name.trim(),
			updatedAt: new Date(),
		};

		const result = await GenreCollection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: updatedGenre },
		);

		if (result.modifiedCount === 1) {
			return res.status(200).json({
				success: true,
				message: "Genre updated successfully.",
				data: {
					_id: id,
					name: updatedGenre.name,
				},
			});
		} else {
			return res.status(500).json({
				success: false,
				message: "Failed to update genre.",
			});
		}
	} catch (error) {
		console.error("Error updating genre:", error);
		res.status(500).json({
			success: false,
			message: "Internal Server Error",
		});
	}
};

const deleteGenre = async (req, res) => {
	try {
		const { id } = req.params;
		const existingGenre = await GenreCollection.findOne({
			_id: new ObjectId(id),
		});
		if (!existingGenre) {
			return res
				.status(404)
				.json({ success: false, message: "Genre not found." });
		}

		const result = await GenreCollection.deleteOne({ _id: new ObjectId(id) });

		if (result.deletedCount === 1) {
			return res.status(200).json({
				success: true,
				message: "Genre deleted successfully.",
			});
		} else {
			return res.status(500).json({
				success: false,
				message: "Failed to delete genre.",
			});
		}
	} catch (error) {
		console.error("Error deleting genre:", error);
		res.status(500).json({
			success: false,
			message: "Internal Server Error",
		});
	}
};

const genreController = {
	createGenre,
	getAllGenres,
	updateGenre,
	deleteGenre,
};

export default genreController;
