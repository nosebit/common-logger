let lodash          = require('lodash'),
    crypto          = require('crypto'),
    moment          = require('moment');

/**
 * This class defines a logger that uses winston to log.
 */
class Logger {
    constructor(scope = "", trackId = null, opts = {}) {
        this.scope = scope;
        this.opts = opts;
        this.trackId = trackId || crypto.randomBytes(20).toString('hex');
        this.initialMoment = moment();
    }

    /**
     * This function prints an arbitrary level log.
     */
    print(level = "info", message = "", data = {}) {
        const namespace = this.opts.namespace;
        const dataStr = JSON.stringify(data);
        const scope = this.scope;

        message = `[${namespace}] ${scope} : ${message}`

        // Parse log level
        level = ['silly','verbose'].indexOf(level)>=0?'log':level;

        // debug,error,log,warn,info
        console[level](message, JSON.stringify({
            service: this.opts.service,
            namespace: namespace,
            scope: scope,
            level: level.toUpperCase(),
            trackId: this.trackId,
            elapsed: moment().diff(this.initialMoment),
            data: dataStr
        }));
    }

    silly(msg,data){ this.print('silly', msg, data); }
    debug(msg,data){ this.print('debug', msg, data); }
    verbose(msg,data){ this.print('verbose', msg, data); }
    info(msg,data){ this.print('info', msg, data); }
    warn(msg,data){ this.print('warn', msg, data); }
    error(msg,data){ this.print('error', msg, data); }
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
            service: LoggerFactory.service,
            namespace: namespace,
            disabled: false,
            level: 'info'
        }, opts);
    }

    create(scope, trackId) {
        return new Logger(scope, trackId, this.opts);
    }

    /**
     * This function returns it's secret value only if app is no running in
     * production mode.
     *
     * @param  {string} value
     *     The secret value to be conditionally returned.
     */
    secret(value) {
        return process.env.NODE_ENV!='production'?value:undefined;
    }
}
