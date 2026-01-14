import express from "express";
import cors from "cors";
import CONFIG from "./config/index.js";
import { connectDB } from "./config/mongodb.js";
import authRoutes from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import userManagementRoutes from "./modules/admin/users/user.routes.js";
import genreManagementRoutes from "./modules/admin/genres/genre.routes.js";
import booksManagementRoutes from "./modules/admin/books/book.routes.js";

const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(
	cors({
		origin: ["http://localhost:3000", "https://bookworm-client.vercel.app"],
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	}),
);

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		if (CONFIG.node_env === "development") {
			console.log("Connecting to MongoDB in development mode...");
			await connectDB();
		}

		// authentication routes
		app.use("/api/v1/auth", authRoutes);

		// Admin routes

		// User management
		app.use("/api/v1/admin/users", userManagementRoutes);

		// Genre management
		app.use("/api/v1/admin/genres", genreManagementRoutes);

		// Book management
		app.use("/api/v1/admin/books", booksManagementRoutes);
		// app.use("/api/v1/admin/reviews", reviewManagementRoutes);
		// app.use("/api/v1/admin/tutorials", tutorialManagementRoutes);

		// Send a ping to confirm a successful connection
		// await client.db("admin").command({ ping: 1 });
		// console.log("Pinged your deployment. You successfully connected to MongoDB!");
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

// Basic route
app.get("/", (req, res) => {
	res.send("Bookworm API is running.");
});

export default app;
