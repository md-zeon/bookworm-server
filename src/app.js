import express from "express";
import cors from "cors";
import CONFIG from "./config/index.js";
import { connectDB } from "./config/mongodb.js";
import authRoutes from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(cookieParser());
// Middleware to parse JSON bodies
app.use(
	cors({
		origin: ["http://localhost:3000", "https://bookworm-client.vercel.app"],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE"],
	}),
);

app.use(express.json());

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		if (CONFIG.node_env === "development") {
			console.log("Connecting to MongoDB in development mode...");
			await connectDB();
		}

		// authentication routes
		app.use("/api/v1/auth", authRoutes);

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
