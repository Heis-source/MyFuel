const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase] SUPABASE_URL/SUPABASE_KEY no definidas. Historial desactivado.');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;
