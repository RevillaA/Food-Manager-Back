const dotenv = require("dotenv");

dotenv.config();

const env = {
	nodeEnv: process.env.NODE_ENV || "development",
	host: process.env.HOST || "0.0.0.0",
	port: Number(process.env.PORT) || 3000,

	db: {
		connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || "",
		host: process.env.DB_HOST || "localhost",
		port: Number(process.env.DB_PORT) || 5432,
		name: process.env.DB_NAME || "restaurant_db",
		user: process.env.DB_USER || "postgres",
		password: process.env.DB_PASSWORD || "postgres",
		ssl: String(process.env.DB_SSL).toLowerCase() === "true",
	},

	jwt: {
		secret: process.env.JWT_SECRET || "super_secret_dev_key",
		expiresIn: process.env.JWT_EXPIRES_IN || "1d",
	},
};

const requiredEnvVars = ["HOST", "JWT_SECRET", "JWT_EXPIRES_IN"];

if (!env.db.connectionString) {
	requiredEnvVars.push(
		"DB_HOST",
		"DB_PORT",
		"DB_NAME",
		"DB_USER",
		"DB_PASSWORD",
	);
}

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
	throw new Error(
		`Missing required environment variables: ${missingEnvVars.join(", ")}`,
	);
}

module.exports = env;
