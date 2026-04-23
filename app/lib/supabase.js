import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nnviusewrqilghpwj sue.supabase.co'.replace(' ', '')
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udml1c2V3cnFpbGdocHdqc3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzc2MTksImV4cCI6MjA5MTk1MzYxOX0.1rrAqzCX3GALhFYsRdkVNgipowExtkB_Z4NVSGyTebE'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit', // 🔥 CLAVE PARA MAGIC LINK EN WEB
  },
})

export default supabase