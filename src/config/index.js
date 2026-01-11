import dotenv from "dotenv";
import path from "path";

dotenv.config({
	path: path.join(process.cwd(), ".env"),
});

const CONFIG = {
	port: process.env.PORT || 5000,
	mongodb_uri: process.env.MONGODB_URI,
	node_env: process.env.NODE_ENV,
};

export default CONFIG;
