import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://loaxtuedwjgzptghxsfl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYXh0dWVkd2pnenB0Z2h4c2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODUxNzIsImV4cCI6MjA4OTA2MTE3Mn0.LiXhspeeS7HGISWgCmQ5c16gzwqiLry4WGle4QtI1AE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
