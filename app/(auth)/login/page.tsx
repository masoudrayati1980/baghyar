'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    const supabase = createClient()
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.assign('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('حساب ساخته شد. اگر تأیید ایمیل فعال باشد، ایمیل تأیید را بررسی کنید؛ سپس وارد شوید.')
    }
    setBusy(false)
  }

  return (
    <main className="login">
      <section className="login-card">
        <div className="login-brand">🌳</div>
        <h1>باغ‌یار</h1>
        <p>سیستم جامع مدیریت باغ، آب، عملیات، تولید و هزینه‌ها؛ مناسب موبایل و آماده استقرار روی Vercel.</p>
        <div className="actions" style={{ marginTop: 14 }}>
          <button className={mode === 'login' ? 'btn btn-primary' : 'btn btn-ghost'} onClick={() => setMode('login')}>ورود</button>
          <button className={mode === 'signup' ? 'btn btn-primary' : 'btn btn-ghost'} onClick={() => setMode('signup')}>ساخت حساب</button>
        </div>
        <form onSubmit={submit} className="form-grid">
          <div className="field full"><label>ایمیل</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" /></div>
          <div className="field full"><label>رمز عبور</label><input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" /></div>
          <div className="field full"><button className="btn btn-primary" disabled={busy}>{busy ? 'در حال پردازش...' : mode === 'login' ? 'ورود به باغ‌یار' : 'ساخت حساب'}</button></div>
        </form>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
      </section>
    </main>
  )
}
