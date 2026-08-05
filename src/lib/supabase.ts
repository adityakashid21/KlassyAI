import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfrrqapyciahtjnfuhdl.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ot98L8RJuwU7GdH8pqwABQ_ZprfnF6z';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
