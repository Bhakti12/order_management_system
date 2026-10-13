import { UnauthorizedError } from "./errors";

export function checkAdminAuth(request: Request): void {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || adminToken.trim() === "") {
    // Admin token is optional; allowed if env var is unset
    return;
  }

  const customHeader = request.headers.get("x-admin-token");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (customHeader === adminToken || bearerToken === adminToken) {
    return;
  }

  throw new UnauthorizedError("Unauthorized: Missing or invalid administrator token");
}
