# Version 0.0.0
INI : Add gitignore, changelog and readme files.
FEA : Add basic functionality.
FEA : Add react-native specific logger.
FEA : Add index.js that dinamically return a correct logger for the environment.
ENH : Better logging for react-native.
ENH : Set node script as default script and remove root index.js.
FEA : Add service_index to logger meta data.
ENH : Change serice key of logger meta to service_name.
FEA : Add hostname to logger meta data.
FEA : Set logger level to debug in development env.
BUG : Missing level config in winston transport instantiation.
ENH : Set logger level to debug for any env except production.
FIX : Fix changelog.
ENH : Apply eslint recommended syntax.
FEA : Add options to LoggerFactory create method.
FEA : Add level static property to LoggerFactory that controls global logger level.
FEA : Log to files when enabled.
BUG : Correct a bug with level change of single winston logger instance.
ENH : Use daily rotate file logger.