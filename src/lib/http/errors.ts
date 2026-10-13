export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class MenuItemNotFoundError extends AppError {
  constructor(itemId: string) {
    super(`Menu item with ID '${itemId}' does not exist`, 400, "MENU_ITEM_NOT_FOUND", { itemId });
  }
}

export class OrderNotFoundError extends AppError {
  constructor(orderId: string) {
    super(`Order with ID '${orderId}' not found`, 404, "ORDER_NOT_FOUND", { orderId });
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Cannot transition order status from '${currentStatus}' to '${targetStatus}'. Only sequential forward transitions are permitted.`,
      409,
      "INVALID_STATUS_TRANSITION",
      { currentStatus, targetStatus }
    );
  }
}

export class CannotCancelOrderError extends AppError {
  constructor(currentStatus: string) {
    super(
      `Cannot cancel order with status '${currentStatus}'. Orders can only be cancelled before dispatch (received or preparing).`,
      409,
      "CANNOT_CANCEL_ORDER",
      { currentStatus }
    );
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message = "Too many requests. Please try again shortly.") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized: Invalid or missing administrator credentials") {
    super(message, 401, "UNAUTHORIZED");
  }
}
