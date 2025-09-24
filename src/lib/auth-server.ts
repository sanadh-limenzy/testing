import { User, createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase/server";
import { env } from "@/env";

export async function getCurrentUserServer(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("Supabase auth error:", error);
      return null;
    }
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error in getCurrentUserServer:", error);
    return null;
  }
}

export async function getCurrentUserFromToken(
  token: string
): Promise<User | null> {
  try {
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    console.log("Token auth result:", {
      user: user ? { id: user.id, email: user.email } : null,
      error,
    });

    if (error) {
      console.error("Token auth error:", error);
    }

    return user;
  } catch (error) {
    console.error("Error in getCurrentUserFromToken:", error);
    return null;
  }
}
