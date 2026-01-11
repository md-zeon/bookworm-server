import express from "express";
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
	res.send("Bookworm API is running.");
});

const PORT = process.env.PORT || 3000;

export default app;
