'use client';

import { supabase } from './supabase/client';

/**
 * Get the current session token for API requests
 * Uses getUser() to authenticate the session with Supabase Auth server
 */
export const getSessionToken = async () => {
  // First verify the user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Error getting user:', userError);
    return null;
  }
  
  // Then get the session for the access token
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session?.access_token || null;
};
