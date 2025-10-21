import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../supabaseCredentials';

let supabase: SupabaseClient | null = null;

// 新しい接続情報でSupabaseクライアントを初期化する関数
export const initializeSupabase = (url: string, key: string): SupabaseClient | null => {
    try {
        if (!url || !key) {
            console.warn("Supabase URL or Key is missing in credentials file.");
            supabase = null;
            return null;
        }
        supabase = createClient(url, key);
        return supabase;
    } catch (e) {
        console.error("Error initializing Supabase", e);
        supabase = null;
        return null;
    }
};

// 現在のSupabaseクライアントインスタンスを取得する関数
export const getSupabase = (): SupabaseClient => {
    // Initialize if not already done.
    if (!supabase) {
        initializeSupabase(SUPABASE_URL, SUPABASE_KEY);
    }
    if (!supabase) {
        // ここでエラーが投げられた場合、UI側で設定モーダルを表示する
        throw new Error("Supabase client is not initialized. Please configure credentials in supabaseCredentials.ts");
    }
    return supabase;
};

// 接続情報が設定されているか確認する関数
export const hasSupabaseCredentials = (): boolean => {
    return !!(SUPABASE_URL && SUPABASE_KEY);
};
