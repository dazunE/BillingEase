/** An error the API explains to the caller: a status, a stable code and plain words. */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = (what = "That") => new AppError(404, "not_found", `${what} wasn't found.`);
export const badRequest = (message: string, fields?: Record<string, string>) => new AppError(400, "invalid", message, fields);
export const conflict = (message: string) => new AppError(409, "conflict", message);
export const forbidden = (message = "You don't have access to that.") => new AppError(403, "forbidden", message);
