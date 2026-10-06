import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const email = typeof claims?.claims?.email === 'string' ? claims.claims.email : 'مدیر باغ'
  return <DashboardClient userEmail={email} />
}
