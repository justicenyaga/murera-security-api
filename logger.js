const { createLogger, transports, format } = require("winston");
const { combine, colorize, timestamp, prettyPrint, printf, json, simple } =
  format;

const myTransports = [
  new transports.Console({
    format: combine(
      colorize({ level: true }),
      timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      prettyPrint(),
      printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
    ),
  }),
  new transports.File({
    filename: "logs/logfile.log",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
  }),
];

module.exports = createLogger({
  format: combine(prettyPrint(), simple()),
  level: "info",
  transports: myTransports,
  exceptionHandlers: [
    new transports.Console(),
    new transports.File({
      filename: "logs/exceptions.log",
      format: json(),
    }),
  ],
});
