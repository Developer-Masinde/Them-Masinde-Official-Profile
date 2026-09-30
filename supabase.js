// The CDN script already created a global `supabase` object.
// So rename YOUR client to avoid colliding with it.
const SUPABASE_URL = "https://eflulwsoskktjbejdlck.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3CjEYG7Fkq19NtLCylGXMA_lTEImEuR";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
