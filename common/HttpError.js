class HttpError extends Error {
  constructor(success = false, message = 'Internal Server Error', statusCode = 505) {
    super(message);
    this.success = success;
    this.message = message;
    this.statusCode = statusCode;
  }
}
module.exports.default = HttpError;
