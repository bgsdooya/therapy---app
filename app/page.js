/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  }
}
module.exports = nextConfig

2026.03.16 16:10 정용진
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
