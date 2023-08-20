import winston from "winston";

const format = winston.format.printf(({level, message, label, timestamp, meta}) => {
	return `${timestamp} [${label}] ${level}: ${message} ${meta ? JSON.stringify(meta) : ""}`;
});

const logger = winston.createLogger({
	format: winston.format.combine(
		winston.format.label({label: "Smoelenboek"}),
		winston.format.timestamp({
			format: "hh:mm:ss"
		}),
		// winston.format.colorize(),
		winston.format.splat(),
		format
	),
	transports: [
		new winston.transports.File({filename: "./logs/error.log", level: "error"}),
		new winston.transports.File({filename: "./logs/combined.log", options: {encoding: "utf8"}, tailable: true})
	]
});

if (process.env.NODE_ENV === "development") {
	logger.add(
		new winston.transports.Console({level: "debug"})
	);
} else {
	logger.add(
		new winston.transports.Console()
	);
}

export default logger;

