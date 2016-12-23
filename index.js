let LoggerFactory = null;

if(navigator && navigator.product == 'ReactNative') {
    console.log("is react native");
    LoggerFactory = require('./lib/react-native');
}
else {
    console.log("is NOT react native");
    LoggerFactory = require('./lib/index');
}

module.exports = LoggerFactory;
