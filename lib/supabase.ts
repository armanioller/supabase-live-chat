import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ChatMessage = {
  id: string
  room_id: string
  user_id: string
  username: string
  content: string
  created_at: string
}

export type ChatRoom = {
  id: string
  name: string
  created_at: string
}

export type ChatUser = {
  id: string
  username: string
  avatar_url?: string
  created_at: string
}
