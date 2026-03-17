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

const TC = { 물리치료: { bg:"#E8F4F8", c:"#2E7D9F" }, 작업치료: { bg:"#EAF6EE", c:"#2E7D52" }, 연하치료: { bg:"#FFF3E0", c:"#E07A00" }, 인지치료: { bg:"#F3E8FF", c:"#7B2EAF" }, 운동치료: { bg:"#E0F7FA", c:"#00838F" }, 기타: { bg:"#F5F5F5", c:"#555" } };
const ts = (t) => TC[t] || { bg:"#eee", c:"#444" };
const inp = { width:"100%", padding:"11px 13px", borderRadius:10, border:"1.5px solid #DDE6EE", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
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
<div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#1A4A6B,#2E7D9F,#4CAF8A)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"Apple SD Gothic Neo, sans-serif" }}>
<div style={{ marginBottom:28, textAlign:"center" }}>
<div style={{ background:"#fff", borderRadius:14, padding:"12px 22px", marginBottom:12, display:"inline-block", boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>
<p style={{ margin:0, fontSize:17, fontWeight:900, color:"#2E7D9F" }}>🏥 양산제일병원</p>
<p style={{ margin:"2px 0 0", fontSize:10, color:"#7A8FA0", letterSpacing:1 }}>YANGSAN CHEIL HOSPITAL</p>
</div>
<h1 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:0 }}>치료 시간표</h1>
</div>
<div style={{ background:"#fff", borderRadius:18, padding:"24px 20px", width:"100%", maxWidth:340, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
<label style={{ fontSize:12, fontWeight:600, color:"#7A8FA0", display:"block", marginBottom:5 }}>이름</label>
<input value={name} onChange={e=>setName(e.target.value)} placeholder="이름" onKeyDown={e=>e.key==="Enter"&&go()} style={inp} />
<label style={{ fontSize:12, fontWeight:600, color:"#7A8FA0", display:"block", marginBottom:5 }}>비밀번호 (병록번호)</label>
<input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="병록번호" onKeyDown={e=>e.key==="Enter"&&go()} style={inp} />
{err && <p style={{ color:"#E05C5C", fontSize:13, textAlign:"center", margin:"0 0 10px" }}>{err}</p>}
<button onClick={go} style={{ width:"100%", padding:13, borderRadius:11, border:"none", background:"linear-gradient(135deg,#2E7D9F,#1A5C7A)", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>{load?"로그인 중...":"로그인"}</button>
</div>
</div>
);
}
