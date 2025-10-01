/**
 * Utility functions for working with auth cookies
 */

/**
 * Get the user_role from cookies (client-side)
 * Note: This only works with non-httpOnly cookies
 * For httpOnly cookies, use the server-side version
 */
export function getUserRoleFromCookies(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");
  const userRoleCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("user_role=")
  );

  if (!userRoleCookie) {
    return null;
  }

  return userRoleCookie.split("=")[1]?.trim() || null;
}

/**
 * Server-side function to get user_role from cookies
 * This should be called from a Server Component or API route
 */
export async function getUserRoleFromCookiesServer() {
  if (typeof window !== "undefined") {
    throw new Error("This function can only be called on the server");
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const userRole = cookieStore.get("user_role");
  
  return userRole?.value || null;
}

