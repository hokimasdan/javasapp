import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Ini adalah "Alat Telepon" kita untuk ngobrol ke Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)