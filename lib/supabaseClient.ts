
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mxzoccupixrelrclfsrq.supabase.co';
const supabaseAnonKey = 'sb_publishable_l-v_2gdqBTioxkw8VhDhnA_lYRg3mix';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
