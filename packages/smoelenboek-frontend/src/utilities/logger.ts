import log from "loglevel";
import prefix from "loglevel-plugin-prefix";

prefix.reg(log);
// TODO: Make this dependend on the environment
log.enableAll();

prefix.apply(log, {
	format(level, name, timestamp) {
		return `[${timestamp}] ${level.toUpperCase()} ${name}:`
	}
})

export default log;
