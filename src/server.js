import app from "./app.js";
import CONFIG from "./config/index.js";

const PORT = CONFIG.port;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
