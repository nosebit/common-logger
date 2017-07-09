let lodash          = require("lodash"),
    crypto          = require("crypto"),
    moment          = require("moment"),
    winston         = null,
    winstonLogstash = null;

require('winston-daily-rotate-file');

/**
 * Try to fetch external libs.
 */
try {
    winston = require("winston");
} catch(e) {
    console.warn("winston logger external lib not found");
}

try {
    winstonLogstash = require("winston-logstash");
} catch(e) {
    console.warn("winston-logstash external lib not found");
}


/**
 * This class defines a logger that uses winston to log.
 */
class Logger {
    constructor(scope = "", trackId = null, opts = {}) {
        this.scope = scope;
        this.opts = opts;
        this.trackId = trackId || crypto.randomBytes(20).toString("hex");
        this.initialMoment = moment();

        // If winstonLogger is not already initiated try to initialize it.
        if(winston && !Logger.winstonLogger) {
            let winstonTransports = [
                new (winston.transports.Console)({
                    level: this.opts.level,
                    colorize: true,
                    timestamp: true,
                    handleExceptions: true,
                    humanReadableUnhandledException: true
                })
            ];

            if(this.opts.useFileLogger) {
                winstonTransports.push(new (winston.transports.DailyRotateFile)({
                    name: "info",
                    filename: "logs/info.log",
                    level: "info",
                    datePattern: "yyyy-MM-dd.",
                    prepend: true
                }));

                winstonTransports.push(new (winston.transports.DailyRotateFile)({
                    name: "error",
                    filename: "logs/error.log",
                    level: "error",
                    datePattern: "yyyy-MM-dd.",
                    prepend: true
                }));
            }

            if(winstonLogstash && this.opts.logstashWinstonHost) {
                const split = this.opts.logstashWinstonHost.split(":");
                const hostname = split[0];
                const port = split.length > 1 ? split[1] : 80;

                winstonTransports.push(new (winston.transports.Logstash)({
                    level: this.opts.level,
                    port: port,
                    host: hostname,
                    timestamp: true,
                    handleExceptions: true,
                    max_connect_retries: -1
                }));
            }

            Logger.winstonLogger = new (winston.Logger)({
                exitOnError: false,
                transports: winstonTransports
            });

            // Global winston logger error handler
            Logger.winstonLogger.on("error", (err) => { console.error("error", err); });
        }
    }

    /**
     * This function prints an arbitrary level log.
     */
    print(level = "info", message = "", data = {}) {
        const namespace = this.opts.namespace;
        const dataStr = JSON.stringify(data);
        const scope = this.scope;

        message = `[${namespace}] ${scope} : ${message}`;

        // Use winston to log.
        if(Logger.winstonLogger) {
            Logger.winstonLogger.log(level, message, {
                service_name: this.opts.service_name,
                service_index: process.env.NOMAD_ALLOC_INDEX||process.env.SERVICE_INDEX||0,
                hostname: process.env.HOSTNAME,
                namespace: namespace,
                scope: scope,
                level: level.toUpperCase(),
                trackId: this.trackId,
                elapsed: moment().diff(this.initialMoment),
                data: dataStr
            });
        }
        // Fallback to console.log method.
        else {
            // Parse log level
            level = ["silly","debug","verbose"].indexOf(level)>=0?"log":level;

            // debug,error,log,warn,info
            console[level](message, JSON.stringify({
                service_name: this.opts.service_name,
                service_index: process.env.NOMAD_ALLOC_INDEX||process.env.SERVICE_INDEX||0,
                hostname: process.env.HOSTNAME,
                namespace: namespace,
                scope: scope,
                level: level.toUpperCase(),
                trackId: this.trackId,
                elapsed: moment().diff(this.initialMoment),
                data: dataStr
            }));
        }

    }

    silly(msg,data){ this.print("silly", msg, data); }
    debug(msg,data){ this.print("debug", msg, data); }
    verbose(msg,data){ this.print("verbose", msg, data); }
    info(msg,data){ this.print("info", msg, data); }
    warn(msg,data){ this.print("warn", msg, data); }
    error(msg,data){ this.print("error", msg, data); }
}

/**
 * This class defines a logger factory. To create a logger, call the create
 * function of a specific logger factory instance.
 *
 * @NOTE : The service static name should be set by clients if they want to
 * print out as a meta the service name that are using the loggers.
 */
module.exports = class LoggerFactory {
    constructor(namespace, opts = {}) {
        this.opts = lodash.merge({}, {
            logstashWinstonHost: LoggerFactory.logstashWinstonHost,
            service_name: LoggerFactory.service_name,
            namespace: namespace,
            disabled: false,
            useFileLogger: LoggerFactory.useFileLogger
        }, opts, {level: LoggerFactory.level||(process.env.NODE_ENV=="production"?"info":"debug")});
    }

    create(scope, trackId, opts) {
        return new Logger(scope, trackId, lodash.merge({}, this.opts, opts));
    }

    /**
     * This function returns it"s secret value only if app is no running in
     * production mode.
     *
     * @param  {string} value
     *     The secret value to be conditionally returned.
     */
    secret(value) {
        return process.env.NODE_ENV!="production"?value:undefined;
    }
};
