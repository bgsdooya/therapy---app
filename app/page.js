/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  }
}

"use client";
import { useState, useEffect } from "react";

const URL = "https://assautgcinohojjgufjn.supabase.co";
const KEY = "sb_publishable_zew7hL6PtkxDqrbN5ocUZg_cHBJ4fcw";

async function api(path, opt = {}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(opt.method === "POST" ? { Prefer: "return=representation" } : {}),
      ...opt.headers,
    },
    ...opt,
  });
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
const TC = {
  물리치료: { bg: "#E8F4F8", c: "#2E7D9F" },
  작업치료: { bg: "#EAF6EE", c: "#2E7D52" },
  연하치료: { bg: "#FFF3E0", c: "#E07A00" },
  인지치료: { bg: "#F3E8FF", c: "#7B2EAF" },
  운동치료: { bg: "#E0F7FA", c: "#00838F" },
  기타: { bg: "#F5F5F5", c: "#555" },
};
function Patient({ user, onLogout }) {
const [tab, setTab] = useState("weekday");
const [list, setList] = useState([]);
const [load, setLoad] = useState(true);

useEffect(() => {
setLoad(true);
api(`schedules?patient_name=eq.${encodeURIComponent(user.name)}&day_type=eq.${tab}&order=start_time.asc`)
.then(d => { setList(d || []); setLoad(false); });
}, [tab, user.name]);

return (
<div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: F, maxWidth: 480, margin: "0 auto" }}>
<div style={{ background: "linear-gradient(135deg,#1A4A6B,#2E7D9F)", padding: "48px 20px 20px", color: "#fff" }}>
<div style={{ display: "flex", justifyContent: "space-between" }}>
<div>
<p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>안녕하세요 👋</p>
<h2 style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 800 }}>{user.name}님의 시간표</h2>
</div>
<button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, color: "#fff", padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>로그아웃</button>
</div>
<div style={{ display: "flex", gap: 8, marginTop: 16 }}>
{[["weekday", "📅 평일"], ["weekend", "🌅 주말"]].map(([k, l]) => (
<button key={k} onClick={() => setTab(k)}
style={{ flex: 1, padding: 9, borderRadius: 9, border: "none", background: tab === k ? "#fff" : "rgba(255,255,255,0.15)", color: tab === k ? "#2E7D9F" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
{l}
</button>
))}
</div>
</div>
<div style={{ padding: 14 }}>
{load
? <p style={{ textAlign: "center", color: "#7A8FA0", padding: 30 }}>불러오는 중...</p>
: list.length === 0
? <p style={{ textAlign: "center", color: "#7A8FA0", padding: 30 }}>등록된 시간표가 없습니다</p>
: list.map(s => {
const st = ts(s.type);
return (
<div key={s.id} style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `4px solid ${st.c}` }}>
<span style={{ background: st.bg, color: st.c, fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20 }}>{s.type}</span>
<p style={{ margin: "7px 0 3px", fontSize: 15, fontWeight: 700, color: "#1A2B3C" }}>{s.start_time} ~ {s.end_time}</p>
<p style={{ margin: 0, fontSize: 12, color: "#7A8FA0" }}>🏠 {s.room} · 👩‍⚕️ {s.therapist}</p>
</div>
);
})}
</div>
</div>
);
}
function Admin({ user, onLogout }) {
const [tab, setTab] = useState("schedules");
const [patients, setPatients] = useState([]);
const [schedules, setSchedules] = useState([]);
const [admins, setAdmins] = useState([]);
const [sel, setSel] = useState("");
const [day, setDay] = useState("weekday");
const [load, setLoad] = useState(false);
const [modal, setModal] = useState(null);
const [form, setForm] = useState({});
const [msg, setMsg] = useState("");

const loadP = async () => {
const d = await api("users?role=eq.patient&order=name.asc");
setPatients(d || []);
if (!sel && d && d.length) setSel(d[0].name);
};
const loadA = async () => {
const d = await api("users?role=eq.admin&order=name.asc");
setAdmins(d || []);
};
const loadS = async (p, dy) => {
if (!p) return;
setLoad(true);
const d = await api(`schedules?patient_name=eq.${encodeURIComponent(p)}&day_type=eq.${dy}&order=start_time.asc`);
setSchedules(d || []);
setLoad(false);
};

useEffect(() => { loadP(); loadA(); }, []);
useEffect(() => { if (sel) loadS(sel, day); }, [sel, day]);

const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };
const closeM = () => { setModal(null); setForm({}); };

const savePatient = async () => {
if (!form.name || !form.password) return;
await api("users", { method: "POST", body: JSON.stringify({ name: form.name, password: form.password, role: "patient" }) });
showMsg("추가되었습니다."); closeM(); loadP();
};
const delPatient = async (id, name) => {
if (!confirm(`${name} 삭제?`)) return;
await api(`users?id=eq.${id}`, { method: "DELETE" });
await api(`schedules?patient_name=eq.${encodeURIComponent(name)}`, { method: "DELETE" });
showMsg("삭제되었습니다."); loadP();
};
const saveSchedule = async () => {
const { id, day_type, type, start_time, end_time, room, therapist } = form;
if (!type || !start_time || !end_time || !room || !therapist) { showMsg("모든 항목을 입력해주세요."); return; }
if (id) {
await api(`schedules?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ day_type, type, start_time, end_time, room, therapist }) });
} else {
await api("schedules", { method: "POST", body: JSON.stringify({ patient_name: form.patient_name || sel, day_type: day_type || day, type, start_time, end_time, room, therapist }) });
}
showMsg("저장되었습니다."); closeM(); loadS(sel, day);
};
const delSchedule = async (id) => {
if (!confirm("삭제?")) return;
await api(`schedules?id=eq.${id}`, { method: "DELETE" });
showMsg("삭제되었습니다."); loadS(sel, day);
};
const saveAdmin = async () => {
if (!form.name || !form.password) return;
await api("users", { method: "POST", body: JSON.stringify({ name: form.name, password: form.password, role: "admin" }) });
showMsg("추가되었습니다."); closeM(); loadA();
};
const bp = { background: "#2E7D9F", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const bd = { background: "#E05C5C", color: "#fff", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" };
const be = { background: "#E8F4F8", color: "#2E7D9F", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" };

return (
<div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: F, maxWidth: 480, margin: "0 auto" }}>
<div style={{ background: "linear-gradient(135deg,#1A3A2A,#2E6B4F)", padding: "48px 20px 18px", color: "#fff" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<div>
<p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>관리자 🛡️</p>
<h2 style={{ margin: "2px 0 0", fontSize: 19, fontWeight: 800 }}>{user.name}</h2>
</div>
<button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 7, color: "#fff", padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>로그아웃</button>
</div>
<div style={{ display: "flex", gap: 5, marginTop: 14 }}>
{[["schedules", "📅 시간표"], ["patients", "👥 환자"], ["admins", "🛡️ 관리자"]].map(([k, l]) => (
<button key={k} onClick={() => setTab(k)}
style={{ flex: 1, padding: "8px 3px", borderRadius: 8, border: "none", background: tab === k ? "#fff" : "rgba(255,255,255,0.15)", color: tab === k ? "#2E6B4F" : "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
{l}
</button>
))}
</div>
</div>

{msg && <div style={{ background: "#2E7D9F", color: "#fff", textAlign: "center", padding: 9, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

<div style={{ padding: 14 }}>
{tab === "schedules" && <>
<div style={{ background: "#fff", borderRadius: 11, padding: 12, marginBottom: 11 }}>
<select value={sel} onChange={e => setSel(e.target.value)} style={{ ...inp, marginBottom: 7 }}>
{patients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
</select>
<div style={{ display: "flex", gap: 5 }}>
{[["weekday", "평일"], ["weekend", "주말"]].map(([k, l]) => (
<button key={k} onClick={() => setDay(k)}
style={{ flex: 1, padding: 7, borderRadius: 7, border: `2px solid ${day === k ? "#2E7D9F" : "#DDE6EE"}`, background: day === k ? "#E8F4F8" : "#fff", color: day === k ? "#2E7D9F" : "#7A8FA0", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
{l}
</button>
))}
</div>
</div>
<button onClick={() => setModal("addSchedule")} style={{ ...bp, width: "100%", marginBottom: 11 }}>+ 시간표 추가</button>
{load
? <p style={{ textAlign: "center", color: "#7A8FA0" }}>불러오는 중...</p>
: schedules.length === 0
? <p style={{ textAlign: "center", color: "#7A8FA0" }}>등록된 시간표가 없습니다</p>
: schedules.map(s => {
const st = ts(s.type);
return (
<div key={s.id} style={{ background: "#fff", borderRadius: 11, padding: 12, marginBottom: 9, borderLeft: `4px solid ${st.c}` }}>
<div style={{ display: "flex", justifyContent: "space-between" }}>
<div>
<span style={{ background: st.bg, color: st.c, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 18 }}>{s.type}</span>
<p style={{ margin: "5px 0 2px", fontWeight: 700, color: "#1A2B3C" }}>{s.start_time} ~ {s.end_time}</p>
<p style={{ margin: 0, fontSize: 11, color: "#7A8FA0" }}>🏠 {s.room} · 👩‍⚕️ {s.therapist}</p>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
<button onClick={() => { setForm(s); setModal("editSchedule"); }} style={be}>수정</button>
<button onClick={() => delSchedule(s.id)} style={bd}>삭제</button>
</div>
</div>
</div>
);
})}
</>}
{tab === "patients" && <>
<button onClick={() => setModal("addPatient")} style={{ ...bp, width: "100%", marginBottom: 11 }}>+ 환자 추가</button>
{patients.map(p => (
<div key={p.id} style={{ background: "#fff", borderRadius: 11, padding: "12px 14px", marginBottom: 9, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<div>
<p style={{ margin: 0, fontWeight: 700, color: "#1A2B3C" }}>{p.name}</p>
<p style={{ margin: "1px 0 0", fontSize: 11, color: "#7A8FA0" }}>병록번호: {p.password}</p>
</div>
<button onClick={() => delPatient(p.id, p.name)} style={bd}>삭제</button>
</div>
))}
</>}

{tab === "admins" && <>
<button onClick={() => setModal("addAdmin")} style={{ ...bp, width: "100%", marginBottom: 11 }}>+ 관리자 추가</button>
{admins.map(a => (
<div key={a.id} style={{ background: "#fff", borderRadius: 11, padding: "12px 14px", marginBottom: 9 }}>
<p style={{ margin: 0, fontWeight: 700, color: "#1A2B3C" }}>🛡️ {a.name}</p>
</div>
))}
</>}
</div>

{modal && (
<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
<div style={{ background: "#fff", borderRadius: "18px 18px 0 0", padding: "22px 18px 36px", width: "100%", maxWidth: 480, margin: "0 auto" }}>
<h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: "#1A2B3C" }}>
{modal === "addPatient" ? "환자 추가" : modal === "addSchedule" ? "시간표 추가" : modal === "editSchedule" ? "시간표 수정" : "관리자 추가"}
</h3>
{modal === "addPatient" && <>
<input placeholder="환자 이름" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
<input placeholder="병록번호" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} style={inp} />
</>}
{modal === "addAdmin" && <>
<input placeholder="관리자 이름" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
<input placeholder="비밀번호" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} style={inp} />
</>}
{(modal === "addSchedule" || modal === "editSchedule") && <>
{modal === "addSchedule" && (
<select value={form.patient_name || sel} onChange={e => setForm({ ...form, patient_name: e.target.value })} style={inp}>
{patients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
</select>
)}
<select value={form.day_type || day} onChange={e => setForm({ ...form, day_type: e.target.value })} style={inp}>
<option value="weekday">평일</option>
<option value="weekend">주말</option>
</select>
<select value={form.type || ""} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
<option value="">치료 종류</option>
{["물리치료", "작업치료", "연하치료", "인지치료", "운동치료", "기타"].map(t => (
<option key={t} value={t}>{t}</option>
))}
</select>
<input placeholder="시작 시간 (예: 09:00)" value={form.start_time || ""} onChange={e => setForm({ ...form, start_time: e.target.value })} style={inp} />
<input placeholder="종료 시간 (예: 10:00)" value={form.end_time || ""} onChange={e => setForm({ ...form, end_time: e.target.value })} style={inp} />
<input placeholder="치료실 (예: 1치료실)" value={form.room || ""} onChange={e => setForm({ ...form, room: e.target.value })} style={inp} />
<input placeholder="치료사 이름" value={form.therapist || ""} onChange={e => setForm({ ...form, therapist: e.target.value })} style={inp} />
</>}
<div style={{ display: "flex", gap: 9 }}>
<button onClick={closeM} style={{ flex: 1, padding: 11, borderRadius: 9, border: "1.5px solid #DDE6EE", background: "#fff", color: "#7A8FA0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>취소</button>
<button onClick={modal === "addPatient" ? savePatient : modal === "addAdmin" ? saveAdmin : saveSchedule} style={{ flex: 2, ...bp }}>저장</button>
</div>
</div>
</div>
)}
</div>
);
}

export default function App() {
const [user, setUser] = useState(null);
if (!user) return <Login onLogin={setUser} />;
if (user.role === "admin") return <Admin user={user} onLogout={() => setUser(null)} />;
return <Patient user={user} onLogout={() => setUser(null)} />;
}
