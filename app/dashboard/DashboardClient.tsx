'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'dashboard' | 'structure' | 'water' | 'operations' | 'harvest' | 'finance' | 'inventory'

type Plot = { id: string; orchard_id: string; parent_plot_id: string | null; code: string; name: string | null; area_hectare: number | null; crop: string | null; variety: string | null; active: boolean; }
type Orchard = { id: string; name: string; area_hectare: number | null; location: string | null; }
type Pool = { id: string; name: string; capacity_m3: number; current_volume_m3: number; min_volume_m3: number; max_volume_m3: number | null; }
type Operation = { id: string; operation_type: string; operation_date: string; plot_id: string | null; quantity: number | null; unit: string | null; material_name: string | null; cost: number | null; notes: string | null; }
type Harvest = { id: string; harvest_date: string; plot_id: string | null; crop: string | null; variety: string | null; quantity_kg: number; grade: string | null; destination: string | null; }
type Expense = { id: string; expense_date: string; category: string; amount: number; plot_id: string | null; description: string | null; }
type InventoryItem = { id: string; name: string; category: string; unit: string; quantity: number; min_quantity: number; unit_price: number | null; }

type Counts = { orchards: number; plots: number; trees: number; pools: number; }

const opLabels: Record<string, string> = {
  irrigation: 'آبیاری', pruning: 'هرس', fertilizer: 'کوددهی', spraying: 'سمپاشی', pest_control: 'مبارزه با آفت',
  weeding: 'علف‌زدایی', soil: 'خاک‌ورزی/اصلاح خاک', planting: 'کاشت/جایگزینی', pollination: 'گرده‌افشانی', inspection: 'بازدید', repair: 'تعمیرات', other: 'سایر',
}
const expenseLabels: Record<string, string> = { water: 'آب', electricity: 'برق', fuel: 'سوخت', fertilizer: 'کود', pesticide: 'سم', labor: 'نیروی انسانی', tanker: 'تانکر', repair: 'تعمیرات', harvest: 'برداشت', transport: 'حمل‌ونقل', other: 'سایر' }

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>('dashboard')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [counts, setCounts] = useState<Counts>({ orchards: 0, plots: 0, trees: 0, pools: 0 })
  const [orchards, setOrchards] = useState<Orchard[]>([])
  const [plots, setPlots] = useState<Plot[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [operations, setOperations] = useState<Operation[]>([])
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  const [forms, setForms] = useState({
    orchardName: '', orchardArea: '', orchardLocation: '',
    plotCode: '', plotName: '', plotArea: '', plotCrop: '', plotVariety: '', plotOrchard: '',
    poolName: '', poolCapacity: '', poolCurrent: '', poolMin: '',
    operationType: 'irrigation', operationDate: new Date().toISOString().slice(0,10), operationPlot: '', operationQty: '', operationUnit: 'مترمکعب', operationMaterial: '', operationCost: '', operationNotes: '',
    harvestDate: new Date().toISOString().slice(0,10), harvestPlot: '', harvestCrop: '', harvestVariety: '', harvestQty: '', harvestGrade: '', harvestDestination: '',
    expenseDate: new Date().toISOString().slice(0,10), expenseCategory: 'water', expenseAmount: '', expensePlot: '', expenseDescription: '',
    itemName: '', itemCategory: 'کود', itemUnit: 'کیلوگرم', itemQty: '', itemMin: '', itemPrice: '',
  })

  useEffect(() => { refreshAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshAll() {
    setError('')
    try {
      const [o, p, t, w, ops, h, ex, inv] = await Promise.all([
        supabase.from('orchards').select('id,name,area_hectare,location').order('created_at', { ascending: false }),
        supabase.from('plots').select('id,orchard_id,parent_plot_id,code,name,area_hectare,crop,variety,active').order('created_at', { ascending: false }),
        supabase.from('trees').select('id', { count: 'exact', head: true }),
        supabase.from('water_pools').select('id,name,capacity_m3,current_volume_m3,min_volume_m3,max_volume_m3').order('name'),
        supabase.from('operations').select('id,operation_type,operation_date,plot_id,quantity,unit,material_name,cost,notes').order('operation_date', { ascending: false }).limit(20),
        supabase.from('harvests').select('id,harvest_date,plot_id,crop,variety,quantity_kg,grade,destination').order('harvest_date', { ascending: false }).limit(20),
        supabase.from('expenses').select('id,expense_date,category,amount,plot_id,description').order('expense_date', { ascending: false }).limit(20),
        supabase.from('inventory_items').select('id,name,category,unit,quantity,min_quantity,unit_price').order('name'),
      ])
      const firstError = [o.error,p.error,t.error,w.error,ops.error,h.error,ex.error,inv.error].find(Boolean)
      if (firstError) throw firstError
      setOrchards((o.data ?? []) as Orchard[]); setPlots((p.data ?? []) as Plot[]); setPools((w.data ?? []) as Pool[])
      setOperations((ops.data ?? []) as Operation[]); setHarvests((h.data ?? []) as Harvest[]); setExpenses((ex.data ?? []) as Expense[]); setInventory((inv.data ?? []) as InventoryItem[])
      setCounts({ orchards: o.data?.length ?? 0, plots: p.data?.length ?? 0, trees: t.count ?? 0, pools: w.data?.length ?? 0 })
    } catch (e) { setError((e as Error).message) }
  }

  async function insert(table: string, payload: Record<string, unknown>) {
    setBusy(true); setError(''); setMessage('')
    try {
      const { error } = await supabase.from(table).insert(payload)
      if (error) throw error
      setMessage('با موفقیت ثبت شد.')
      await refreshAll()
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function seedDemo() {
    setBusy(true); setError(''); setMessage('')
    try {
      const { data: orchard, error: oe } = await supabase.from('orchards').insert({ name: 'باغ نمونه', area_hectare: 12.5, location: 'قطعه آزمایشی' }).select().single()
      if (oe) throw oe
      const { data: plotData, error: pe } = await supabase.from('plots').insert([
        { orchard_id: orchard.id, code: 'A', name: 'قطعه A', area_hectare: 4.2, crop: 'بادام', variety: 'فرانیس', active: true },
        { orchard_id: orchard.id, code: 'B', name: 'قطعه B', area_hectare: 3.8, crop: 'بادام', variety: 'مامایی', active: true },
        { orchard_id: orchard.id, code: 'C', name: 'قطعه C', area_hectare: 4.5, crop: 'گردو', variety: 'چندلر', active: true },
      ]).select()
      if (pe) throw pe
      const { data: poolData, error: we } = await supabase.from('water_pools').insert([
        { name: 'استخر ۱', capacity_m3: 500, current_volume_m3: 360, min_volume_m3: 80 },
        { name: 'استخر ۲', capacity_m3: 650, current_volume_m3: 520, min_volume_m3: 100 },
        { name: 'استخر ۳', capacity_m3: 400, current_volume_m3: 125, min_volume_m3: 70 },
      ]).select()
      if (we) throw we
      const firstPlot = plotData?.[0]?.id
      await supabase.from('operations').insert({ operation_type: 'irrigation', operation_date: new Date().toISOString().slice(0,10), plot_id: firstPlot, quantity: 120, unit: 'مترمکعب', notes: 'آبیاری نمونه قطعه A' })
      await supabase.from('harvests').insert({ harvest_date: new Date().toISOString().slice(0,10), plot_id: firstPlot, crop: 'بادام', variety: 'فرانیس', quantity_kg: 850, grade: 'درجه ۱', destination: 'انبار مرکزی' })
      await supabase.from('expenses').insert({ expense_date: new Date().toISOString().slice(0,10), category: 'water', amount: 1850000, plot_id: firstPlot, description: 'برق و پمپاژ نمونه' })
      await supabase.from('inventory_items').insert({ name: 'کود NPK 20-20-20', category: 'کود', unit: 'کیلوگرم', quantity: 250, min_quantity: 50, unit_price: 125000 })
      setMessage(`اطلاعات نمونه ایجاد شد (${poolData?.length ?? 0} استخر، ${plotData?.length ?? 0} قطعه).`)
      await refreshAll()
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function signOut() { await supabase.auth.signOut(); window.location.assign('/login') }

  async function splitPlot(plot: Plot) {
    const first = window.prompt(`کد قطعه اول برای تقسیم ${plot.code}:`, `${plot.code}-1`); if (!first) return
    const second = window.prompt('کد قطعه دوم:', `${plot.code}-2`); if (!second) return
    setBusy(true); setError('');
    try {
      const { data: created, error: ce } = await supabase.from('plots').insert([
        { orchard_id: plot.orchard_id, parent_plot_id: plot.id, code: first, name: `زیرقطعه ${first}`, area_hectare: (plot.area_hectare ?? 0)/2, crop: plot.crop, variety: plot.variety, active: true },
        { orchard_id: plot.orchard_id, parent_plot_id: plot.id, code: second, name: `زیرقطعه ${second}`, area_hectare: (plot.area_hectare ?? 0)/2, crop: plot.crop, variety: plot.variety, active: true },
      ]).select('id,code')
      if (ce) throw ce
      const { error: ue } = await supabase.from('plots').update({ active: false, status: 'split' }).eq('id', plot.id)
      if (ue) throw ue
      await supabase.from('plot_relations').insert((created ?? []).map(row => ({ from_plot_id: plot.id, to_plot_id: row.id, relation_type: 'split', notes: `تقسیم قطعه ${plot.code}` })))
      setMessage(`قطعه ${plot.code} به ${first} و ${second} تقسیم شد.`)
      await refreshAll()
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function mergePlots() {
    if (selectedPlots.length < 2) { setError('حداقل دو قطعه فعال را انتخاب کنید.'); return }
    const code = window.prompt('کد قطعه ادغام‌شده:', `M-${Date.now().toString().slice(-4)}`); if (!code) return
    setBusy(true); setError('')
    try {
      const sources = plots.filter(p => selectedPlots.includes(p.id))
      const totalArea = sources.reduce((s,p)=>s+(p.area_hectare ?? 0),0)
      const orchardId = sources[0].orchard_id
      const { data: created, error: pe } = await supabase.from('plots').insert({ orchard_id: orchardId, code, name: `قطعه ادغام‌شده ${code}`, area_hectare: totalArea, crop: sources[0].crop, variety: sources[0].variety, active: true }).select().single()
      if (pe) throw pe
      const { error: ue } = await supabase.from('plots').update({ active: false, status: 'merged' }).in('id', selectedPlots)
      if (ue) throw ue
      await supabase.from('plot_relations').insert(sources.map(p => ({ from_plot_id: p.id, to_plot_id: created.id, relation_type: 'merge', notes: `ادغام در ${code}` })))
      setSelectedPlots([]); setMessage(`قطعات به ${code} ادغام شدند.`); await refreshAll()
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  const activePlots = plots.filter(p => p.active)
  const waterTotal = pools.reduce((sum,p)=>sum+(p.current_volume_m3 || 0),0)
  const expenseTotal = expenses.reduce((sum,e)=>sum+(Number(e.amount)||0),0)
  const harvestTotal = harvests.reduce((sum,h)=>sum+(Number(h.quantity_kg)||0),0)
  const lowInventory = inventory.filter(i => Number(i.quantity) <= Number(i.min_quantity)).length
  const selectedPool = pools.length ? pools[0] : null

  function field(key: keyof typeof forms, value: string) { setForms(f => ({ ...f, [key]: value })) }
  function plotName(id: string | null) { return plots.find(p => p.id === id)?.code ?? '—' }

  const nav: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '📊', label: 'داشبورد' }, { key: 'structure', icon: '🌳', label: 'باغ و قطعات' },
    { key: 'water', icon: '💧', label: 'منابع آب' }, { key: 'operations', icon: '🛠️', label: 'عملیات' },
    { key: 'harvest', icon: '🌱', label: 'تولید و برداشت' }, { key: 'finance', icon: '💰', label: 'هزینه‌ها' }, { key: 'inventory', icon: '🧪', label: 'انبار مواد' },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">🌳</div><div className="brand-name">باغ‌یار</div><div className="brand-sub">مدیریت جامع باغ و منابع</div></div>
        <nav className="nav">{nav.map(n => <button key={n.key} className={tab === n.key ? 'active' : ''} onClick={() => setTab(n.key)}><span>{n.icon}</span><span>{n.label}</span></button>)}</nav>
        <div className="sidebar-foot">کاربر: {userEmail}<br/>RLS و احراز هویت Supabase فعال</div>
      </aside>

      <main className="main">
        <header className="topbar"><div className="topbar-inner"><div><div className="topbar-title">{nav.find(n=>n.key===tab)?.label}</div><div className="topbar-sub">سیستم جامع مدیریت باغ، آب، عملیات، تولید و هزینه‌ها</div></div><div className="topbar-actions"><button className="btn btn-soft" onClick={seedDemo} disabled={busy}>✨ داده نمونه</button><button className="btn btn-ghost" onClick={refreshAll}>↻ بروزرسانی</button><button className="btn btn-danger" onClick={signOut}>خروج</button></div></div></header>

        <div className="content">
          {message && <div className="success" style={{marginBottom:12}}>{message}</div>}
          {error && <div className="error" style={{marginBottom:12}}>{error}</div>}

          {tab === 'dashboard' && <>
            <section className="hero"><div className="hero-card"><h1>سلام، {userEmail.split('@')[0]} 👋</h1><p>اینجا مرکز کنترل باغ شماست؛ ساختار قطعات، آب، عملیات، تولید، هزینه و موجودی را یکجا ببینید. تاریخچه تقسیم و ادغام قطعات نیز حفظ می‌شود.</p></div><div className="hero-mini"><div className="hero-mini-label">موجودی تقریبی آب همه استخرها</div><div className="hero-mini-value">{waterTotal.toLocaleString('fa-IR')} m³</div><div className="muted">۳ استخر نمونه/تعریف‌شده: {selectedPool ? `${selectedPool.name} ${selectedPool.current_volume_m3}m³` : '—'}</div></div></section>
            <section className="stats"><div className="stat"><div className="stat-label">باغ‌ها</div><div className="stat-value">{counts.orchards.toLocaleString('fa-IR')}</div><div className="stat-meta">ساختارهای مستقل</div></div><div className="stat"><div className="stat-label">قطعات</div><div className="stat-value">{activePlots.length.toLocaleString('fa-IR')}</div><div className="stat-meta">قطعه فعال</div></div><div className="stat"><div className="stat-label">درختان</div><div className="stat-value">{counts.trees.toLocaleString('fa-IR')}</div><div className="stat-meta">شناسه یکتا برای هر درخت</div></div><div className="stat"><div className="stat-label">برداشت ثبت‌شده</div><div className="stat-value">{harvestTotal.toLocaleString('fa-IR')} kg</div><div className="stat-meta">بر اساس ۲۰ رکورد اخیر</div></div></section>
            <div className="grid-2"><section className="card"><div className="card-head"><div className="card-title">وضعیت استخرها</div><button className="btn btn-soft" onClick={()=>setTab('water')}>جزئیات</button></div>{pools.length===0 ? <div className="empty">هنوز استخر تعریف نشده است.</div> : pools.map(p => <div key={p.id} style={{marginBottom:13}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}><b>{p.name}</b><span>{Number(p.current_volume_m3).toLocaleString('fa-IR')} / {Number(p.capacity_m3).toLocaleString('fa-IR')} m³</span></div><div className="progress"><span style={{width:`${Math.min(100,Math.max(0,(Number(p.current_volume_m3)/Math.max(1,Number(p.capacity_m3)))*100))}%`}} /></div><div className="muted" style={{marginTop:5}}>حداقل هشدار: {p.min_volume_m3} m³</div></div>)}</section><section className="card"><div className="card-head"><div className="card-title">عملیات اخیر</div><button className="btn btn-soft" onClick={()=>setTab('operations')}>مشاهده همه</button></div>{operations.length===0 ? <div className="empty">هنوز عملیات ثبت نشده است.</div> : <div className="table-wrap"><table><thead><tr><th>تاریخ</th><th>نوع</th><th>قطعه</th><th>مقدار</th></tr></thead><tbody>{operations.slice(0,7).map(o=><tr key={o.id}><td>{o.operation_date}</td><td>{opLabels[o.operation_type] ?? o.operation_type}</td><td>{plotName(o.plot_id)}</td><td>{o.quantity ? `${o.quantity} ${o.unit ?? ''}` : '—'}</td></tr>)}</tbody></table></div>}</section></div>
            <div className="grid-2" style={{marginTop:14}}><section className="card"><div className="card-head"><div className="card-title">هزینه‌های ثبت‌شده</div><button className="btn btn-soft" onClick={()=>setTab('finance')}>جزئیات</button></div><div className="stat-value" style={{fontSize:26}}>{expenseTotal.toLocaleString('fa-IR')} ریال</div><div className="muted">جمع ۲۰ هزینه اخیر</div></section><section className="card"><div className="card-head"><div className="card-title">هشدار انبار</div><button className="btn btn-soft" onClick={()=>setTab('inventory')}>مدیریت انبار</button></div>{lowInventory===0 ? <div className="notice">موجودی پایین ندارید.</div> : <div className="notice">{lowInventory} قلم به حداقل موجودی رسیده یا کمتر از آن است.</div>}</section></div>
          </>}

          {tab === 'structure' && <>
            <section className="card"><div className="card-head"><div><div className="card-title">ساختار باغ و قطعات</div><div className="muted">قطعه‌ها پویا هستند؛ ایجاد، تقسیم، ادغام و غیرفعال‌سازی بدون حذف تاریخچه.</div></div><div className="actions"><button className="btn btn-primary" onClick={()=>insert('orchards',{name: forms.orchardName || 'باغ جدید', area_hectare: Number(forms.orchardArea)||null, location: forms.orchardLocation || null})}>+ باغ جدید</button><button className="btn btn-soft" onClick={()=>insert('plots',{orchard_id: forms.plotOrchard || orchards[0]?.id, code: forms.plotCode || `P-${Date.now()}`, name: forms.plotName || null, area_hectare: Number(forms.plotArea)||null, crop: forms.plotCrop || null, variety: forms.plotVariety || null, active:true})} disabled={!forms.plotOrchard && orchards.length===0}>+ قطعه جدید</button></div></div><div className="form-grid" style={{marginBottom:18}}><div className="field"><label>نام باغ</label><input value={forms.orchardName} onChange={e=>field('orchardName',e.target.value)} placeholder="مثلاً باغ مرکزی"/></div><div className="field"><label>مساحت (هکتار)</label><input inputMode="decimal" value={forms.orchardArea} onChange={e=>field('orchardArea',e.target.value)} /></div><div className="field"><label>موقعیت</label><input value={forms.orchardLocation} onChange={e=>field('orchardLocation',e.target.value)} /></div><div className="field"><label>باغ مقصد قطعه</label><select value={forms.plotOrchard} onChange={e=>field('plotOrchard',e.target.value)}><option value="">انتخاب باغ</option>{orchards.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div><div className="field"><label>کد قطعه</label><input value={forms.plotCode} onChange={e=>field('plotCode',e.target.value)} placeholder="A1"/></div><div className="field"><label>نام قطعه</label><input value={forms.plotName} onChange={e=>field('plotName',e.target.value)} /></div><div className="field"><label>مساحت قطعه</label><input value={forms.plotArea} onChange={e=>field('plotArea',e.target.value)} /></div><div className="field"><label>نوع میوه</label><input value={forms.plotCrop} onChange={e=>field('plotCrop',e.target.value)} placeholder="بادام" /></div><div className="field"><label>رقم</label><input value={forms.plotVariety} onChange={e=>field('plotVariety',e.target.value)} placeholder="مامایی" /></div></div><div className="section-note">برای تقسیم، یک قطعه را انتخاب و «تقسیم» را بزنید. برای ادغام، دو یا چند قطعه فعال را انتخاب کنید و «ادغام قطعات» را اجرا کنید. قطعه‌های قبلی غیرفعال می‌شوند اما رکورد و ارتباط تاریخی آن‌ها باقی می‌ماند.</div><div className="actions" style={{marginBottom:10}}><button className="btn btn-primary" disabled={selectedPlots.length<2 || busy} onClick={mergePlots}>ادغام قطعات ({selectedPlots.length})</button></div><div className="table-wrap"><table><thead><tr><th></th><th>باغ</th><th>کد</th><th>مساحت</th><th>میوه</th><th>رقم</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{plots.length===0 ? <tr><td colSpan={8}><div className="empty">قطعه‌ای ثبت نشده است.</div></td></tr> : plots.map(p=><tr key={p.id}><td>{p.active && <input type="checkbox" checked={selectedPlots.includes(p.id)} onChange={e=>setSelectedPlots(s=>e.target.checked?[...s,p.id]:s.filter(x=>x!==p.id))}/>}</td><td>{orchards.find(o=>o.id===p.orchard_id)?.name ?? '—'}</td><td><b>{p.code}</b></td><td>{p.area_hectare ?? '—'}</td><td>{p.crop ?? '—'}</td><td>{p.variety ?? '—'}</td><td>{p.active?<span className="badge badge-green">فعال</span>:<span className="badge badge-yellow">تاریخی</span>}</td><td>{p.active && <button className="btn btn-warning" onClick={()=>splitPlot(p)}>تقسیم</button>}</td></tr>)}</tbody></table></div></section></>}

          {tab === 'water' && <>
            <section className="grid-2"><section className="card"><div className="card-head"><div className="card-title">استخرها</div><div className="muted">{waterTotal.toLocaleString('fa-IR')} m³ موجودی</div></div><div className="form-grid"><div className="field"><label>نام استخر</label><input value={forms.poolName} onChange={e=>field('poolName',e.target.value)} placeholder="استخر ۴" /></div><div className="field"><label>ظرفیت (m³)</label><input value={forms.poolCapacity} onChange={e=>field('poolCapacity',e.target.value)} /></div><div className="field"><label>موجودی اولیه (m³)</label><input value={forms.poolCurrent} onChange={e=>field('poolCurrent',e.target.value)} /></div><div className="field"><label>حداقل هشدار (m³)</label><input value={forms.poolMin} onChange={e=>field('poolMin',e.target.value)} /></div></div><button className="btn btn-primary" style={{marginTop:12}} onClick={()=>insert('water_pools',{name:forms.poolName || `استخر ${pools.length+1}`, capacity_m3:Number(forms.poolCapacity)||0, current_volume_m3:Number(forms.poolCurrent)||0, min_volume_m3:Number(forms.poolMin)||0})}>+ ثبت استخر</button><div className="table-wrap" style={{marginTop:14}}><table><thead><tr><th>استخر</th><th>موجودی</th><th>ظرفیت</th><th>وضعیت</th></tr></thead><tbody>{pools.map(p=><tr key={p.id}><td>{p.name}</td><td>{p.current_volume_m3}</td><td>{p.capacity_m3}</td><td>{Number(p.current_volume_m3)<=Number(p.min_volume_m3)?<span className="badge badge-red">هشدار</span>:<span className="badge badge-green">مناسب</span>}</td></tr>)}</tbody></table></div></section><section className="card"><div className="card-head"><div className="card-title">ورود/مصرف آب</div><div className="muted">ثبت ورود از چاه/تانکر و مصرف قطعه در نسخه بعدی کامل‌تر می‌شود.</div></div><div className="notice">هسته داده‌ای آب آماده است و موجودی فعلی استخرها جداگانه نگهداری می‌شود. در این نسخه، داشبورد از موجودی فعلی برای هشدار استفاده می‌کند.</div><div style={{marginTop:14}}><button className="btn btn-soft" onClick={()=>insert('water_transactions',{pool_id:pools[0]?.id, transaction_type:'in', quantity_m3:0, notes:'رکورد آماده برای تکمیل'})} disabled={!pools.length}>ثبت رکورد نمونه آب</button></div></section></section>
          </>}

          {tab === 'operations' && <section className="card"><div className="card-head"><div><div className="card-title">عملیات باغ</div><div className="muted">ثبت آبیاری، هرس، کوددهی، سمپاشی، بازدید و سایر عملیات.</div></div></div><div className="form-grid"><div className="field"><label>نوع عملیات</label><select value={forms.operationType} onChange={e=>field('operationType',e.target.value)}>{Object.entries(opLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div><div className="field"><label>تاریخ</label><input type="date" value={forms.operationDate} onChange={e=>field('operationDate',e.target.value)} /></div><div className="field"><label>قطعه</label><select value={forms.operationPlot} onChange={e=>field('operationPlot',e.target.value)}><option value="">همه/بدون قطعه</option>{activePlots.map(p=><option key={p.id} value={p.id}>{p.code} - {p.crop ?? ''}</option>)}</select></div><div className="field"><label>مقدار</label><input value={forms.operationQty} onChange={e=>field('operationQty',e.target.value)} /></div><div className="field"><label>واحد</label><input value={forms.operationUnit} onChange={e=>field('operationUnit',e.target.value)} /></div><div className="field"><label>ماده مصرفی</label><input value={forms.operationMaterial} onChange={e=>field('operationMaterial',e.target.value)} /></div><div className="field"><label>هزینه (ریال)</label><input value={forms.operationCost} onChange={e=>field('operationCost',e.target.value)} /></div><div className="field full"><label>توضیحات</label><textarea rows={3} value={forms.operationNotes} onChange={e=>field('operationNotes',e.target.value)} /></div></div><button className="btn btn-primary" style={{marginTop:12}} onClick={()=>insert('operations',{operation_type:forms.operationType,operation_date:forms.operationDate,plot_id:forms.operationPlot||null,quantity:Number(forms.operationQty)||null,unit:forms.operationUnit||null,material_name:forms.operationMaterial||null,cost:Number(forms.operationCost)||0,notes:forms.operationNotes||null})}>+ ثبت عملیات</button><div className="table-wrap" style={{marginTop:14}}><table><thead><tr><th>تاریخ</th><th>عملیات</th><th>قطعه</th><th>مقدار</th><th>هزینه</th><th>یادداشت</th></tr></thead><tbody>{operations.map(o=><tr key={o.id}><td>{o.operation_date}</td><td>{opLabels[o.operation_type] ?? o.operation_type}</td><td>{plotName(o.plot_id)}</td><td>{o.quantity ?? '—'} {o.unit ?? ''}</td><td>{Number(o.cost||0).toLocaleString('fa-IR')}</td><td>{o.notes ?? '—'}</td></tr>)}</tbody></table></div></section>}

          {tab === 'harvest' && <section className="card"><div className="card-head"><div><div className="card-title">تولید و برداشت</div><div className="muted">ثبت محصول بر اساس باغ، قطعه، میوه، رقم، کیفیت و مقصد.</div></div></div><div className="form-grid"><div className="field"><label>تاریخ برداشت</label><input type="date" value={forms.harvestDate} onChange={e=>field('harvestDate',e.target.value)} /></div><div className="field"><label>قطعه</label><select value={forms.harvestPlot} onChange={e=>field('harvestPlot',e.target.value)}><option value="">انتخاب قطعه</option>{activePlots.map(p=><option key={p.id} value={p.id}>{p.code}</option>)}</select></div><div className="field"><label>نوع میوه</label><input value={forms.harvestCrop} onChange={e=>field('harvestCrop',e.target.value)} placeholder="بادام" /></div><div className="field"><label>رقم</label><input value={forms.harvestVariety} onChange={e=>field('harvestVariety',e.target.value)} placeholder="فرانیس" /></div><div className="field"><label>مقدار (کیلوگرم)</label><input value={forms.harvestQty} onChange={e=>field('harvestQty',e.target.value)} /></div><div className="field"><label>درجه کیفیت</label><input value={forms.harvestGrade} onChange={e=>field('harvestGrade',e.target.value)} placeholder="درجه ۱" /></div><div className="field full"><label>مقصد</label><input value={forms.harvestDestination} onChange={e=>field('harvestDestination',e.target.value)} placeholder="انبار / فروش / سردخانه" /></div></div><button className="btn btn-primary" style={{marginTop:12}} onClick={()=>insert('harvests',{harvest_date:forms.harvestDate,plot_id:forms.harvestPlot||null,crop:forms.harvestCrop||null,variety:forms.harvestVariety||null,quantity_kg:Number(forms.harvestQty)||0,grade:forms.harvestGrade||null,destination:forms.harvestDestination||null})}>+ ثبت برداشت</button><div className="table-wrap" style={{marginTop:14}}><table><thead><tr><th>تاریخ</th><th>قطعه</th><th>محصول</th><th>رقم</th><th>کیلو</th><th>کیفیت</th><th>مقصد</th></tr></thead><tbody>{harvests.map(h=><tr key={h.id}><td>{h.harvest_date}</td><td>{plotName(h.plot_id)}</td><td>{h.crop ?? '—'}</td><td>{h.variety ?? '—'}</td><td>{Number(h.quantity_kg).toLocaleString('fa-IR')}</td><td>{h.grade ?? '—'}</td><td>{h.destination ?? '—'}</td></tr>)}</tbody></table></div></section>}

          {tab === 'finance' && <section className="card"><div className="card-head"><div><div className="card-title">هزینه‌ها</div><div className="muted">تجمیع هزینه آب، برق، سوخت، کود، سم، نیروی انسانی، تعمیرات و برداشت.</div></div><div className="hero-mini-value" style={{fontSize:20}}>{expenseTotal.toLocaleString('fa-IR')} ریال</div></div><div className="form-grid"><div className="field"><label>تاریخ</label><input type="date" value={forms.expenseDate} onChange={e=>field('expenseDate',e.target.value)} /></div><div className="field"><label>دسته</label><select value={forms.expenseCategory} onChange={e=>field('expenseCategory',e.target.value)}>{Object.entries(expenseLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div><div className="field"><label>مبلغ (ریال)</label><input value={forms.expenseAmount} onChange={e=>field('expenseAmount',e.target.value)} /></div><div className="field"><label>قطعه</label><select value={forms.expensePlot} onChange={e=>field('expensePlot',e.target.value)}><option value="">بدون قطعه</option>{activePlots.map(p=><option key={p.id} value={p.id}>{p.code}</option>)}</select></div><div className="field full"><label>شرح</label><input value={forms.expenseDescription} onChange={e=>field('expenseDescription',e.target.value)} /></div></div><button className="btn btn-primary" style={{marginTop:12}} onClick={()=>insert('expenses',{expense_date:forms.expenseDate,category:forms.expenseCategory,amount:Number(forms.expenseAmount)||0,plot_id:forms.expensePlot||null,description:forms.expenseDescription||null})}>+ ثبت هزینه</button><div className="table-wrap" style={{marginTop:14}}><table><thead><tr><th>تاریخ</th><th>دسته</th><th>مبلغ</th><th>قطعه</th><th>شرح</th></tr></thead><tbody>{expenses.map(e=><tr key={e.id}><td>{e.expense_date}</td><td>{expenseLabels[e.category] ?? e.category}</td><td>{Number(e.amount).toLocaleString('fa-IR')}</td><td>{plotName(e.plot_id)}</td><td>{e.description ?? '—'}</td></tr>)}</tbody></table></div></section>}

          {tab === 'inventory' && <section className="card"><div className="card-head"><div><div className="card-title">انبار کود و سموم</div><div className="muted">موجودی، حداقل موجودی و قیمت واحد.</div></div><span className="badge badge-yellow">{lowInventory} هشدار</span></div><div className="form-grid"><div className="field"><label>نام ماده</label><input value={forms.itemName} onChange={e=>field('itemName',e.target.value)} placeholder="کود NPK" /></div><div className="field"><label>دسته</label><input value={forms.itemCategory} onChange={e=>field('itemCategory',e.target.value)} /></div><div className="field"><label>واحد</label><input value={forms.itemUnit} onChange={e=>field('itemUnit',e.target.value)} /></div><div className="field"><label>موجودی</label><input value={forms.itemQty} onChange={e=>field('itemQty',e.target.value)} /></div><div className="field"><label>حداقل موجودی</label><input value={forms.itemMin} onChange={e=>field('itemMin',e.target.value)} /></div><div className="field"><label>قیمت واحد</label><input value={forms.itemPrice} onChange={e=>field('itemPrice',e.target.value)} /></div></div><button className="btn btn-primary" style={{marginTop:12}} onClick={()=>insert('inventory_items',{name:forms.itemName,category:forms.itemCategory,unit:forms.itemUnit,quantity:Number(forms.itemQty)||0,min_quantity:Number(forms.itemMin)||0,unit_price:Number(forms.itemPrice)||null})}>+ ثبت قلم</button><div className="table-wrap" style={{marginTop:14}}><table><thead><tr><th>ماده</th><th>دسته</th><th>موجودی</th><th>حداقل</th><th>وضعیت</th><th>قیمت واحد</th></tr></thead><tbody>{inventory.map(i=><tr key={i.id}><td><b>{i.name}</b></td><td>{i.category}</td><td>{i.quantity} {i.unit}</td><td>{i.min_quantity}</td><td>{Number(i.quantity)<=Number(i.min_quantity)?<span className="badge badge-red">نیاز به خرید</span>:<span className="badge badge-green">مناسب</span>}</td><td>{i.unit_price ? Number(i.unit_price).toLocaleString('fa-IR') : '—'}</td></tr>)}</tbody></table></div></section>}
        </div>
      </main>
    </div>
  )
}
