const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");

const startServer = async () => {
	try {
		await connectDatabase();

		app.listen(env.port, env.host, () => {
			console.log(`Server running on http://${env.host}:${env.port}`);
			console.log(`Environment: ${env.nodeEnv}`);
		});
	} catch (error) {
		console.error("Application startup failed:", error.message);
		process.exit(1);
	}
};

startServer();
