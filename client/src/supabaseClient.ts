import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qpjdbuwbwnljvwrrgajv.supabase.co/'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwamRidXdid25sanZ3cnJnYWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDYyMTAsImV4cCI6MjA4ODg4MjIxMH0.YPGgMTYEX1pE_oKQ0naTo1OKi94xicqIFGyB5bQ8j9g'

export const supabase = createClient(supabaseUrl, supabaseKey)