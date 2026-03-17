"use client";
import { useState, useEffect } from "react";

const SU = "https://assautgcinohojjgufjn.supabase.co";
const SK = "sb_publishable_zew7hL6PtkxDqrbN5ocUZg_cHBJ4fcw";

async function api(path, opt = {}) {
const r = await fetch(`${SU}/rest/v1/${path}`, {
headers: { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json", ...(opt.method === "POST" ? { Prefer: "return=representation" } : {}), ...opt.headers },
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
코끼리자전거: { bg: "#FFF9E6", c: "#B8860B" },
자동상하지자전거: { bg: "#FFF9E6", c: "#B8860B" },
"전기(FES)": { bg: "#FFE8E8", c: "#C0392B" },
"서기(Tilt)": { bg: "#E8F8FF", c: "#1A6B8A" },
"서기(ST)": { bg: "#E8F8FF", c: "#1A6B8A" },
"서기(큐보드)": { bg: "#E8F8FF", c: "#1A6B8A" },
트래드밀: { bg: "#F0FFE8", c: "#2E7D3A" },
스텝퍼: { bg: "#F0FFE8", c: "#2E7D3A" },
발자전거: { bg: "#F0FFE8", c: "#2E7D3A" },
계단: { bg: "#F0FFE8", c: "#2E7D3A" },
평행봉: { bg: "#F0FFE8", c: "#2E7D3A" },
기타: { bg: "#F5F5F5", c: "#555" },
};

const TREATMENT_TYPES = ["물리치료","작업치료","연하치료","인지치료","운동치료","코끼리자전거","자동상하지자전거","전기(FES)","서기(Tilt)","서기(ST)","서기(큐보드)","트래드밀","스텝퍼","발자전거","계단","평행봉","기타"];

const ts = (t) => TC[t] || { bg: "#eee", c: "#444" };
const inp = { width: "100%", padding: "11px 13px", borderRadius: 10, border: "1.5px solid #DDE6EE", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 };
const TIMES = ["08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];

function Login({ onLogin }) {
const [name, setName] = useState("");
const [pw, setPw] = useState("");
const [err, setErr] = useState("");
const [load, setLoad] = useState(false);
const go = async () => {
if (!name || !pw) { setErr("이름과 비밀번호를 입력해주세요."); return; }
setLoad(true); setErr("");
try {
const d = await api(`users?name=eq.${encodeURIComponent(name)}&password=eq.${encodeURIComponent(pw)}&select=*`);
if (!d || !d.length) { setErr("이름 또는 비밀번호가 올바르지 않습니다."); return; }
onLogin(d[0]);
} catch { setErr("오류가 발생했습니다."); }
finally { setLoad(false); }
};
return (
<div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#1A4A6B,#2E7D9F,#4CAF8A)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Apple SD Gothic Neo, sans-serif" }}>
<div style={{ marginBottom: 28, textAlign: "center" }}>
<div style={{ background: "#fff", borderRadius: 14, padding: "12px 22px", marginBottom: 12, display: "inline-block", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
<p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#2E7D9F" }}>🏥 양산제일병원</p>
<p style={{ margin: "2px 0 0", fontSize: 10, color: "#7A8FA0", letterSpacing: 1 }}>YANGSAN CHEIL HOSPITAL</p>
</div>
<h1 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0 }}>치료 시간표</h1>
</div>
<div style={{ background: "#fff", borderRadius: 18, padding: "24px 20px", width: "100%", maxWidth: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
<label style={{ fontSize: 12, fontWeight: 600, color: "#7A8FA0", display: "block", marginBottom: 5 }}>이름</label>
<input value={name} onChange={e => setName(e.target.value)} placeholder="이름" onKeyDown={e => e.key === "Enter" && go()} style={inp} />
<label style={{ fontSize: 12, fontWeight: 600, color: "#7A8FA0", display: "block", marginBottom: 5 }}>비밀번호 (병록번호)</label>
<input value={pw} onChange={e => setPw(e.target.value)} type="password" placeholder="병록번호" onKeyDown={e => e.key === "Enter" && go()} style={inp} />
{err && <p style={{ color: "#E05C5C", fontSize: 13, textAlign: "center", margin: "0 0 10px" }}>{err}</p>}
<button onClick={go} style={{ width: "100%", padding: 13, borderRadius: 11, border: "none", background: "linear-gradient(135deg,#2E7D9F,#1A5C7A)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{load ? "로그인 중..." : "로그인"}</button>
</div>
</div>
);
}

function Patient({ user, onLogout }) {
const [tab, setTab] = useState("weekday");
const [list, setList] = useState([]);
const [load, setLoad] = useState(true);
const [dateInfo, setDateInfo] = useState("");

useEffect(() => {
setLoad(true);
api(`schedules?patient_name=eq.${encodeURIComponent(user.name)}&day_type=eq.${tab}&order=start_time.asc`).then(d => {
setList(d || []);
if (d && d.length > 0 && d[0].schedule_date) setDateInfo(d[0].schedule_date);
else setDateInfo("");
setLoad(false);
});
}, [tab, user.name]);

const getScheduleForTime = (time) => list.find(s => s.start_time <= time && s.end_time > time);

return (
<div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: "Apple SD Gothic Neo, sans-serif", maxWidth: 480, margin: "0 auto" }}>
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
<button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: 9, borderRadius: 9, border: "none", background: tab === k ? "#fff" : "rgba(255,255,255,0.15)", color: tab === k ? "#2E7D9F" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{l}</button>
))}
</div>
</div>
<div style={{ padding: 14 }}>
{dateInfo && (
<div style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
<span style={{ fontSize: 16 }}>📅</span>
<span style={{ fontSize: 14, fontWeight: 700, color: "#1A2B3C" }}>{dateInfo}</span>
</div>
)}
{load ? <p style={{ textAlign: "center", color: "#7A8FA0", padding: 30 }}>불러오는 중...</p> : (
<div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
<table style={{ width: "100%", borderCollapse: "collapse" }}>
<thead>
<tr style={{ background: "#2E7D9F", color: "#fff" }}>
<th style={{ padding: "10px 6px", fontSize: 11, fontWeight: 700, width: "22%", textAlign: "center" }}>시간</th>
<th style={{ padding: "10px 6px", fontSize: 11, fontWeight: 700, width: "35%", textAlign: "center" }}>치료 종류</th>
<th style={{ padding: "10px 6px", fontSize: 11, fontWeight: 700, width: "23%", textAlign: "center" }}>치료사</th>
<th style={{ padding: "10px 6px", fontSize: 11, fontWeight: 700, width: "20%", textAlign: "center" }}>테이블</th>
</tr>
</thead>
<tbody>
{TIMES.map((time, i) => {
const s = getScheduleForTime(time);
const st = s ? ts(s.type) : null;
return (
<tr key={time} style={{ borderBottom: "1px solid #F0F4F8", background: s ? st.bg : i % 2 === 0 ? "#fff" : "#FAFBFC" }}>
<td style={{ padding: "9px 6px", fontSize: 11, color: "#7A8FA0", fontWeight: 600, textAlign: "center" }}>{time}</td>
<td style={{ padding: "9px 6px", fontSize: 11, fontWeight: 700, color: s ? st.c : "#ccc", textAlign: "center" }}>{s ? s.type : "-"}</td>
<td style={{ padding: "9px 6px", fontSize: 11, color: s ? "#1A2B3C" : "#ccc", textAlign: "center" }}>{s ? s.therapist : "-"}</td>
<td style={{ padding: "9px 6px", fontSize: 11, color: s ? "#1A2B3C" : "#ccc", textAlign: "center" }}>{s && s.room ? s.room : "-"}</td>
</tr>
);
})}
</tbody>
</table>
{list.length === 0 && <p style={{ textAlign: "center", color: "#7A8FA0", padding: 30 }}>등록된 시간표가 없습니다</p>}
</div>
)}
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
const [dateEdit, setDateEdit] = useState("");
const [dateVal, setDateVal] = useState("");

const loadP = async () => { const d = await api("users?role=eq.patient&order=name.asc"); setPatients(d || []); if (!sel && d && d.length) setSel(d[0].name); };
const loadA = async () => { const d = await api("users?role=eq.admin&order=name.asc"); setAdmins(d || []); };
const loadS = async (p, dy) => {
if (!p) return; setLoad(true);
const d = await api(`schedules?patient_name=eq.${encodeURIComponent(p)}&day_type=eq.${dy}&order=start_time.asc`);
setSchedules(d || []);
if (d && d.length > 0 && d[0].schedule_date) setDateVal(d[0].schedule_date);
else setDateVal(
