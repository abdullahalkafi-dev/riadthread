export interface ErrorSource {
  path: string;
  message: string;
}

/** An error whose message is safe to show to the client. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errorSources: ErrorSource[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, sources: ErrorSource[] = []) {
    return new AppError(400, message, sources);
  }
  static unauthorized(message = 'Please sign in to continue') {
    return new AppError(401, message);
  }
  static forbidden(message = 'You do not have permission to do that') {
    return new AppError(403, message);
  }
  static notFound(message = 'Not found') {
    return new AppError(404, message);
  }
  static conflict(message: string) {
    return new AppError(409, message);
  }
  static unprocessable(message: string, sources: ErrorSource[] = []) {
    return new AppError(422, message, sources);
  }
}
