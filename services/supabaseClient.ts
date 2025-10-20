import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

// アプリケーション起動時にローカルストレージから接続情報を読み込もうと試みる
try {
    const url = localStorage.getItem('supabaseUrl');
    const key = localStorage.getItem('supabaseKey');
    if (url && key) {
        supabase = createClient(url, key);
    }
} catch (e) {
    console.error("Error initializing Supabase from localStorage", e);
}

// 新しい接続情報でSupabaseクライアントを初期化し、ローカルストレージに保存する関数
export const initializeSupabase = (url: string, key: string): SupabaseClient | null => {
    try {
        localStorage.setItem('supabaseUrl', url);
        localStorage.setItem('supabaseKey', key);
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
    if (!supabase) {
        // ここでエラーが投げられた場合、UI側で設定モーダルを表示する
        throw new Error("Supabase client is not initialized. Please configure credentials.");
    }
    return supabase;
};

// 保存されている接続情報をクリアする関数
export const clearSupabaseCredentials = () => {
    try {
        localStorage.removeItem('supabaseUrl');
        localStorage.removeItem('supabaseKey');
        supabase = null;
    } catch (e) {
        console.error("Error clearing Supabase credentials", e);
    }
}

// 接続情報が設定されているか確認する関数
export const hasSupabaseCredentials = (): boolean => {
    try {
        return !!(localStorage.getItem('supabaseUrl') && localStorage.getItem('supabaseKey'));
    } catch (e) {
        return false;
    }
};