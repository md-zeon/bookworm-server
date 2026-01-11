import dotenv from "dotenv";
import path from "path";
dotenv.config({
	path: path.join(process.cwd(), ".env"),
});

const CONFIG = {
	PORT: process.env.PORT || 5000,
};

export default CONFIG;
