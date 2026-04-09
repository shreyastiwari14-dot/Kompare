import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oymcvzzfgmhaafnmizks.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bWN2enpmZ21oYWFmbm1pemtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjQxMzQsImV4cCI6MjA5MDYwMDEzNH0.W312oY2XoXjEpvilp6OkZIssbhRLYT3Qll5etw69rhM";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase configuration");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
