import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Database = {
  public: {
    Tables: {
      admin_credentials: {
        Row: {
          id: string;
          password_hash: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          password_hash: string;
          updated_at: string;
        };
        Update: {
          id?: string;
          password_hash?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_entries: {
        Row: {
          section: string;
          slug: string;
          title: string;
          text: string;
          download_url: string | null;
          purchase_url: string | null;
          book_image_url: string | null;
          text_align: string | null;
          bold: boolean | null;
          italic: boolean | null;
          underline: boolean | null;
          text_layout: unknown | null;
          updated_at: string;
        };
        Insert: {
          section: string;
          slug: string;
          title: string;
          text: string;
          download_url?: string | null;
          purchase_url?: string | null;
          book_image_url?: string | null;
          text_align?: string | null;
          bold?: boolean | null;
          italic?: boolean | null;
          underline?: boolean | null;
          text_layout?: unknown | null;
          updated_at: string;
        };
        Update: {
          section?: string;
          slug?: string;
          title?: string;
          text?: string;
          download_url?: string | null;
          purchase_url?: string | null;
          book_image_url?: string | null;
          text_align?: string | null;
          bold?: boolean | null;
          italic?: boolean | null;
          underline?: boolean | null;
          text_layout?: unknown | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let cachedAdminClient: SupabaseClient<Database> | null | undefined;

function getSupabaseUrl() {
  return process.env.SUPABASE_URL?.trim() || "";
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export function getSupabaseAdminClient() {
  if (!isSupabaseConfigured()) return null;
  if (cachedAdminClient !== undefined) return cachedAdminClient;

  cachedAdminClient = createClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return cachedAdminClient;
}
