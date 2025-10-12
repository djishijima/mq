import { createClient } from '@supabase/supabase-js';

// These values were provided by the user.
// Make sure they match the API settings in your Supabase project dashboard.
const supabaseUrl = 'https://urkdedctyprcizhsvxma.supabase.co';
const supabaseKey = 'sb_publishable_ngdozhnBbl1olJ_m3HGqPw_3ZHcoas7';

if (!supabaseUrl || !supabaseKey) {
  // This should not happen as the values are hardcoded.
  throw new Error("Supabase URL and Key must be provided in services/supabaseClient.ts");
}

// Initialize the Supabase client.
// The public anonymous key is used here, which is safe to expose in a client-side application.
export const supabase = createClient(supabaseUrl, supabaseKey);