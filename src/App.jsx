import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, CalendarDays, Users, ClipboardCheck, Plus, Search, Sun, Moon,
  Download, FileText, ChevronRight, ChevronDown, Clock3, Check, X, CircleHelp,
  Trash2, Pencil, ArrowLeft, CheckCircle2, Circle, CalendarRange, Sparkles,
  MoreHorizontal, UserRoundPlus, Save, Filter, Menu, AlertCircle
} from 'lucide-react';

const STORE_KEY = 'dasara-attendance-v1';
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const uid = () => Math.random().toString(36).slice(2, 10);
const defaultState = { events: [], theme: 'light' };
const safeRead = () => {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; }
  catch { return defaultState; }
};
const dateLabel = (iso, opts = { day:'numeric', month:'short', year:'numeric' }) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', opts);
const fullDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function makeDates(start, end) {
  if (!start || !end || end < start) return start ? [start] : [];
  const out = []; const d = new Date(`${start}T12:00:00`); const last = new Date(`${end}T12:00:00`);
  while (d <= last && out.length < 730) { out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); d.setDate(d.getDate()+1); }
  return out;
}
function makeEvent({name, description, membersText, start, end, sessions}) {
  const members = [...new Set(membersText.split(/\r?\n|,/).map(x => x.trim()).filter(Boolean))].map((name, i) => ({ id: uid(), name, serial: i+1 }));
  const dates = makeDates(start, end);
  const attendance = {};
  dates.forEach(date => sessions.forEach((s, i) => { attendance[`${date}::${s.id}`] = {}; }));
  return { id: uid(), name: name.trim(), description: description.trim(), createdAt: new Date().toISOString(), start, end: dates[dates.length-1] || start, dates, members, sessions, attendance, };
}
function downloadBlob(content, filename, type='text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }

function App() {
  const [data, setData] = useState(safeRead);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('home');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingMembers, setEditingMembers] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);
  const events = data.events;
  const selected = events.find(e => e.id === selectedId) || null;
  const updateEvent = (id, updater) => setData(prev => ({ ...prev, events: prev.events.map(e => e.id === id ? updater(e) : e) }));
  const openEvent = (id) => { setSelectedId(id); setView('event'); setMobileMenu(false); };
  const createEvent = (form) => {
    const event = makeEvent(form);
    if (!event.name) { setToast('Please enter an event name.'); return; }
    if (!event.members.length) { setToast('Add at least one member to continue.'); return; }
    setData(prev => ({ ...prev, events: [event, ...prev.events] }));
    setSelectedId(event.id); setView('event'); setShowCreate(false); setToast('Attendance event created and saved on this device.');
  };
  const deleteEvent = (event) => {
    if (!confirm(`Delete "${event.name}" and all its attendance records? This cannot be undone.`)) return;
    setData(prev => ({ ...prev, events: prev.events.filter(e => e.id !== event.id) }));
    setSelectedId(null); setView('home'); setToast('Event deleted.');
  };
  const toggleTheme = () => setData(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  const filteredEvents = events.filter(e => `${e.name} ${e.description}`.toLowerCase().includes(search.toLowerCase()));
  const allMarked = (event) => {
    let total = 0, marked = 0;
    event.dates.forEach(d => event.sessions.forEach(s => event.members.forEach(m => {
      total++; if (event.attendance?.[`${d}::${s.id}`]?.[m.id]) marked++;
    })));
    return { total, marked, percent: total ? Math.round(marked / total * 100) : 0 };
  };
  const totalMembers = events.reduce((sum,e) => sum + e.members.length, 0);
  const totalSessions = events.reduce((sum,e) => sum + e.dates.length * e.sessions.length, 0);

  return <div className={`app ${data.theme === 'dark' ? 'dark' : ''}`}>
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={23}/></div><div><b>Dasara<span>Desk</span></b><small>ACTIVITY MANAGEMENT</small></div><button className="icon-btn mobile-close" onClick={() => setMobileMenu(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => {setView('home');setSelectedId(null);setMobileMenu(false)}}><span className="nav-icon"><ClipboardCheck size={18}/></span> Overview <span className="nav-count">{events.length}</span></button>
      <div className="sidebar-section-head"><span>YOUR EVENTS</span><button className="tiny-plus" onClick={() => setShowCreate(true)} aria-label="Create event"><Plus size={16}/></button></div>
      <div className="event-nav-list">
        {events.slice(0,7).map(e => <button key={e.id} className={`event-nav ${selectedId === e.id ? 'chosen' : ''}`} onClick={() => openEvent(e.id)}><span className="event-dot"/><span className="event-nav-name">{e.name}</span><ChevronRight size={14}/></button>)}
        {!events.length && <p className="sidebar-empty">Your created events will appear here.</p>}
      </div>
      <div className="sidebar-bottom"><div className="local-card"><div className="local-icon"><Save size={17}/></div><div><b>Saved on this device</b><small>Changes save automatically</small></div><CheckCircle2 size={16} className="saved-check"/></div><button className="nav-item" onClick={() => setShowCreate(true)}><span className="nav-icon"><Plus size={18}/></span> Create new event</button></div>
      <div className="sidebar-footer"><span className="status-dot"/> Local storage active <span className="version">v1.0</span></div>
    </aside>
    {mobileMenu && <div className="scrim" onClick={() => setMobileMenu(false)}/>}
    <main className="main">
      <header className="topbar"><button className="icon-btn mobile-menu-btn" onClick={() => setMobileMenu(true)}><Menu size={20}/></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><b>{view === 'home' ? 'Overview' : selected?.name || 'Event'}</b></div><div className="top-actions"><div className="saved-indicator"><span className="status-dot"/> All changes saved</div><button className="icon-btn theme-btn" title={data.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onClick={toggleTheme}>{data.theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button><div className="avatar">AD</div></div></header>
      {view === 'home' || !selected ? <section className="page">
        <div className="hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> YOUR ACTIVITY, ORGANIZED</div><h1>Attendance, <em>without</em><br className="desktop-break"/> the paperwork.</h1><p>Create an event once, add your members, plan every date and session, and keep a clean record of every attendance.</p><div className="hero-actions"><button className="primary-btn" onClick={() => setShowCreate(true)}><Plus size={18}/> Create attendance event</button><button className="text-btn" onClick={() => document.getElementById('events-section')?.scrollIntoView({behavior:'smooth'})}>Explore your events <ChevronRight size={16}/></button></div></div><div className="hero-art"><div className="art-glow"/><div className="calendar-card"><div className="calendar-top"><span>OCTOBER 2026</span><CalendarDays size={17}/></div><div className="calendar-grid">{['M','T','W','T','F','S','S'].map((d,i)=><span className="weekday" key={i}>{d}</span>)}{Array.from({length:35},(_,i)=><span key={i} className={`${[3,8,14,21,27].includes(i) ? 'cal-mark' : ''} ${i===14?'cal-selected':''}`}>{i<3||i>33?'':i-2}</span>)}</div><div className="calendar-foot"><span className="cal-dot"/> Attendance planned <b>+12%</b></div></div><div className="floating-note"><span className="float-check"><Check size={15}/></span><div><b>Session recorded</b><small>Saved automatically</small></div></div><div className="floating-stat"><span className="mini-stat-icon"><Users size={17}/></span><div><b>One member list</b><small>For every session</small></div></div></div></div>
        <div className="stats-grid"><Stat icon={<ClipboardCheck size={19}/>} label="Attendance events" value={events.length} note="Your organized event folders" tone="violet"/><Stat icon={<Users size={19}/>} label="Member entries" value={totalMembers} note="Across all your events" tone="blue"/><Stat icon={<CalendarRange size={19}/>} label="Planned sessions" value={totalSessions} note="Dates × sessions per day" tone="orange"/><Stat icon={<CheckCircle2 size={19}/>} label="Local-first storage" value="ON" note="Survives refresh on this device" tone="green"/></div>
        <div className="section-heading" id="events-section"><div><div className="section-kicker">YOUR WORKSPACE</div><h2>Attendance events <span className="pill">{events.length}</span></h2><p>Each event has its own members, dates, sessions, and reports.</p></div><button className="outline-btn" onClick={() => setShowCreate(true)}><Plus size={17}/> New event</button></div>
        <div className="event-tools"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your events..."/></div><div className="sort-label"><span className="status-dot"/> {events.length} {events.length === 1 ? 'event' : 'events'} saved</div></div>
        {filteredEvents.length ? <div className="event-grid">{filteredEvents.map(e => <EventCard key={e.id} event={e} progress={allMarked(e)} onOpen={() => openEvent(e.id)}/>)}</div> : <div className="empty-state"><div className="empty-illustration"><CalendarDays size={34}/><span><Plus size={18}/></span></div><h3>{search ? 'No matching events' : 'Your first attendance event starts here'}</h3><p>{search ? 'Try another search term.' : 'Create an event, enter your member list once, then take attendance session by session.'}</p>{!search && <button className="primary-btn" onClick={() => setShowCreate(true)}><Plus size={18}/> Create your first event</button>}</div>}
        <div className="privacy-note"><div className="privacy-icon"><Save size={18}/></div><div><b>Your data stays on this device</b><p>Attendance is saved in this browser automatically. Use Export / Print reports regularly as a backup, and export your data before clearing browser storage or changing devices.</p></div><CircleHelp size={17}/></div>
      </section> : <EventWorkspace event={selected} updateEvent={updateEvent} onBack={() => {setView('home');setSelectedId(null)}} onDelete={() => deleteEvent(selected)} toast={setToast} onEditMembers={() => setEditingMembers(true)}/>}
      <footer className="main-footer"><span>DasaraDesk <b>•</b> Made for organized activities</span><span><span className="status-dot"/> Private to this browser</span></footer>
    </main>
    {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={createEvent}/>}
    {editingMembers && selected && <MembersModal event={selected} onClose={() => setEditingMembers(false)} onSave={members => {updateEvent(selected.id, e => ({...e, members, attendance: Object.fromEntries(Object.entries(e.attendance || {}).map(([k,v]) => [k, Object.fromEntries(Object.entries(v).filter(([mid]) => members.some(m => m.id === mid)))]))}));setEditingMembers(false);setToast('Member list updated.')}}/>}
    {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>;
}

function Stat({icon,label,value,note,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function EventCard({event, progress, onOpen}) {
  const next = event.dates.find(d => d >= todayISO()) || event.dates[event.dates.length-1];
  return <button className="event-card" onClick={onOpen}><div className="event-card-top"><div className="event-card-icon"><CalendarDays size={21}/></div><span className="event-card-menu"><MoreHorizontal size={20}/></span></div><div className="event-card-title">{event.name}</div><div className="event-card-desc">{event.description || 'Activity attendance record'}</div><div className="event-meta"><span><Users size={14}/>{event.members.length} members</span><span><CalendarRange size={14}/>{event.dates.length} days</span></div><div className="progress-row"><span>Attendance marked</span><b>{progress.percent}%</b></div><div className="progress-track"><div style={{width:`${progress.percent}%`}}/></div><div className="event-card-bottom"><span><Clock3 size={14}/>{next ? dateLabel(next) : 'No dates'}</span><span className="open-event">Open event <ChevronRight size={15}/></span></div></button>;
}

function CreateModal({onClose,onCreate}) {
  const [name,setName]=useState('Dasara Activity'); const [description,setDescription]=useState(''); const [start,setStart]=useState(todayISO()); const [end,setEnd]=useState(todayISO());
  const [membersText,setMembersText]=useState(''); const [sessionCount,setSessionCount]=useState(2); const [sessions,setSessions]=useState([{id:uid(),name:'Morning Session',time:'09:00'},{id:uid(),name:'Afternoon Session',time:'14:00'}]);
  const [step,setStep]=useState(1);
  const changeCount = n => { const count = Math.max(1,Math.min(12,Number(n)||1)); setSessionCount(count); setSessions(prev => Array.from({length:count},(_,i)=>prev[i] || {id:uid(),name:`Session ${i+1}`,time: i===0?'09:00':'14:00'})); };
  const countMembers = [...new Set(membersText.split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean))].length;
  const datesCount = makeDates(start,end).length;
  const submit = e => {e.preventDefault();if(!name.trim())return;onCreate({name,description,membersText,start,end,sessions:sessions.map((s,i)=>({...s,name:s.name.trim()||`Session ${i+1}`}))});};
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal create-modal"><div className="modal-header"><div><div className="modal-kicker">NEW WORKSPACE</div><h2>Create attendance event</h2><p>Set up once. Reuse your member list for every session.</p></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div><div className="stepper"><div className={`step ${step>=1?'current':''}`}><span>1</span> Event details</div><div className="step-line"/><div className={`step ${step>=2?'current':''}`}><span>2</span> Members & sessions</div></div>
    <form onSubmit={submit}>
      {step===1 ? <div className="form-section"><label className="field-label">Event name <span>*</span><input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Dasara Activity Attendance"/></label><label className="field-label">Short description <small>OPTIONAL</small><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="A short note about this activity"/></label><div className="field-two"><label className="field-label">Start date<input type="date" required value={start} onChange={e=>{setStart(e.target.value);if(end<e.target.value)setEnd(e.target.value)}}/></label><label className="field-label">Last date<input type="date" required min={start} value={end} onChange={e=>setEnd(e.target.value)}/></label></div><div className="date-preview"><CalendarDays size={18}/><div><b>{datesCount} {datesCount===1?'day':'days'} planned</b><small>{start && end ? `${dateLabel(start)} – ${dateLabel(end)}` : 'Choose your event dates'}</small></div><span className="preview-check"><Check size={15}/></span></div><div className="modal-actions"><button type="button" className="outline-btn" onClick={onClose}>Cancel</button><button type="button" className="primary-btn" onClick={()=>setStep(2)}>Continue <ChevronRight size={17}/></button></div></div>
      : <div className="form-section"><label className="field-label">Member names <span>*</span><small>ONE NAME PER LINE (COMMAS ALSO WORK)</small><textarea required value={membersText} onChange={e=>setMembersText(e.target.value)} placeholder={'Ananya Sharma\nRahul Kumar\nPriya Hegde\n...'} rows={6}/></label><div className="members-counter"><Users size={16}/><b>{countMembers}</b> unique members <span>•</span> Add 200, 300 or more names</div><div className="session-config-head"><div><h3>Daily sessions</h3><p>Every planned day will get these sessions.</p></div><label className="count-picker">Sessions <select value={sessionCount} onChange={e=>changeCount(e.target.value)}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label></div><div className="session-list">{sessions.map((s,i)=><div className="session-config" key={s.id}><div className="session-number">{String(i+1).padStart(2,'0')}</div><label className="session-name-label"><span>Session name</span><input value={s.name} onChange={e=>setSessions(old=>old.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder={`Session ${i+1}`}/></label><label className="session-time-label"><span>Start time</span><input type="time" value={s.time} onChange={e=>setSessions(old=>old.map((x,j)=>j===i?{...x,time:e.target.value}:x))}/></label></div>)}</div><div className="setup-summary"><Sparkles size={17}/><span>Your event will contain <b>{datesCount} days</b>, <b>{sessionCount} sessions/day</b>, and <b>{datesCount*sessionCount} attendance sheets</b>.</span></div><div className="modal-actions"><button type="button" className="outline-btn" onClick={()=>setStep(1)}><ArrowLeft size={16}/> Back</button><button type="submit" className="primary-btn" disabled={!countMembers}><Plus size={17}/> Create event</button></div></div>}
    </form></div></div>;
}

function EventWorkspace({event,updateEvent,onBack,onDelete,toast,onEditMembers}) {
  const [activeDate,setActiveDate]=useState(event.dates.includes(todayISO())?todayISO():event.dates[0]);
  const [activeSession,setActiveSession]=useState(event.sessions[0]?.id);
  const [memberSearch,setMemberSearch]=useState('');
  const [filter,setFilter]=useState('all');
  const [reportOpen,setReportOpen]=useState(false);
  useEffect(()=>{if(!event.dates.includes(activeDate))setActiveDate(event.dates[0]);},[event.id,event.dates]);
  const session = event.sessions.find(s=>s.id===activeSession) || event.sessions[0];
  const key = `${activeDate}::${session?.id}`;
  const records = event.attendance?.[key] || {};
  const filteredMembers = event.members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()) && (filter==='all'||(records[m.id]||'unmarked')===filter));
  const markedCount = event.members.filter(m=>records[m.id]).length;
  const presentCount = event.members.filter(m=>records[m.id]==='present').length;
  const absentCount = event.members.filter(m=>records[m.id]==='absent').length;
  const lateCount = event.members.filter(m=>records[m.id]==='late').length;
  const excusedCount = event.members.filter(m=>records[m.id]==='excused').length;
  const setStatus = (memberId,status) => updateEvent(event.id,e=>({...e,attendance:{...e.attendance,[key]:{...(e.attendance?.[key]||{}),[memberId]:status}}}));
  const markAll = status => {
    if(!confirm(`Mark all ${event.members.length} members as ${status}? Existing statuses for this session will be replaced.`))return;
    const next={};event.members.forEach(m=>next[m.id]=status);
    updateEvent(event.id,e=>({...e,attendance:{...e.attendance,[key]:next}}));toast(`All members marked ${status}.`);
  };
  const changeDate = date => {setActiveDate(date);setMemberSearch('');setFilter('all')};
  const exportSession = () => {
    const rows=[['Event',event.name],['Date',activeDate],['Session',session.name],['Time',session.time],[],['S.No.','Member Name','Attendance']];
    event.members.forEach((m,i)=>rows.push([i+1,m.name,(records[m.id]||'Unmarked').toUpperCase()]));
    downloadBlob('\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),`${event.name.replace(/[^a-z0-9]+/gi,'-')}_${activeDate}_${session.name.replace(/[^a-z0-9]+/gi,'-')}.csv`);
    toast('Session CSV downloaded.');
  };
  const printSession = () => {
    const rows=event.members.map((m,i)=>`<tr><td>${i+1}</td><td>${esc(m.name)}</td><td>${esc((records[m.id]||'UNMARKED').toUpperCase())}</td><td></td></tr>`).join('');
    const w=window.open('','_blank','width=900,height=700');
    if(!w){toast('Allow pop-ups to print the report.');return;}
    w.document.write(`<!doctype html><html><head><title>Attendance Sheet</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:32px}h1{margin:0 0 8px;font-size:24px}p{color:#555;margin:4px 0}table{border-collapse:collapse;width:100%;margin-top:24px;font-size:12px}th,td{border:1px solid #cdd3df;padding:9px;text-align:left}th{background:#f0f3f8}td:first-child{width:48px}td:nth-child(3){width:120px}td:last-child{width:140px}.sign{margin-top:48px;display:flex;justify-content:space-between}.sign span{border-top:1px solid #555;padding-top:8px;width:190px;text-align:center}@media print{body{padding:0}}</style></head><body><h1>${esc(event.name)} — Attendance Sheet</h1><p><b>Date:</b> ${esc(fullDate(activeDate))}</p><p><b>Session:</b> ${esc(session.name)} &nbsp; <b>Time:</b> ${esc(session.time)}</p><p><b>Total members:</b> ${event.members.length} &nbsp; <b>Present:</b> ${presentCount} &nbsp; <b>Absent:</b> ${absentCount}</p><table><thead><tr><th>S.No.</th><th>Member name</th><th>Status</th><th>Signature / remarks</th></tr></thead><tbody>${rows}</tbody></table><div class="sign"><span>Attendance coordinator</span><span>Authorized signature</span></div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };
  const exportAll = () => {
    const rows=[['Event',event.name],['Description',event.description],[],['Date','Session','Time','S.No.','Member Name','Status']];
    event.dates.forEach(d=>event.sessions.forEach(s=>event.members.forEach((m,i)=>rows.push([d,s.name,s.time,i+1,m.name,(event.attendance?.[`${d}::${s.id}`]?.[m.id]||'Unmarked').toUpperCase()]))));
    downloadBlob('\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),`${event.name.replace(/[^a-z0-9]+/gi,'-')}_complete-attendance.csv`);
    toast('Complete event report downloaded.');
  };
  const completion = Math.round(markedCount / Math.max(1,event.members.length)*100);
  return <section className="page event-page">
    <button className="back-link" onClick={onBack}><ArrowLeft size={16}/> All attendance events</button>
    <div className="event-workspace-head"><div><div className="eyebrow"><span className="status-dot"/> ACTIVE EVENT WORKSPACE</div><h1>{event.name}</h1><p>{event.description || 'Manage your members and record attendance across every planned date and session.'}</p><div className="event-head-tags"><span><CalendarRange size={14}/>{event.dates.length} planned days</span><span><Users size={14}/>{event.members.length} members</span><span><ClipboardCheck size={14}/>{event.sessions.length} sessions per day</span></div></div><div className="head-buttons"><button className="outline-btn" onClick={exportAll}><Download size={16}/> Export all</button><button className="icon-btn danger-icon" title="Delete event" onClick={onDelete}><Trash2 size={17}/></button></div></div>
    <div className="event-tabs"><button className="tab active"><ClipboardCheck size={17}/> Take attendance</button><button className="tab" onClick={()=>setReportOpen(v=>!v)}><FileText size={17}/> Reports & history</button><button className="tab" onClick={onEditMembers}><Users size={17}/> Manage members</button></div>
    {reportOpen && <div className="report-panel"><div><div className="section-kicker">EVENT RECORDS</div><h3>Reports & history</h3><p>Download every planned date and session in one spreadsheet, or open an individual official attendance sheet.</p></div><button className="primary-btn" onClick={exportAll}><Download size={16}/> Download full CSV report</button><div className="history-list">{event.dates.map(d=><div className="history-day" key={d}><span className="history-date">{dateLabel(d)}</span><div>{event.sessions.map(s=><button key={s.id} className="history-session" onClick={()=>{changeDate(d);setActiveSession(s.id);setReportOpen(false)}}>{s.name}<ChevronRight size={13}/></button>)}</div></div>)}</div></div>}
    <div className="attendance-layout"><div className="attendance-main">
      <div className="panel date-panel"><div className="panel-heading"><div><div className="section-kicker">STEP 01</div><h2>Choose a day</h2><p>Select any planned day to record or review attendance.</p></div><div className="day-count"><b>{event.dates.indexOf(activeDate)+1}</b><span>of {event.dates.length}</span></div></div><div className="date-strip">{event.dates.map((d,i)=><button key={d} className={`date-chip ${d===activeDate?'selected':''} ${d===todayISO()?'is-today':''}`} onClick={()=>changeDate(d)}><span>{new Date(`${d}T12:00:00`).toLocaleDateString('en-IN',{weekday:'short'}).toUpperCase()}</span><b>{new Date(`${d}T12:00:00`).getDate()}</b><small>{new Date(`${d}T12:00:00`).toLocaleDateString('en-IN',{month:'short'})}</small>{event.sessions.some(s=>event.members.every(m=>event.attendance?.[`${d}::${s.id}`]?.[m.id]))&&<i/>}</button>)}</div><div className="active-date-line"><CalendarDays size={16}/><b>{fullDate(activeDate)}</b>{activeDate===todayISO()&&<span className="today-badge">TODAY</span>}</div></div>
      <div className="panel session-panel"><div className="panel-heading"><div><div className="section-kicker">STEP 02</div><h2>Choose a session</h2><p>Each session has a separate attendance sheet.</p></div><span className="session-total">{event.sessions.length} sessions</span></div><div className="session-cards">{event.sessions.map((s,i)=>{const rec=event.attendance?.[`${activeDate}::${s.id}`]||{};const count=event.members.filter(m=>rec[m.id]).length;return <button key={s.id} className={`session-card ${s.id===session?.id?'selected':''}`} onClick={()=>setActiveSession(s.id)}><span className="session-card-number">SESSION {String(i+1).padStart(2,'0')}</span><span className="session-card-icon"><Clock3 size={18}/></span><b>{s.name}</b><span className="session-time">{s.time || 'Time not set'}</span><div className="session-card-foot"><span>{count}/{event.members.length} marked</span><span className={`mini-progress ${count===event.members.length?'complete':''}`}>{count===event.members.length?<Check size={13}/>:`${Math.round(count/Math.max(1,event.members.length)*100)}%`}</span></div><div className="progress-track"><div style={{width:`${Math.round(count/Math.max(1,event.members.length)*100)}%`}}/></div></button>})}</div></div>
      <div className="panel roster-panel"><div className="roster-header"><div><div className="section-kicker">STEP 03</div><h2>Member attendance</h2><p>Tap a status for each member. Your changes save automatically.</p></div><button className="outline-btn manage-btn" onClick={onEditMembers}><Users size={16}/> Edit members</button></div>
        <div className="attendance-summary"><div className="summary-item"><span className="summary-dot present-dot"/><div><b>{presentCount}</b><small>Present</small></div></div><div className="summary-item"><span className="summary-dot absent-dot"/><div><b>{absentCount}</b><small>Absent</small></div></div><div className="summary-item"><span className="summary-dot late-dot"/><div><b>{lateCount}</b><small>Late</small></div></div><div className="summary-item"><span className="summary-dot excused-dot"/><div><b>{excusedCount}</b><small>Excused</small></div></div><div className="summary-completion"><b>{completion}%</b><small>marked</small></div></div>
        <div className="roster-tools"><div className="search-box roster-search"><Search size={16}/><input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="Find a member..."/></div><label className="filter-select"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All members</option><option value="unmarked">Not marked</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option></select><ChevronDown size={14}/></label><div className="bulk-actions"><button onClick={()=>markAll('present')} className="bulk-present"><Check size={14}/> All present</button><button onClick={()=>markAll('absent')} className="bulk-absent"><X size={14}/> All absent</button></div></div>
        <div className="member-table-wrap"><table className="member-table"><thead><tr><th className="number-col">#</th><th>MEMBER NAME</th><th>ATTENDANCE STATUS</th></tr></thead><tbody>{filteredMembers.map((m,i)=><tr key={m.id}><td className="number-col">{String(event.members.findIndex(x=>x.id===m.id)+1).padStart(2,'0')}</td><td><div className="member-name-cell"><span className="member-avatar">{m.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}</span><b>{m.name}</b></div></td><td><div className="status-buttons">{[['present','Present'],['absent','Absent'],['late','Late'],['excused','Excused']].map(([value,label])=><button key={value} title={label} className={`status-choice ${value} ${records[m.id]===value?'chosen':''}`} onClick={()=>setStatus(m.id,records[m.id]===value?null:value)}>{value==='present'?<Check size={13}/>:value==='absent'?<X size={13}/>:value==='late'?<Clock3 size={13}/>:<CircleHelp size={13}/>}<span>{label}</span></button>)}</div></td></tr>)}</tbody></table>{!filteredMembers.length&&<div className="no-members">{event.members.length?'No members match your filter.':'Add members to begin taking attendance.'}</div>}</div>
        <div className="roster-footer"><span>Showing <b>{filteredMembers.length}</b> of <b>{event.members.length}</b> members</span><span><span className="status-dot"/> Auto-saved to this device</span></div>
      </div>
    </div><aside className="attendance-side"><div className="panel side-current"><div className="side-card-top"><span className="side-icon"><ClipboardCheck size={20}/></span><span className="live-label"><span className="status-dot"/> LIVE RECORD</span></div><div className="section-kicker">CURRENT SESSION</div><h3>{session?.name}</h3><div className="side-date"><CalendarDays size={15}/>{dateLabel(activeDate,{day:'numeric',month:'long',year:'numeric'})}</div><div className="side-date"><Clock3 size={15}/>{session?.time || 'Time not set'}</div><div className="side-divider"/><div className="big-progress"><div className="progress-ring" style={{'--progress':`${completion*3.6}deg`}}><div><b>{completion}%</b><small>marked</small></div></div><div><b>{markedCount} of {event.members.length}</b><small>members recorded</small></div></div><div className="side-stat-list"><div><span><i className="stat-dot green-dot"/> Present</span><b>{presentCount}</b></div><div><span><i className="stat-dot red-dot"/> Absent</span><b>{absentCount}</b></div><div><span><i className="stat-dot orange-dot"/> Late / Excused</span><b>{lateCount+excusedCount}</b></div><div><span><i className="stat-dot gray-dot"/> Not marked</span><b>{event.members.length-markedCount}</b></div></div><button className="primary-btn full-btn" onClick={printSession}><FileText size={17}/> Print / Save as PDF</button><button className="outline-btn full-btn" onClick={exportSession}><Download size={17}/> Download session CSV</button><p className="pdf-hint">Tip: In the print window, choose <b>Save as PDF</b> to keep an official copy.</p></div>
      <div className="panel quick-help"><div className="help-icon"><CircleHelp size={18}/></div><div><b>Quick tip</b><p>Tap a status to mark a member. Tap the same status again to clear it. Each day and session keeps its own record.</p></div></div>
      <button className="delete-event-btn" onClick={onDelete}><Trash2 size={15}/> Delete this event</button>
    </aside></div>
    <div className="privacy-note"><div className="privacy-icon"><Save size={18}/></div><div><b>Autosave is on</b><p>Records stay in this browser's local storage. Export a backup before clearing site data or switching devices.</p></div><CheckCircle2 size={17}/></div>
  </section>;
}

function MembersModal({event,onClose,onSave}) {
  const [names,setNames]=useState(event.members.map(m=>m.name).join('\n'));
  const [query,setQuery]=useState('');
  const currentNames=names.split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean);
  const existingByName=new Map(event.members.map(m=>[m.name.toLowerCase(),m]));
  const filtered=currentNames.filter(n=>n.toLowerCase().includes(query.toLowerCase()));
  const save=()=>{const unique=[...new Set(currentNames)];const members=unique.map((name,i)=>({...existingByName.get(name.toLowerCase()),id:existingByName.get(name.toLowerCase())?.id||uid(),name,serial:i+1}));onSave(members);};
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal members-modal"><div className="modal-header"><div><div className="modal-kicker">EVENT SETTINGS</div><h2>Manage members</h2><p>Update the member list for all days and sessions.</p></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div><div className="member-modal-count"><Users size={17}/><b>{currentNames.length}</b> members in list <span>•</span> Existing attendance is preserved for members you keep.</div><label className="field-label">Member names<textarea rows={12} value={names} onChange={e=>setNames(e.target.value)} placeholder="One member per line"/></label><div className="modal-actions"><button className="outline-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={save}><Save size={16}/> Save member list</button></div></div></div>;
}

export default App;
