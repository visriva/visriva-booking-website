import { cookies } from "next/headers";

export function isOperationsApiAuthorized(): boolean {
  const cookie = cookies().get("visriva_ops_session");
  return cookie?.value === "1";
}
