import { cookies } from "next/headers";
import { verifyOpsToken } from "@/lib/opsSession";

/**
 * Server-side gate for Operations Hub API routes.
 *
 * Previously this returned `cookie?.value === "1"`, which any client could
 * forge by sending `Cookie: visriva_ops_session=1`. It now requires a valid,
 * unexpired HMAC-signed session token minted by the server.
 */
export function isOperationsApiAuthorized(): boolean {
  const cookie = cookies().get("visriva_ops_session");
  return verifyOpsToken(cookie?.value);
}
