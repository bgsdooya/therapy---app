"use client";
import { useState, useEffect } from "react";

const SU = "https://assautgcinohojjgufjn.supabase.co";
const SK = "sb_publishable_zew7hL6PtkxDqrbN5ocUZg_cHBJ4fcw";

async function api(path, opt = {}) {
  const headers = {
    apikey: SK,
    Authorization: `Bearer ${SK}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...opt.headers,
  };
  const r = await fetch(`${SU}/rest/v1/${path}`, { ...opt, headers });
  const text = await r.text();
  if (!text) return null;
  return JSON.parse(text);
}

const TC = {
  물리치료:  { bg: "#E8F4F8", c: "#2E7D9F" },
  작업치료:  { bg: "#EAF6EE", c: "#2E7D52" },
  연하치료:  { bg: "#FFF3E0", c: "#E07A00" },
  인지치료:  { bg: "#F3E8FF", c: "#7B2EAF" },
  운동치료:  { bg: "#E0F7FA", c: "#00838F" },
  기타:      { bg: "#F5F5F5", c: "#555555" },
};
const TYPES = ["물리치료", "작업치료", "연하치료", "연하전기(Stim plus)", "순차적연하전기(RS Stim)", "인지치료", "운동치료", "기타"];
const RFT_ITEMS = [
  "코끼리자전거", "자동상하지자전거", "전기(FES)", "서기(Tilt)",
  "서기(ST)", "서기(큐보드)", "트래드밀", "스텝퍼",
  "발자전거", "계단", "평행봉",
];
const RFT_STYLE = { bg: "#FFF0F5", c: "#C2185B" };
const WEEK_DAYS_OPTIONS = ["", "월수금", "화목"];
const WEEK_DAYS_LABEL = { "": "매일", "월수금": "월수금", "화목": "화목" };
const WEEK_DAYS_COLOR = { "": null, "월수금": "#1565C0", "화목": "#6A1B9A" };

// 치료명 약어 매핑
const TYPE_ALIASES = {
  "운동": "운동치료", "작업": "작업치료", "물리": "물리치료",
  "연하": "연하치료", "인지": "인지치료",
  "fes": "전기(FES)", "전기": "전기(FES)",
  "코끼리": "코끼리자전거", "자동상하지": "자동상하지자전거",
  "tilt": "서기(Tilt)", "서기tilt": "서기(Tilt)",
  "st": "서기(ST)", "서기st": "서기(ST)",
  "큐보드": "서기(큐보드)", "트래드밀": "트래드밀",
  "스텝퍼": "스텝퍼", "발자전거": "발자전거",
  "계단": "계단", "평행봉": "평행봉",
  "stim": "연하전기(Stim plus)", "stimplus": "연하전기(Stim plus)",
  "rs": "순차적연하전기(RS Stim)", "rsstim": "순차적연하전기(RS Stim)",
};

const NO_THERAPIST_TYPES = ["물리치료", "연하전기(Stim plus)", "순차적연하전기(RS Stim)"];
const NO_THERAPIST_NO_ROOM_TYPES = ["물리치료"];
const CUSTOM_DAYS = ["월", "화", "수", "목", "금", "토"];

function resolveType(raw) {
  const key = raw.trim().toLowerCase().replace(/\s/g, "");
  if (TYPE_ALIASES[key]) return TYPE_ALIASES[key];
  // 원본 그대로 있는지 확인
  const all = [...TYPES, ...RFT_ITEMS,
    "연하전기(Stim plus)", "순차적연하전기(RS Stim)"];
  const found = all.find(t => t.toLowerCase() === raw.trim().toLowerCase());
  return found || raw.trim();
}

function noTherapist(type) { return isRFT(type) || NO_THERAPIST_TYPES.includes(type); }
function noRoom(type) { return NO_THERAPIST_NO_ROOM_TYPES.includes(type); }

// 0900 → "09:00" 변환
function parseTime(raw) {
  const s = raw.replace(":", "").replace(/\s/g, "");
  if (s.length === 3) return "0" + s[0] + ":" + s.slice(1);
  if (s.length === 4) return s.slice(0,2) + ":" + s.slice(2);
  return null;
}

// 시간 +30분
function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return String(Math.floor(total/60)).padStart(2,"0") + ":" + String(total%60).padStart(2,"0");
}

function getStyle(type) {
  const TC_EXT = { ...TC,
    "연하전기(Stim plus)": { bg: "#FFF3E0", c: "#BF360C" },
    "순차적연하전기(RS Stim)": { bg: "#FFF3E0", c: "#E64A19" },
  };
  return RFT_ITEMS.includes(type) ? RFT_STYLE : (TC_EXT[type] || { bg: "#eee", c: "#444" });
}
function isRFT(type) { return RFT_ITEMS.includes(type); }

// 날짜 문자열 유틸
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate()+1);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function getWdColor(week_days) {
  if (!week_days) return null;
  if (week_days === "월수금") return "#1565C0";
  if (week_days === "화목") return "#6A1B9A";
  return "#E07A00";
}

// 오늘 요일이 해당 week_days에 포함되는지
function isActiveToday(week_days) {
  if (!week_days) return true;
  const day = new Date().getDay(); // 0=일,1=월,2=화,3=수,4=목,5=금,6=토
  if (week_days === "월수금") return [1, 3, 5].includes(day);
  if (week_days === "화목") return [2, 4].includes(day);
  return true;
}

const TIMES = [
  "08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00",
  "13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00",
];
function nextTime(t) {
  const idx = TIMES.indexOf(t);
  return idx >= 0 && idx < TIMES.length - 1 ? TIMES[idx + 1] : t;
}

const baseInp = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #DDE6EE", fontSize: 13, outline: "none",
  boxSizing: "border-box", marginBottom: 8, fontFamily: "inherit",
};

// ─────────────────────────────────────
// 로그인
// ─────────────────────────────────────
function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [load, setLoad] = useState(false);

  const go = async () => {
    if (!name.trim() || !pw.trim()) { setErr("이름과 비밀번호를 입력해주세요."); return; }
    setLoad(true); setErr("");
    try {
      const d = await api(`users?name=eq.${encodeURIComponent(name.trim())}&password=eq.${encodeURIComponent(pw.trim())}&select=*`);
      if (!d || d.length === 0) { setErr("이름 또는 비밀번호가 올바르지 않습니다."); return; }
      onLogin(d[0]);
    } catch (e) {
      console.error(e);
      setErr("오류가 발생했습니다. 다시 시도해주세요.");
    } finally { setLoad(false); }
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
        <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" onKeyDown={e => e.key === "Enter" && go()} style={baseInp} />
        <label style={{ fontSize: 12, fontWeight: 600, color: "#7A8FA0", display: "block", marginBottom: 5 }}>비밀번호 (병록번호)</label>
        <input value={pw} onChange={e => setPw(e.target.value)} type="password" placeholder="병록번호" onKeyDown={e => e.key === "Enter" && go()} style={baseInp} />
        {err && <p style={{ color: "#E05C5C", fontSize: 13, textAlign: "center", margin: "0 0 10px" }}>{err}</p>}
        <button onClick={go} disabled={load} style={{ width: "100%", padding: 13, borderRadius: 11, border: "none", background: "linear-gradient(135deg,#2E7D9F,#1A5C7A)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: load ? "not-allowed" : "pointer", opacity: load ? 0.7 : 1 }}>
          {load ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// 환자 화면
// ─────────────────────────────────────
// 치료실 연락처
const CONTACTS = [
  { name:"운동치료실", tel:"055.912.2160", color:"#C2185B", bg:"#FFF0F5", hours:[{ label:"월 ~ 금", time:"08:30 ~ 17:30", note:"점심시간 12:30 ~ 13:30" },{ label:"토", time:"08:30 ~ 12:30", note:"" }] },
  { name:"작업치료실", tel:"055.912.2164", color:"#2E7D52", bg:"#EAF6EE", hours:[{ label:"월 ~ 금", time:"08:30 ~ 17:30", note:"점심시간 12:30 ~ 13:30" },{ label:"토", time:"08:30 ~ 12:30", note:"" }] },
  { name:"물리치료실", tel:"055.912.2159", color:"#2E7D9F", bg:"#E8F4F8", hours:[{ label:"월 ~ 금", time:"08:30 ~ 17:30", note:"점심시간 당직 운영" },{ label:"토", time:"08:30 ~ 12:30", note:"" }] },
];
function ContactInfo() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ marginTop:24 }}>
      <div style={{ fontSize:14, fontWeight:700, color:"#7A8FA0", marginBottom:10 }}>📞 치료실 연락처</div>
      <div style={{ display:"flex", gap:8 }}>
        {CONTACTS.map(c => <button key={c.name} onClick={() => setOpen(open === c.name ? null : c.name)} style={{ flex:1, padding:"10px 6px", borderRadius:12, border:`2px solid ${open === c.name ? c.color : "#E8EEF4"}`, background: open === c.name ? c.bg : "#fff", color:c.color, fontWeight:800, fontSize:13, cursor:"pointer" }}>{c.name}</button>)}
      </div>
      {open && (() => { const c = CONTACTS.find(x => x.name === open); return (
        <div style={{ marginTop:10, background:c.bg, borderRadius:14, padding:"16px 18px", borderLeft:`4px solid ${c.color}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:16, fontWeight:800, color:c.color }}>{c.name}</div>
            <a href={`tel:${c.tel.replace(/\./g,"-")}`} style={{ display:"flex", alignItems:"center", gap:6, background:c.color, color:"#fff", borderRadius:10, padding:"8px 16px", fontSize:15, fontWeight:800, textDecoration:"none" }}>📞 {c.tel}</a>
          </div>
          <div style={{ borderTop:`1px solid ${c.color}22`, paddingTop:10 }}>
            {c.hours.map((h,i) => <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom: i < c.hours.length-1 ? 8 : 0 }}><span style={{ fontSize:14, fontWeight:700, color:c.color, minWidth:60 }}>{h.label}</span><div style={{ textAlign:"right" }}><div style={{ fontSize:15, fontWeight:800, color:"#1A2B3C" }}>{h.time}</div>{h.note && <div style={{ fontSize:12, color:"#7A8FA0" }}>{h.note}</div>}</div></div>)}
          </div>
        </div>
      ); })()}
    </div>
  );
}

function Patient({ user, onLogout }) {
  const [tab, setTab] = useState("weekday");
  const [list, setList] = useState([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    setLoad(true);
    api(`schedules?patient_name=eq.${encodeURIComponent(user.name)}&day_type=eq.${tab}&specific_date=is.null&order=start_time.asc`)
      .then(d => setList(d || [])).catch(() => setList([])).finally(() => setLoad(false));
  }, [tab, user.name]);

  const todayItems = list.filter(s => isActiveToday(s.week_days));
  const otherItems = list.filter(s => !isActiveToday(s.week_days));

  // 관리자 메시지
  const [adminMsg, setAdminMsg] = useState(null);
  useEffect(() => {
    const check = async () => {
      try {
        const msgs = await api(`messages?patient_name=eq.${encodeURIComponent(user.name)}&is_read=eq.false&order=created_at.asc&limit=1`);
        if (msgs?.length > 0) {
          setAdminMsg(msgs[0]);
          if ("Notification" in window && Notification.permission === "granted") {
            const n = new Notification("🏥 양산제일병원 재활치료팀", { body: msgs[0].content, icon:"/icon-192.png", requireInteraction:true });
            n.onclick = () => { window.focus(); n.close(); };
          }
        }
      } catch(e) {}
    };
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [user.name]);

  const dismissAdminMsg = async () => {
    if (!adminMsg) return;
    try { await api(`messages?id=eq.${adminMsg.id}`, { method:"PATCH", body: JSON.stringify({ is_read:true }) }); } catch(e) {}
    setAdminMsg(null);
  };

  // 휴무일
  const [holidayDates, setHolidayDates] = useState([]);
  useEffect(() => { api("holidays?select=holiday_date").then(d => setHolidayDates((d||[]).map(h => h.holiday_date))).catch(() => {}); }, []);
  const isHoliday = (d) => holidayDates.includes(d);

  // 알람
  const isOutpatient = (user.room || "").trim() === "외래";
  const [alarm, setAlarm] = useState(null);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (isOutpatient) {
      const t = setInterval(() => {
        const now = new Date();
        if (now.getHours() === 18 && now.getMinutes() === 0) {
          if (isHoliday(tomorrowStr())) return;
          const items = list.filter(s => !dismissed.includes("out_" + s.start_time + s.type));
          if (items.length > 0) {
            setAlarm({ kind:"outpatient", items });
            if ("Notification" in window && Notification.permission === "granted") {
              const eval_ = user.evaluation ? "\n📋 " + user.evaluation : "";
              new Notification("📋 내일 치료 일정", { body: items.map(s => s.start_time + " " + s.type).join("\n") + eval_, icon:"/icon-192.png", requireInteraction:true });
            }
          }
        }
      }, 30000);
      return () => clearInterval(t);
    }
    if (todayItems.length === 0) return;
    const t = setInterval(() => {
      if (isHoliday(todayStr())) return;
      const now = new Date();
      const plus15 = new Date(now.getTime() + 15*60000);
      const target = plus15.getHours().toString().padStart(2,"0") + ":" + plus15.getMinutes().toString().padStart(2,"0");
      const amItems = todayItems.filter(s => s.start_time < "12:00").sort((a,b) => a.start_time.localeCompare(b.start_time));
      const pmItems = todayItems.filter(s => s.start_time >= "12:00").sort((a,b) => a.start_time.localeCompare(b.start_time));
      const firstAm = amItems[0]; const firstPm = pmItems[0];
      if (firstAm && firstAm.start_time === target && !dismissed.includes("am_first")) {
        setAlarm({ kind:"inpatient", session:"am", items:amItems, item:firstAm });
        if ("Notification" in window && Notification.permission === "granted") {
          const ev = user.evaluation ? "\n📋 " + user.evaluation : "";
          new Notification("🌅 오전 치료 15분 전!", { body: amItems.map(s => s.start_time+" "+s.type).join("\n")+ev, icon:"/icon-192.png", requireInteraction:true });
        }
      } else if (firstPm && firstPm.start_time === target && !dismissed.includes("pm_first")) {
        setAlarm({ kind:"inpatient", session:"pm", items:pmItems, item:firstPm });
        if ("Notification" in window && Notification.permission === "granted") {
          const ev = user.evaluation ? "\n📋 " + user.evaluation : "";
          new Notification("🌇 오후 치료 15분 전!", { body: pmItems.map(s => s.start_time+" "+s.type).join("\n")+ev, icon:"/icon-192.png", requireInteraction:true });
        }
      }
    }, 30000);
    return () => clearInterval(t);
  }, [todayItems, dismissed, isOutpatient, list]);

  const dismissAlarm = () => {
    if (!alarm) return;
    if (alarm.kind === "inpatient") setDismissed(prev => [...prev, alarm.session === "am" ? "am_first" : "pm_first"]);
    else setDismissed(prev => [...prev, ...alarm.items.map(s => "out_"+s.start_time+s.type)]);
    setAlarm(null);
  };

  const renderCard = (s, i) => {
    const st = getStyle(s.type);
    const wdColor = getWdColor(s.week_days || "");
    if (s.is_cancelled) return (
      <div key={i} style={{ background:"#F5F5F5", borderRadius:16, marginBottom:12, overflow:"hidden", borderLeft:"5px solid #E05C5C", opacity:0.85 }}>
        <div style={{ padding:"16px 20px" }}>
          <div style={{ fontSize:28, fontWeight:900, color:"#bbb", marginBottom:8, textDecoration:"line-through" }}>{s.start_time} ~ {s.end_time}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:15, fontWeight:700, background:"#eee", color:"#aaa", borderRadius:8, padding:"4px 12px", textDecoration:"line-through" }}>{s.type}</span>
            <span style={{ fontSize:14, fontWeight:800, color:"#E05C5C", background:"#FFF0F0", borderRadius:8, padding:"4px 12px" }}>❌ 당일 치료 없음</span>
          </div>
        </div>
      </div>
    );
    return (
      <div key={i} style={{ background:"#fff", borderRadius:16, marginBottom:12, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.07)", borderLeft:`5px solid ${st.c}` }}>
        <div style={{ padding:"18px 20px" }}>
          <div style={{ fontSize:32, fontWeight:900, color:"#1A2B3C", marginBottom:10 }}>{s.start_time} ~ {s.end_time}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <span style={{ fontSize:17, fontWeight:700, background:st.bg, color:st.c, borderRadius:8, padding:"5px 14px" }}>
              {isRFT(s.type) && <span style={{ fontSize:13, background:"#C2185B", color:"#fff", borderRadius:4, padding:"2px 6px", marginRight:6 }}>RFT</span>}
              {s.type}
            </span>
            {s.week_days && <span style={{ fontSize:15, background:wdColor, color:"#fff", borderRadius:6, padding:"4px 12px", fontWeight:700 }}>{s.week_days}</span>}
          </div>
          <div style={{ fontSize:18, color:"#5A7A8A", display:"flex", gap:12, flexWrap:"wrap" }}>
            {!noRoom(s.type) && <span>🏠 {isRFT(s.type) ? "운동치료실" : (s.room || "-")}</span>}
            {isRFT(s.type) && <span>🏠 운동치료실</span>}
            {!noTherapist(s.type) && <span>👩‍⚕️ {s.therapist || "-"}</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8", fontFamily:"Apple SD Gothic Neo, sans-serif" }}>
      {/* 관리자 메시지 팝업 */}
      {adminMsg && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.55)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:"#fff", borderRadius:24, padding:"32px 28px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📢</div>
            <div style={{ fontSize:15, fontWeight:800, color:"#E07A00", background:"#FFF3E0", borderRadius:8, padding:"6px 0", marginBottom:16 }}>치료실 안내 메시지</div>
            <div style={{ fontSize:16, color:"#1A2B3C", lineHeight:1.6, marginBottom:24, textAlign:"left", background:"#F8FAFC", borderRadius:12, padding:"14px 16px" }}>{adminMsg.content}</div>
            <div style={{ fontSize:12, color:"#7A8FA0", marginBottom:16 }}>{new Date(adminMsg.created_at).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
            <button onClick={dismissAdminMsg} style={{ width:"100%", padding:"14px 0", borderRadius:14, border:"none", background:"linear-gradient(135deg,#E07A00,#B85C00)", color:"#fff", fontSize:18, fontWeight:800, cursor:"pointer" }}>확인</button>
          </div>
        </div>
      )}

      {/* 알람 팝업 */}
      {alarm && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          {alarm.kind === "inpatient" ? (
            <div style={{ background:"#fff", borderRadius:24, padding:"28px 24px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize:48, marginBottom:8 }}>⏰</div>
              <div style={{ fontSize:15, fontWeight:800, color: alarm.session==="am" ? "#E07A00" : "#1565C0", background: alarm.session==="am" ? "#FFF3E0" : "#E3F2FD", borderRadius:8, padding:"5px 0", marginBottom:12 }}>
                {alarm.session==="am" ? "🌅 오전 치료 15분 전!" : "🌇 오후 치료 15분 전!"}
              </div>
              <div style={{ textAlign:"left", marginBottom:16 }}>
                {alarm.items.map((s,i) => (
                  <div key={i} style={{ background: i===0 ? "#F0F8FF" : "#F8FAFC", borderRadius:10, padding:"12px 14px", marginBottom:8, borderLeft:`4px solid ${getStyle(s.type).c}` }}>
                    <div style={{ fontSize:18, fontWeight:900, color:"#1A2B3C", marginBottom:4 }}>{s.start_time} ~ {s.end_time}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:getStyle(s.type).c }}>{s.type}</div>
                    {!noTherapist(s.type) && s.therapist && <div style={{ fontSize:13, color:"#7A8FA0" }}>👩‍⚕️ {s.therapist}</div>}
                  </div>
                ))}
              </div>
              {user.evaluation && <div style={{ background:"#F3E8FF", borderRadius:12, padding:"12px 14px", marginBottom:16, textAlign:"left", borderLeft:"4px solid #7B2EAF" }}><div style={{ fontSize:13, fontWeight:800, color:"#7B2EAF", marginBottom:6 }}>📋 오늘 평가가 있어요!</div>{user.evaluation.split(",").map((e,i) => <div key={i} style={{ fontSize:14, color:"#5A3A7A", fontWeight:600 }}>· {e.trim()}</div>)}</div>}
              <button onClick={dismissAlarm} style={{ width:"100%", padding:"14px 0", borderRadius:14, border:"none", background:"linear-gradient(135deg,#2E7D9F,#1A5C7A)", color:"#fff", fontSize:18, fontWeight:800, cursor:"pointer" }}>확인</button>
            </div>
          ) : (
            <div style={{ background:"#fff", borderRadius:24, padding:"32px 28px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize:56, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:16, color:"#E07A00", marginBottom:6, fontWeight:700, background:"#FFF3E0", borderRadius:8, padding:"6px 0" }}>내일 치료 일정 안내</div>
              <div style={{ textAlign:"left", marginBottom:16 }}>
                {alarm.items.map((s,i) => <div key={i} style={{ background:"#F8FAFC", borderRadius:10, padding:"12px 14px", marginBottom:8, borderLeft:`4px solid ${getStyle(s.type).c}` }}><div style={{ fontSize:18, fontWeight:900, color:"#1A2B3C" }}>{s.start_time} ~ {s.end_time}</div><div style={{ fontSize:15, fontWeight:700, color:getStyle(s.type).c }}>{s.type}</div></div>)}
              </div>
              {user.evaluation && <div style={{ background:"#F3E8FF", borderRadius:12, padding:"12px 14px", marginBottom:16, textAlign:"left", borderLeft:"4px solid #7B2EAF" }}><div style={{ fontSize:13, fontWeight:800, color:"#7B2EAF", marginBottom:6 }}>📋 내일 평가가 있어요!</div>{user.evaluation.split(",").map((e,i) => <div key={i} style={{ fontSize:14, color:"#5A3A7A", fontWeight:600 }}>· {e.trim()}</div>)}</div>}
              <button onClick={dismissAlarm} style={{ width:"100%", padding:"14px 0", borderRadius:14, border:"none", background:"linear-gradient(135deg,#E07A00,#B85C00)", color:"#fff", fontSize:18, fontWeight:800, cursor:"pointer" }}>확인</button>
            </div>
          )}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background:"linear-gradient(135deg,#1A4A6B,#2E7D9F)", padding:"48px 20px 24px", color:"#fff" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", maxWidth:600, margin:"0 auto" }}>
          <div><p style={{ margin:0, fontSize:15, opacity:0.8 }}>안녕하세요 👋</p><h2 style={{ margin:"4px 0 0", fontSize:26, fontWeight:800 }}>{user.name}님의 시간표</h2></div>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, color:"#fff", padding:"9px 16px", fontSize:14, cursor:"pointer" }}>로그아웃</button>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20, maxWidth:600, margin:"20px auto 0" }}>
          {[["weekday","📅 평일"],["saturday","🗓 토요일"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:12, borderRadius:12, border:"none", background: tab===k ? "#fff" : "rgba(255,255,255,0.15)", color: tab===k ? "#2E7D9F" : "#fff", fontWeight:800, fontSize:16, cursor:"pointer" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* 카드 목록 */}
      <div style={{ padding:"16px 16px 40px", maxWidth:600, margin:"0 auto" }}>
        {load ? <p style={{ textAlign:"center", color:"#7A8FA0", padding:40, fontSize:18 }}>불러오는 중...</p>
        : list.length === 0 ? <p style={{ textAlign:"center", color:"#7A8FA0", padding:40, fontSize:18 }}>등록된 시간표가 없습니다</p>
        : (() => {
          const amItems = todayItems.filter(s => s.start_time < "12:00");
          const pmItems = todayItems.filter(s => s.start_time >= "12:00");
          return (
            <>
              {todayItems.length > 0 && (
                <>
                  {amItems.length > 0 && <><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, marginTop:4 }}><span style={{ fontSize:15, fontWeight:800, color:"#E07A00", background:"#FFF3E0", borderRadius:8, padding:"4px 14px" }}>🌅 오전</span><div style={{ flex:1, height:2, background:"#FFE0B2", borderRadius:2 }} /></div>{amItems.map(renderCard)}</>}
                  {pmItems.length > 0 && <><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, marginTop: amItems.length > 0 ? 8 : 4 }}><span style={{ fontSize:15, fontWeight:800, color:"#1565C0", background:"#E3F2FD", borderRadius:8, padding:"4px 14px" }}>🌇 오후</span><div style={{ flex:1, height:2, background:"#BBDEFB", borderRadius:2 }} /></div>{pmItems.map(renderCard)}</>}
                </>
              )}
              {otherItems.length > 0 && (
                <>
                  <div style={{ fontSize:14, fontWeight:700, color:"#aaa", marginBottom:10, marginTop:16 }}>다른 요일 치료</div>
                  {otherItems.map((s,i) => {
                    const st = getStyle(s.type); const wdColor = getWdColor(s.week_days||"");
                    return <div key={i} style={{ background:"#fff", borderRadius:16, marginBottom:10, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", borderLeft:"5px solid #ddd", opacity:0.45 }}><div style={{ padding:"16px 20px" }}><div style={{ fontSize:26, fontWeight:800, color:"#888", marginBottom:8 }}>{s.start_time} ~ {s.end_time}</div><div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}><span style={{ fontSize:15, fontWeight:700, background:st.bg, color:st.c, borderRadius:8, padding:"4px 12px" }}>{s.type}</span>{s.week_days && <span style={{ fontSize:13, background:wdColor, color:"#fff", borderRadius:6, padding:"3px 10px", fontWeight:700 }}>{s.week_days}</span>}</div><div style={{ fontSize:16, color:"#aaa" }}>{!noRoom(s.type) && <span>🏠 {s.room||"-"}</span>}{!noTherapist(s.type) && <span style={{ marginLeft:12 }}>👩‍⚕️ {s.therapist||"-"}</span>}</div></div></div>;
                  })}
                </>
              )}
              <ContactInfo />
            </>
          );
        })()}
      </div>
    </div>
  );
}
// ─────────────────────────────────────
// 치료실 선택 컴포넌트
// ─────────────────────────────────────
const ROOM_PRESETS = ["운동 BT-", "작업 BT-", "작업 치료테이블", "연하치료실", "인지치료실", "ADL실", "소아치료실", "직접입력"];

function RoomSelect({ value, onChange, cellInp }) {
  const isPreset = ROOM_PRESETS.slice(0, -1).some(p => value === p || (p.endsWith("-") && value.startsWith(p)));
  const isBT = value.startsWith("운동 BT-") || value.startsWith("작업 BT-");

  // 현재 선택된 프리셋 찾기
  const getSelected = () => {
    if (!value) return "";
    if (value === "작업 치료테이블") return "작업 치료테이블";
    if (value === "연하치료실") return "연하치료실";
    if (value === "인지치료실") return "인지치료실";
    if (value === "ADL실") return "ADL실";
    if (value.startsWith("운동 BT-")) return "운동 BT-";
    if (value.startsWith("작업 BT-")) return "작업 BT-";
    return "직접입력";
  };

  const getBTNum = () => {
    if (value.startsWith("운동 BT-")) return value.replace("운동 BT-", "");
    if (value.startsWith("작업 BT-")) return value.replace("작업 BT-", "");
    return "";
  };

  const selected = getSelected();

  const handleSelect = (val) => {
    if (val === "운동 BT-" || val === "작업 BT-") {
      onChange(val); // 일단 접두사만 저장, 숫자는 입력 대기
    } else if (val === "직접입력") {
      onChange("");
    } else {
      onChange(val);
    }
  };

  const handleNumInput = (num) => {
    if (value.startsWith("운동 BT-")) onChange("운동 BT-" + num);
    else if (value.startsWith("작업 BT-")) onChange("작업 BT-" + num);
  };

  return (
    <div style={{ marginBottom: 4 }}>
      <select
        value={selected}
        onChange={e => handleSelect(e.target.value)}
        style={{ ...cellInp, marginBottom: (value.startsWith("운동 BT-") || value.startsWith("작업 BT-")) ? 4 : 0 }}>
        <option value="">치료실 선택</option>
        {ROOM_PRESETS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      {(value.startsWith("운동 BT-") || value.startsWith("작업 BT-")) && (
        <input
          value={getBTNum()}
          onChange={e => handleNumInput(e.target.value)}
          placeholder="번호 입력 (예: 3)"
          style={{ ...cellInp, marginBottom: 0 }}
          autoFocus
        />
      )}
      {selected === "직접입력" && (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="치료실 직접 입력"
          style={{ ...cellInp, marginBottom: 0 }}
          autoFocus
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────
// 시간표 편집 셀
// ─────────────────────────────────────
function ScheduleCell({ time, schedules, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ type:"", therapist:"", room:"", end_time:nextTime(time), week_days:"", is_cancelled:false });
  const [showCustomDays, setShowCustomDays] = useState(false);

  const openNew = () => { setEditTarget(null); setForm({ type:"", therapist:"", room:"", end_time:nextTime(time), week_days:"", is_cancelled:false }); setShowCustomDays(false); setEditing(true); };
  const openEdit = (s) => {
    setEditTarget(s);
    setForm({ type:s.type, therapist:s.therapist||"", room:s.room||"", end_time:s.end_time, week_days:s.week_days||"", is_cancelled:s.is_cancelled||false });
    setShowCustomDays(s.week_days && !["","월수금","화목"].includes(s.week_days));
    setEditing(true);
  };

  const rft = isRFT(form.type);
  const noTherapistForm = noTherapist(form.type);
  const noRoomForm = noRoom(form.type);

  const handleTypeChange = (val) => setForm(prev => ({ ...prev, type:val, therapist: noTherapist(val) ? "" : prev.therapist, room: isRFT(val) ? "운동치료실" : prev.room }));

  const handleSave = async () => {
    if (!form.type) return;
    if (!noTherapist(form.type) && !form.therapist.trim()) return;
    await onSave(time, { ...form, therapist: noTherapist(form.type) ? "" : form.therapist, room: isRFT(form.type) ? "운동치료실" : form.room }, editTarget);
    setEditing(false);
  };
  const handleDelete = async () => { if (!editTarget) return; await onDelete(editTarget.id); setEditing(false); };
  const handleToggleCancel = async (s, e) => { e.stopPropagation(); await onSave(time, { ...s, is_cancelled:!s.is_cancelled }, s); };

  const cellInp = { width:"100%", padding:"5px 6px", borderRadius:6, border:"1.5px solid #DDE6EE", fontSize:12, marginBottom:4, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

  if (editing) return (
    <td style={{ padding:6, verticalAlign:"top", background:"#FFFDE7", borderBottom:"1px solid #F0F4F8" }}>
      <select value={form.type} onChange={e => handleTypeChange(e.target.value)} style={{ ...cellInp, marginBottom:4 }}>
        <option value="">치료 종류 선택</option>
        <optgroup label="── 일반 치료 ──">{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</optgroup>
        <optgroup label="── RFT (운동치료실) ──">{RFT_ITEMS.map(t => <option key={t} value={t}>{t}</option>)}</optgroup>
      </select>
      <div style={{ display:"flex", gap:4, marginBottom:4 }}>
        {WEEK_DAYS_OPTIONS.map(wd => (
          <button key={wd} onClick={() => { setForm(p => ({ ...p, week_days:wd })); setShowCustomDays(false); }}
            style={{ flex:1, padding:"4px 0", borderRadius:6, border:`1.5px solid ${!showCustomDays && form.week_days===wd ? (WEEK_DAYS_COLOR[wd]||"#2E7D9F") : "#DDE6EE"}`, background: !showCustomDays && form.week_days===wd ? (WEEK_DAYS_COLOR[wd]||"#2E7D9F") : "#fff", color: !showCustomDays && form.week_days===wd ? "#fff" : "#555", fontSize:11, fontWeight:600, cursor:"pointer" }}>
            {WEEK_DAYS_LABEL[wd]}
          </button>
        ))}
        <button onClick={() => { setShowCustomDays(p => !p); setForm(p => ({ ...p, week_days:"" })); }}
          style={{ flex:1, padding:"4px 0", borderRadius:6, border:`1.5px solid ${showCustomDays ? "#E07A00" : "#DDE6EE"}`, background: showCustomDays ? "#FFF3E0" : "#fff", color: showCustomDays ? "#E07A00" : "#555", fontSize:11, fontWeight:600, cursor:"pointer" }}>직접선택</button>
      </div>
      {showCustomDays && (
        <div style={{ display:"flex", gap:4, marginBottom:6, flexWrap:"wrap", background:"#FFF3E0", borderRadius:8, padding:"6px 8px", border:"1.5px solid #FFE0B2" }}>
          {CUSTOM_DAYS.map(day => {
            const sel = (form.week_days||"").includes(day);
            return <button key={day} onClick={() => { const curr = form.week_days||""; const days = CUSTOM_DAYS.filter(d => curr.includes(d)); const next = sel ? days.filter(d => d!==day) : [...days,day]; setForm(p => ({ ...p, week_days: CUSTOM_DAYS.filter(d => next.includes(d)).join("") })); }} style={{ padding:"3px 8px", borderRadius:6, border:`1.5px solid ${sel?"#E07A00":"#DDE6EE"}`, background:sel?"#E07A00":"#fff", color:sel?"#fff":"#555", fontSize:12, fontWeight:700, cursor:"pointer" }}>{day}</button>;
          })}
          {form.week_days && <span style={{ fontSize:10, color:"#E07A00", alignSelf:"center" }}>({form.week_days})</span>}
        </div>
      )}
      {rft ? <div style={{ padding:"4px 6px", marginBottom:4, fontSize:11, color:"#C2185B", background:"#FFF0F5", borderRadius:6, border:"1.5px solid #F8BBD0" }}>🏋️ 운동치료실 · 치료사 없음</div>
      : noRoomForm ? <div style={{ padding:"4px 6px", marginBottom:4, fontSize:11, color:"#2E7D9F", background:"#E8F4F8", borderRadius:6, border:"1.5px solid #B3D9EF" }}>🏥 치료사·치료실 없음</div>
      : <>{!noTherapistForm && <input value={form.therapist} onChange={e => setForm(p => ({ ...p, therapist:e.target.value }))} placeholder="치료사" style={cellInp} />}<RoomSelect value={form.room} onChange={v => setForm(p => ({ ...p, room:v }))} cellInp={cellInp} /></>}
      <select value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time:e.target.value }))} style={{ ...cellInp, marginBottom:6 }}>
        {TIMES.filter(t => t > time).map(t => <option key={t} value={t}>{t}까지</option>)}
      </select>
      <div style={{ display:"flex", gap:4 }}>
        <button onClick={handleSave} style={{ flex:1, padding:"5px 0", borderRadius:6, border:"none", background:"#2E7D9F", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>저장</button>
        {editTarget && <button onClick={handleDelete} style={{ padding:"5px 8px", borderRadius:6, border:"none", background:"#E05C5C", color:"#fff", fontSize:11, cursor:"pointer" }}>삭제</button>}
        <button onClick={() => setEditing(false)} style={{ padding:"5px 8px", borderRadius:6, border:"1px solid #DDE6EE", background:"#fff", fontSize:11, cursor:"pointer" }}>취소</button>
      </div>
    </td>
  );

  return (
    <td style={{ padding:"4px 6px", borderBottom:"1px solid #F0F4F8", verticalAlign:"middle" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        {schedules.map((s,i) => {
          const st = getStyle(s.type); const wdColor = getWdColor(s.week_days||"");
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 6px", borderRadius:6, background: s.is_cancelled ? "#F5F5F5" : st.bg, opacity: s.is_cancelled ? 0.7 : 1 }}>
              <div style={{ flex:1 }} onClick={() => openEdit(s)}>
                <div style={{ fontSize:11, fontWeight:700, color: s.is_cancelled ? "#aaa" : st.c, textDecoration: s.is_cancelled ? "line-through" : "none", cursor:"pointer" }}>
                  {isRFT(s.type) && <span style={{ fontSize:9, background:"#C2185B", color:"#fff", borderRadius:3, padding:"1px 3px", marginRight:3 }}>RFT</span>}
                  {s.type}
                  {s.week_days && <span style={{ marginLeft:4, fontSize:9, background:wdColor, color:"#fff", borderRadius:3, padding:"1px 4px" }}>{s.week_days}</span>}
                  {s.is_cancelled && <span style={{ marginLeft:4, fontSize:9, color:"#E05C5C" }}>취소</span>}
                </div>
                {!noTherapist(s.type) && s.therapist && <div style={{ fontSize:10, color: s.is_cancelled ? "#ccc" : "#666", textDecoration: s.is_cancelled ? "line-through" : "none" }}>{s.therapist}</div>}
                {isRFT(s.type) && <div style={{ fontSize:10, color:"#C2185B" }}>운동치료실</div>}
              </div>
              <button onClick={(e) => handleToggleCancel(s,e)} title={s.is_cancelled ? "취소 해제" : "당일 치료 없음"} style={{ background: s.is_cancelled ? "#E05C5C" : "#eee", border:"none", borderRadius:4, color: s.is_cancelled ? "#fff" : "#aaa", fontSize:10, padding:"2px 5px", cursor:"pointer", flexShrink:0 }}>
                {s.is_cancelled ? "✕해제" : "✕"}
              </button>
            </div>
          );
        })}
        <button onClick={openNew} style={{ padding:"3px 0", borderRadius:6, border:"1.5px dashed #DDE6EE", background:"transparent", color:"#BCC8D4", fontSize:16, cursor:"pointer", lineHeight:1 }}>+</button>
      </div>
    </td>
  );
}
// ─────────────────────────────────────
// 관리자 화면
// ─────────────────────────────────────
function Admin({ user, onLogout }) {
  const [tab, setTab] = useState("weekday");
  const [specificDate, setSpecificDate] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [load, setLoad] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", password: "", room: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingEval, setEditingEval] = useState(null);
  const [evalText, setEvalText] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgTarget, setMsgTarget] = useState(null);
  const [showHoliday, setShowHoliday] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", memo: "" });
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textInputMode, setTextInputMode] = useState("replace");
  const [showPatientList, setShowPatientList] = useState(true);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const loadPatients = async () => {
    const d = await api("users?order=name.asc");
    setPatients((d || []).filter(u => u.role === "patient"));
  };
  const loadHolidays = async () => { const d = await api("holidays?order=holiday_date.asc"); setHolidays(d || []); };

  useEffect(() => { loadPatients().catch(console.error); loadHolidays().catch(console.error); }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    if (tab === "specific" && !specificDate) return;
    setLoad(true);
    const q = tab === "specific"
      ? `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&specific_date=eq.${specificDate}&order=start_time.asc`
      : `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${tab}&specific_date=is.null&order=start_time.asc`;
    api(q).then(d => setSchedules(d || [])).catch(() => setSchedules([])).finally(() => setLoad(false));
  }, [selectedPatient, tab, specificDate]);

  const getSchedulesForTime = (time) => schedules.filter(s => s.start_time <= time && s.end_time > time);

  const reloadSchedules = async () => {
    if (!selectedPatient) return;
    const q = tab === "specific"
      ? `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&specific_date=eq.${specificDate}&order=start_time.asc`
      : `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${tab}&specific_date=is.null&order=start_time.asc`;
    setSchedules(await api(q) || []);
  };

  const handleClearTab = async () => {
    if (!selectedPatient) return;
    const label = tab === "weekday" ? "평일" : "토요일";
    if (!confirm(`${selectedPatient.name}님의 ${label} 시간표를 초기화할까요?`)) return;
    setSaving(true);
    try {
      await api(`schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${tab}&specific_date=is.null`, { method:"DELETE" });
      await reloadSchedules(); flash(`${label} 초기화 ✓`);
    } catch(e) { flash("실패"); } finally { setSaving(false); }
  };

  const handleCopyFrom = async (fromTab) => {
    if (!selectedPatient || !specificDate) return;
    if (!confirm(`${fromTab === "weekday" ? "평일" : "토요일"} 시간표를 ${specificDate}에 복사할까요?`)) return;
    setSaving(true);
    try {
      await api(`schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&specific_date=eq.${specificDate}`, { method:"DELETE" });
      const src = await api(`schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${fromTab}&specific_date=is.null&order=start_time.asc`);
      if (src) for (const s of src) {
        await api("schedules", { method:"POST", body: JSON.stringify({ patient_name: selectedPatient.name, day_type: fromTab, specific_date: specificDate, start_time: s.start_time, end_time: s.end_time, type: s.type, therapist: s.therapist, room: s.room, week_days: s.week_days }) });
      }
      await reloadSchedules(); flash("복사 완료 ✓");
    } catch(e) { flash("실패"); } finally { setSaving(false); }
  };

  const handleClearSpecific = async () => {
    if (!selectedPatient || !specificDate) return;
    if (!confirm(`${specificDate} 시간표를 초기화할까요?`)) return;
    setSaving(true);
    try {
      await api(`schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&specific_date=eq.${specificDate}`, { method:"DELETE" });
      await reloadSchedules(); flash("초기화 ✓");
    } catch(e) { flash("실패"); } finally { setSaving(false); }
  };

  const handleSave = async (time, form, existing) => {
    setSaving(true);
    try {
      if (existing) {
        await api(`schedules?id=eq.${existing.id}`, { method:"PATCH", body: JSON.stringify({ type: form.type, therapist: form.therapist, room: form.room, end_time: form.end_time, week_days: form.week_days, is_cancelled: form.is_cancelled || false }) });
      } else {
        await api("schedules", { method:"POST", body: JSON.stringify({ patient_name: selectedPatient.name, day_type: tab === "specific" ? "weekday" : tab, specific_date: tab === "specific" ? specificDate : null, start_time: time, end_time: form.end_time, type: form.type, therapist: form.therapist, room: form.room, week_days: form.week_days }) });
      }
      await reloadSchedules(); flash("저장 ✓");
    } catch(e) { flash("저장 실패"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try { await api(`schedules?id=eq.${id}`, { method:"DELETE" }); await reloadSchedules(); flash("삭제 ✓"); }
    catch(e) { flash("실패"); } finally { setSaving(false); }
  };

  const handleAddPatient = async () => {
    if (!newPatient.name.trim() || !newPatient.password.trim()) return;
    setSaving(true);
    try {
      const saved = await api("users", { method:"POST", body: JSON.stringify({ name: newPatient.name.trim(), password: newPatient.password.trim(), room: newPatient.room.trim(), role:"patient" }) });
      const added = Array.isArray(saved) ? saved[0] : saved;
      if (added?.id) { setPatients(prev => [...prev, added].sort((a,b) => (a.name||"").localeCompare(b.name||"","ko"))); }
      else { await loadPatients(); }
      setNewPatient({ name:"", password:"", room:"" }); setShowAddPatient(false); flash("추가 ✓");
    } catch(e) { flash("추가 실패"); } finally { setSaving(false); }
  };

  const handleSaveEval = async (p) => {
    setSaving(true);
    try {
      await api(`users?id=eq.${p.id}`, { method:"PATCH", body: JSON.stringify({ evaluation: evalText.trim() }) });
      setPatients(prev => prev.map(u => u.id === p.id ? { ...u, evaluation: evalText.trim() } : u));
      if (selectedPatient?.id === p.id) setSelectedPatient(prev => ({ ...prev, evaluation: evalText.trim() }));
      setEditingEval(null); flash("평가 저장 ✓");
    } catch(e) { flash("실패"); } finally { setSaving(false); }
  };

  const handleDeletePatient = async (p) => {
    if (!confirm(`${p.name} 환자를 삭제할까요?`)) return;
    setSaving(true);
    try {
      await api(`schedules?patient_name=eq.${encodeURIComponent(p.name)}`, { method:"DELETE" });
      await api(`users?id=eq.${p.id}`, { method:"DELETE" });
      await loadPatients();
      if (selectedPatient?.id === p.id) setSelectedPatient(null);
      flash("삭제 ✓");
    } catch(e) { flash("실패"); } finally { setSaving(false); }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date) return;
    setSaving(true);
    try {
      await api("holidays", { method:"POST", body: JSON.stringify({ holiday_date: newHoliday.date, memo: newHoliday.memo.trim() }) });
      setNewHoliday({ date:"", memo:"" }); await loadHolidays(); flash("휴무일 등록 ✓");
    } catch(e) { flash("실패"); } finally { setSaving(false); }
  };

  const handleDeleteHoliday = async (id) => {
    setSaving(true);
    try { await api(`holidays?id=eq.${id}`, { method:"DELETE" }); await loadHolidays(); flash("삭제 ✓"); }
    catch(e) { flash("실패"); } finally { setSaving(false); }
  };

  const handleSendMsg = async () => {
    if (!msgText.trim()) return;
    if (Array.isArray(msgTarget) && msgTarget.length === 0) return;
    setSaving(true);
    try {
      const targets = msgTarget === null ? patients : msgTarget;
      for (const p of targets) await api("messages", { method:"POST", body: JSON.stringify({ patient_name: p.name, content: msgText.trim() }) });
      setMsgText(""); setShowMsg(false);
      flash(msgTarget === null ? `전체 ${patients.length}명 전송 ✓` : `${Array.isArray(msgTarget) ? msgTarget.length : 1}명 전송 ✓`);
    } catch(e) { flash("실패"); } finally { setSaving(false); }
  };

  // 텍스트 시간표 파싱 - 간편 형식: "0900 운동치료"
  const handleTextImport = async () => {
    if (!textInput.trim() || !selectedPatient) return;
    const lines = textInput.trim().split("\n").filter(l => l.trim());
    const parsed = [];
    const DAY_PATTERNS = ["월수금","화목","월화수목금","월","화","수","목","금","토","일"];
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      // 시간 파싱
      const m = t.match(/^([0-9]{3,4}(?::[0-9]{2})?(?:~[0-9]{3,4}(?::[0-9]{2})?)?)\s+(.+)/);
      if (!m) continue;
      const timePart = m[1];
      let rest = m[2].trim();
      // 시작/종료
      let startStr, endStr;
      if (timePart.includes("~")) { [startStr, endStr] = timePart.split("~"); }
      else { startStr = timePart; endStr = null; }
      const start = parseTime(startStr);
      if (!start) continue;
      const end = endStr ? parseTime(endStr) : addMinutes(start, 30);

      // 치료사 파싱: "치료사 이름" 패턴
      let therapist = "";
      const therapistMatch = rest.match(/치료사\s+([^\s]+)/);
      if (therapistMatch) {
        therapist = therapistMatch[1];
        rest = rest.replace(therapistMatch[0], "").trim();
      }

      // 요일 파싱 (치료명 뒤에 오는 요일)
      let week_days = "";
      for (const dp of DAY_PATTERNS) {
        // 단어 경계로 요일 찾기
        const re = new RegExp("(?:^|\\s)" + dp + "(?:\\s|$)");
        if (re.test(rest)) {
          week_days = dp;
          rest = rest.replace(new RegExp("\\s*" + dp + "\\s*"), " ").trim();
          break;
        }
      }

      const type = resolveType(rest.trim());
      parsed.push({ start_time: start, end_time: end, type, week_days, therapist });
    }
    if (parsed.length === 0) { flash("파싱 실패 - 형식을 확인해주세요"); return; }
    setSaving(true);
    try {
      if (textInputMode === "replace") {
        const q = tab === "specific"
          ? `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&specific_date=eq.${specificDate}`
          : `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${tab}&specific_date=is.null`;
        await api(q, { method:"DELETE" });
      }
      for (const p of parsed) {
        await api("schedules", { method:"POST", body: JSON.stringify({
          patient_name: selectedPatient.name,
          day_type: tab === "specific" ? "weekday" : tab,
          specific_date: tab === "specific" ? specificDate : null,
          start_time: p.start_time, end_time: p.end_time,
          type: p.type,
          therapist: noTherapist(p.type) ? "" : p.therapist,
          room: isRFT(p.type) ? "운동치료실" : "",
          week_days: p.week_days,
        }) });
      }
      await reloadSchedules(); setTextInput(""); setShowTextInput(false);
      flash(`${parsed.length}개 등록 ✓ (치료실은 직접 입력해주세요)`);
    } catch(e) { flash("저장 실패"); } finally { setSaving(false); }
  };

  const smallInp = { width:"100%", padding:"6px 8px", borderRadius:6, border:"1.5px solid #DDE6EE", fontSize:12, marginBottom:5, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8", fontFamily:"Apple SD Gothic Neo, sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#1A3A5C,#2E7D9F)", padding:"48px 20px 20px", color:"#fff" }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ margin:0, fontSize:12, opacity:0.75 }}>🏥 양산제일병원 관리자</p>
            <h2 style={{ margin:"3px 0 0", fontSize:20, fontWeight:800 }}>{user.name}님</h2>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end" }}>
            {msg && <span style={{ background:"#4CAF8A", color:"#fff", padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:700 }}>{msg}</span>}
            {saving && <span style={{ color:"rgba(255,255,255,0.7)", fontSize:12 }}>처리 중...</span>}
            <button onClick={() => { setShowMsg(p => !p); setMsgTarget(null); setMsgText(""); }} style={{ background:"rgba(255,200,0,0.25)", border:"none", borderRadius:8, color:"#fff", padding:"7px 12px", fontSize:12, cursor:"pointer", fontWeight:700 }}>📢 메시지</button>
            <button onClick={() => setShowHoliday(p => !p)} style={{ background:"rgba(255,100,100,0.25)", border:"none", borderRadius:8, color:"#fff", padding:"7px 12px", fontSize:12, cursor:"pointer", fontWeight:700 }}>🗓 휴무일</button>
            <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, color:"#fff", padding:"7px 12px", fontSize:12, cursor:"pointer" }}>로그아웃</button>
          </div>
        </div>
      </div>

      {/* 메시지 패널 */}
      {showMsg && (
        <div style={{ maxWidth:900, margin:"0 auto", padding:"0 14px 12px" }}>
          <div style={{ background:"#FFFDE7", borderRadius:14, padding:"14px 16px", border:"1.5px solid #FFE082" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#E07A00", marginBottom:10 }}>📢 환자에게 메시지</div>
            <div style={{ display:"flex", gap:6, marginBottom:8 }}>
              <button onClick={() => setMsgTarget(null)} style={{ padding:"5px 14px", borderRadius:8, border:`1.5px solid ${msgTarget === null ? "#E07A00" : "#DDE6EE"}`, background:msgTarget === null ? "#E07A00" : "#fff", color:msgTarget === null ? "#fff" : "#555", fontSize:12, fontWeight:700, cursor:"pointer" }}>📢 전체</button>
              <button onClick={() => setMsgTarget([])} style={{ padding:"5px 14px", borderRadius:8, border:`1.5px solid ${Array.isArray(msgTarget) ? "#2E7D9F" : "#DDE6EE"}`, background:Array.isArray(msgTarget) ? "#E8F4F8" : "#fff", color:"#2E7D9F", fontSize:12, fontWeight:700, cursor:"pointer" }}>개별 선택</button>
            </div>
            {Array.isArray(msgTarget) && (
              <div style={{ marginBottom:8 }}>
                <select onChange={e => { const id = e.target.value; if (!id) return; const p = patients.find(p => p.id === id); if (p && !msgTarget.some(t => t.id === id)) setMsgTarget(prev => [...prev, p]); e.target.value = ""; }} style={{ width:"100%", padding:"6px 10px", borderRadius:8, border:"1.5px solid #DDE6EE", fontSize:13, marginBottom:6 }}>
                  <option value="">환자 선택 (가나다순)</option>
                  {[...patients].sort((a,b) => a.name.localeCompare(b.name,"ko")).map(p => <option key={p.id} value={p.id} disabled={msgTarget.some(t => t.id === p.id)}>{p.name} {p.room ? `(${p.room})` : ""}</option>)}
                </select>
                {msgTarget.length > 0 && <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{msgTarget.map(p => <span key={p.id} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:8, background:"#E07A00", color:"#fff", fontSize:12, fontWeight:700 }}>{p.name}<button onClick={() => setMsgTarget(prev => prev.filter(t => t.id !== p.id))} style={{ background:"none", border:"none", color:"#fff", fontSize:13, cursor:"pointer", padding:0 }}>✕</button></span>)}</div>}
              </div>
            )}
            <textarea value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="메시지를 적어주세요" style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #FFD54F", fontSize:13, resize:"vertical", minHeight:72, boxSizing:"border-box", fontFamily:"inherit", marginBottom:8, outline:"none" }} />
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => setShowMsg(false)} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #DDE6EE", background:"#fff", fontSize:12, cursor:"pointer" }}>취소</button>
              <button onClick={handleSendMsg} disabled={saving || !msgText.trim() || (Array.isArray(msgTarget) && msgTarget.length === 0)} style={{ padding:"8px 20px", borderRadius:8, border:"none", background:(saving || !msgText.trim() || (Array.isArray(msgTarget) && msgTarget.length === 0)) ? "#aaa" : "#E07A00", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                {msgTarget === null ? `📢 전체 ${patients.length}명 전송` : Array.isArray(msgTarget) && msgTarget.length === 0 ? "수신자 선택하세요" : `📢 ${msgTarget.length}명 전송`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 휴무일 패널 */}
      {showHoliday && (
        <div style={{ maxWidth:900, margin:"0 auto", padding:"0 14px 12px" }}>
          <div style={{ background:"#FFF0F0", borderRadius:14, padding:"14px 16px", border:"1.5px solid #FFCDD2" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#C62828", marginBottom:10 }}>🗓 휴무일 관리 (알람 차단)</div>
            <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
              <input type="date" value={newHoliday.date} onChange={e => setNewHoliday(p => ({ ...p, date: e.target.value }))} style={{ padding:"6px 10px", borderRadius:8, border:"1.5px solid #FFCDD2", fontSize:13, outline:"none" }} />
              <input value={newHoliday.memo} onChange={e => setNewHoliday(p => ({ ...p, memo: e.target.value }))} placeholder="메모 (예: 설날)" style={{ flex:1, minWidth:100, padding:"6px 10px", borderRadius:8, border:"1.5px solid #FFCDD2", fontSize:13, outline:"none" }} />
              <button onClick={handleAddHoliday} disabled={saving || !newHoliday.date} style={{ padding:"6px 16px", borderRadius:8, border:"none", background:"#C62828", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>등록</button>
            </div>
            {holidays.length === 0 ? <p style={{ fontSize:12, color:"#aaa", margin:0 }}>등록된 휴무일 없음</p> : (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {holidays.map(h => (
                  <div key={h.id} style={{ display:"flex", alignItems:"center", gap:6, background:"#fff", borderRadius:8, padding:"5px 10px", border:"1px solid #FFCDD2" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#C62828" }}>{h.holiday_date}</span>
                    {h.memo && <span style={{ fontSize:12, color:"#7A8FA0" }}>{h.memo}</span>}
                    <button onClick={() => handleDeleteHoliday(h.id)} style={{ background:"none", border:"none", color:"#ccc", fontSize:13, cursor:"pointer", padding:0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth:900, margin:"0 auto", padding:"16px 14px", display:"flex", gap:14, flexWrap:"wrap" }}>
        {/* 환자 목록 */}
        <div style={{ width: showPatientList ? 200 : 0, minWidth: showPatientList ? 180 : 0, flexShrink:0, overflow:"hidden", transition:"width 0.2s" }}>
          <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ background:"#2E7D9F", color:"#fff", padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:700 }}>환자 목록</span>
              <button onClick={() => setShowAddPatient(p => !p)} style={{ background:"rgba(255,255,255,0.25)", border:"none", borderRadius:6, color:"#fff", width:26, height:26, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
            </div>
            {showAddPatient && (
              <div style={{ padding:10, background:"#FFFDE7", borderBottom:"1px solid #F0F4F8" }}>
                <input value={newPatient.name} onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))} placeholder="이름 *" style={smallInp} />
                <input value={newPatient.password} onChange={e => setNewPatient(p => ({ ...p, password: e.target.value }))} placeholder="병록번호 *" style={smallInp} />
                <input value={newPatient.room} onChange={e => setNewPatient(p => ({ ...p, room: e.target.value }))} placeholder="병실 (선택)" style={smallInp} />
                <div style={{ display:"flex", gap:4 }}>
                  <button onClick={handleAddPatient} disabled={saving} style={{ flex:1, padding:"6px 0", borderRadius:6, border:"none", background:saving ? "#aaa" : "#2E7D9F", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>{saving ? "추가 중..." : "추가"}</button>
                  <button onClick={() => { setShowAddPatient(false); setNewPatient({ name:"", password:"", room:"" }); }} style={{ padding:"6px 8px", borderRadius:6, border:"1px solid #DDE6EE", background:"#fff", fontSize:11, cursor:"pointer" }}>취소</button>
                </div>
              </div>
            )}
            {patients.length === 0 && !showAddPatient && <p style={{ textAlign:"center", color:"#7A8FA0", padding:20, fontSize:12 }}>환자 없음</p>}
            {patients.map(p => (
              <div key={p.id} style={{ borderBottom:"1px solid #F0F4F8" }}>
                <div style={{ padding:"10px 14px", cursor:"pointer", background: selectedPatient?.id === p.id ? "#E8F4F8" : "#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                  onClick={() => { setSelectedPatient(p); setShowPatientList(false); }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight: selectedPatient?.id === p.id ? 700 : 500, color: selectedPatient?.id === p.id ? "#2E7D9F" : "#1A2B3C" }}>{p.name}</div>
                    {p.room && <div style={{ fontSize:10, color:"#7A8FA0" }}>{p.room}</div>}
                    {p.evaluation && <div style={{ fontSize:10, color:"#7B2EAF", marginTop:2 }}>📋 {p.evaluation}</div>}
                  </div>
                  <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                    <button onClick={e => { e.stopPropagation(); setEditingEval(p.id); setEvalText(p.evaluation || ""); }} style={{ background:"none", border:"none", color:"#7B2EAF", fontSize:13, cursor:"pointer", padding:"2px 4px" }} title="평가 안내">📋</button>
                    <button onClick={e => { e.stopPropagation(); handleDeletePatient(p); }} style={{ background:"none", border:"none", color:"#ccc", fontSize:14, cursor:"pointer", padding:"2px 4px" }}>✕</button>
                  </div>
                </div>
                {editingEval === p.id && (
                  <div style={{ padding:"8px 10px", background:"#F3E8FF", borderTop:"1px solid #E8D5F5" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#7B2EAF", marginBottom:4 }}>📋 평가 안내</div>
                    <input value={evalText} onChange={e => setEvalText(e.target.value)} placeholder="예: 운동평가, 작업평가" style={{ ...smallInp, marginBottom:4, fontSize:11 }} />
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={() => handleSaveEval(p)} disabled={saving} style={{ flex:1, padding:"5px 0", borderRadius:6, border:"none", background:"#7B2EAF", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>저장</button>
                      <button onClick={() => setEditingEval(null)} style={{ padding:"5px 8px", borderRadius:6, border:"1px solid #DDE6EE", background:"#fff", fontSize:11, cursor:"pointer" }}>취소</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 시간표 편집 */}
        <div style={{ flex:1, minWidth:0 }}>
          {!selectedPatient ? (
            <div style={{ background:"#fff", borderRadius:14, padding:40, textAlign:"center", color:"#7A8FA0", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👈</div>
              <p style={{ fontSize:14, margin:0 }}>왼쪽에서 환자를 선택하세요</p>
            </div>
          ) : (
            <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ background:"#2E7D9F", color:"#fff", padding:"10px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: tab === "specific" ? 8 : 0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button onClick={() => setShowPatientList(true)} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:6, color:"#fff", padding:"4px 8px", fontSize:12, cursor:"pointer" }}>◀ 목록</button>
                    <span style={{ fontSize:14, fontWeight:700 }}>{selectedPatient.name}</span>
                  </div>
                  <div style={{ display:"flex", gap:4, alignItems:"center", flexWrap:"wrap" }}>
                    <button onClick={() => setShowTextInput(p => !p)} style={{ padding:"5px 10px", borderRadius:7, border:"none", background: showTextInput ? "#fff" : "rgba(255,255,255,0.2)", color: showTextInput ? "#2E7D9F" : "#fff", fontWeight:700, fontSize:11, cursor:"pointer" }}>📝 빠른입력</button>
                    {(tab === "weekday" || tab === "saturday") && <button onClick={handleClearTab} disabled={saving} style={{ padding:"5px 10px", borderRadius:7, border:"none", background:"rgba(255,80,80,0.25)", color:"#fff", fontWeight:700, fontSize:11, cursor:"pointer" }}>🗑 초기화</button>}
                    {[["weekday","평일"],["saturday","토요일"],["specific","날짜지정"]].map(([k,l]) => (
                      <button key={k} onClick={() => setTab(k)} style={{ padding:"5px 10px", borderRadius:7, border:"none", background: tab === k ? "#fff" : "rgba(255,255,255,0.2)", color: tab === k ? "#2E7D9F" : "#fff", fontWeight:700, fontSize:11, cursor:"pointer" }}>{l}</button>
                    ))}
                  </div>
                </div>
                {tab === "specific" && (
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                    <input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)} style={{ padding:"5px 8px", borderRadius:7, border:"none", fontSize:12, fontWeight:600, color:"#1A2B3C" }} />
                    {specificDate && <>
                      <button onClick={() => handleCopyFrom("weekday")} disabled={saving} style={{ padding:"5px 10px", borderRadius:7, border:"none", background:"#FFF3E0", color:"#E07A00", fontSize:11, fontWeight:700, cursor:"pointer" }}>📋 평일복사</button>
                      <button onClick={() => handleCopyFrom("saturday")} disabled={saving} style={{ padding:"5px 10px", borderRadius:7, border:"none", background:"#E8F4F8", color:"#2E7D9F", fontSize:11, fontWeight:700, cursor:"pointer" }}>📋 토요일복사</button>
                      <button onClick={handleClearSpecific} disabled={saving} style={{ padding:"5px 10px", borderRadius:7, border:"none", background:"rgba(255,255,255,0.15)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>🗑 초기화</button>
                    </>}
                  </div>
                )}
              </div>

              {/* 빠른 텍스트 입력 */}
              {showTextInput && (
                <div style={{ padding:"12px 16px", background:"#F0F8FF", borderBottom:"2px solid #EEF2F7" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#2E7D9F", marginBottom:4 }}>📝 빠른 시간표 입력</div>
                  <div style={{ fontSize:11, color:"#7A8FA0", marginBottom:8, background:"#fff", borderRadius:8, padding:"8px 10px", lineHeight:1.9 }}>
                    <b>형식:</b> 시간 치료명 [요일] [치료사 이름]<br/>
                    <span style={{ color:"#2E7D9F" }}>0900 운동치료 월수금 치료사 정용진</span><br/>
                    <span style={{ color:"#2E7D9F" }}>0930 FES</span><br/>
                    <span style={{ color:"#2E7D9F" }}>1000 작업치료 화목 치료사 박진성</span><br/>
                    <span style={{ color:"#2E7D9F" }}>1030 물리치료 월</span><br/>
                    <span style={{ color:"#E07A00" }}>※ 치료실은 등록 후 직접 입력해주세요</span>
                  </div>
                  <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
                    placeholder="시간표를 입력해주세요" 
                    style={{ width:"100%", minHeight:120, padding:"8px 10px", borderRadius:8, border:"1.5px solid #B3D9EF", fontSize:13, resize:"vertical", boxSizing:"border-box", fontFamily:"monospace", marginBottom:8, outline:"none" }} />
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <select value={textInputMode} onChange={e => setTextInputMode(e.target.value)} style={{ padding:"5px 8px", borderRadius:7, border:"1.5px solid #DDE6EE", fontSize:12, outline:"none" }}>
                      <option value="replace">기존 삭제 후 등록</option>
                      <option value="add">기존에 추가</option>
                    </select>
                    <button onClick={handleTextImport} disabled={saving || !textInput.trim()} style={{ padding:"6px 16px", borderRadius:7, border:"none", background: saving ? "#aaa" : "#2E7D9F", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      {saving ? "등록 중..." : "시간표 등록"}
                    </button>
                    <button onClick={() => { setShowTextInput(false); setTextInput(""); }} style={{ padding:"6px 10px", borderRadius:7, border:"1px solid #DDE6EE", background:"#fff", fontSize:12, cursor:"pointer" }}>취소</button>
                  </div>
                </div>
              )}

              {load ? <p style={{ textAlign:"center", color:"#7A8FA0", padding:30 }}>불러오는 중...</p> : (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#F8FAFC" }}>
                      <th style={{ padding:"10px 8px", fontSize:12, fontWeight:700, color:"#7A8FA0", width:"22%", textAlign:"center", borderBottom:"2px solid #EEF2F7" }}>시간</th>
                      <th style={{ padding:"10px 8px", fontSize:12, fontWeight:700, color:"#7A8FA0", textAlign:"center", borderBottom:"2px solid #EEF2F7" }}>치료 내용 (클릭하여 편집 · + 로 추가)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIMES.map((time, i) => {
                      const items = getSchedulesForTime(time);
                      return (
                        <tr key={time}>
                          <td style={{ padding:"8px 10px", fontSize:12, color:"#7A8FA0", fontWeight:600, textAlign:"center", borderBottom:"1px solid #F0F4F8", background: i%2===0 ? "#fff" : "#FAFBFC", verticalAlign:"top" }}>{time}</td>
                          <ScheduleCell time={time} schedules={items} onSave={handleSave} onDelete={handleDelete} />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────
// 메인
// ─────────────────────────────────────
// ─────────────────────────────────────
// 스플래시 화면
// ─────────────────────────────────────
function Splash() {
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#1A4A6B,#2E7D9F,#4CAF8A)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"Apple SD Gothic Neo, sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/icon-192.png" alt="양산제일병원 재활치료팀" style={{ width:160, height:160, borderRadius:32, boxShadow:"0 12px 40px rgba(0,0,0,0.3)", marginBottom:20 }} />
        <h1 style={{ color:"#fff", fontSize:22, fontWeight:800, margin:0 }}>치료 시간표</h1>
        <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginTop:8 }}>양산제일병원 재활치료팀</p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [splash, setSplash] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yc_user");
      if (saved) { const p = JSON.parse(saved); if (p && p.id) setUser(p); }
    } catch(e) {}
    setChecking(false);
    const t = setTimeout(() => setSplash(false), 900);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = (u) => { try { localStorage.setItem("yc_user", JSON.stringify(u)); } catch(e) {} setUser(u); };
  const handleLogout = () => { try { localStorage.removeItem("yc_user"); } catch(e) {} setUser(null); };

  if (splash) return <Splash />;

  return (
    <>
      {user
        ? user.role === "admin"
          ? <Admin user={user} onLogout={handleLogout} />
          : <Patient user={user} onLogout={handleLogout} />
        : <Login onLogin={handleLogin} />
      }
    </>
  );
}
