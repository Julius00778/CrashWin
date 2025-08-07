import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hodnaodlnrmtapwcjjiu.supabase.co'; // 🔁 replace with yours
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZG5hb2RsbnJtdGFwd2Nqaml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODk2OTYsImV4cCI6MjA3MDE2NTY5Nn0.sDRc1sLErgAfoxfGoZMID2iZDhWabLRcqH4IBf2jJ-s'; // 🔁 replace with yours

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
