import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY son obligatorias para Supabase Auth');
}

// In Node < 22, native WebSocket is absent; backend only uses Supabase for Auth verification.
class NoopWebSocketTransport {}

export const supabaseAuth = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  realtime: {
    transport: typeof WebSocket !== 'undefined' ? WebSocket : (NoopWebSocketTransport as any),
  },
});
