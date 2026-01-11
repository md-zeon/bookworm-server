const signupUser = (req, res) => {
	res.send("User registered successfully.");
};

const signinUser = (req, res) => {
	res.send("User logged in successfully.");
};

const authController = {
	signupUser,
	signinUser,
};

export default authController;
