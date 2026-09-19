import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pvswmpuzkvpqebxhvlcp.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c3dtcHV6a3ZwcWVieGh2bGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MDgyNTEsImV4cCI6MjEwNTM4NDI1MX0.a_S14dWIxFXjndtkQCsi-uOPhQaDF0gELxdYQ18VCok";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

