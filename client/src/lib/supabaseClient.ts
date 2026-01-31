// Supabase client for direct database access
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mtdngnyatbiipyumqmdd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZG5nbnlhdGJpaXB5dW1xbWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDU3NDksImV4cCI6MjA4MDU4MTc0OX0.ix8zGd39Ab-SWmrbzAEGMguDs2QMtCm2U-xoNxbZ18E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Important for mobile apps
    },
});

// Helper to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

// Helper to get current session
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}
