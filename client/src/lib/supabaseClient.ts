import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cjfifepjamtwoxnrptbk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_umMYj13C7YeA_E4JAbci8w_KmRqUt0W';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
