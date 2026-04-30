export class AppError extends Error {
  constructor(statusCode, message, code = "APP_ERROR", details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(404, message, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message, details) {
    super(409, message, "CONFLICT", details);
  }
}
