import { MongoClient, ServerApiVersion } from "mongodb";
import CONFIG from "./index.js";

const uri = CONFIG.mongodb_uri;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

export const connectDB = async () => {
	try {
		await client.connect();
		console.log("MongoDB Connected Successfully");
	} catch (error) {
		console.error("MongoDB Connection Failed:", error);
	}
};

// Database & Collections
export const db = client.db("bookwormDB");
export const usersCollection = db.collection("users");
export const GenreCollection = db.collection("genres");
export const booksCollection = db.collection("books");
