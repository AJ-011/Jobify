// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ddnesszhwlujejicsndb.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbmVzc3pod2x1amVqaWNzbmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjYxOTYsImV4cCI6MjA3MTA0MjE5Nn0.tevkbu63hhXW6FdZatn0e2qWb5N5ReziQnRTiFgWYKY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)