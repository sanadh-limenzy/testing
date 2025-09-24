'use client';

import { supabase } from './supabase/client';

/**
 * Get the current session token for API requests
 */
export const getSessionToken = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session?.access_token || null;
};
