"use client";
import { useState, useEffect } from "react";

// ─────────────────────────────────────
// 서비스워커 등록
// ─────────────────────────────────────
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// ─────────────────────────────────────
// PWA 설치 배너
// ─────────────────────────────────────
function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 이미 설치됐거나 닫은 경우 숨김
    try {
      if (localStorage.getItem("pwa_dismissed")) { setDismissed(true); return; }
    } catch(e) {}
    // iOS 감지
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (standalone) return; // 이미 설치됨
    if (ios) { setIsIOS(true); setShow(true); return; }
    // 안드로이드 beforeinstallprompt
    const handler = (e) => { e.preventDefault(); setPrompt(e); setShow(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (prompt) { prompt.prompt(); const r = await prompt.userChoice; if (r.outcome === "accepted") setShow(false); }
  };
  const handleDismiss = () => {
    try { localStorage.setItem("pwa_dismissed", "1"); } catch(e) {}
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 2000, padding: "12px 16px", background: "linear-gradient(135deg,#1A4A6B,#2E7D9F)", boxShadow: "0 -4px 20px rgba(0,0,0,0.2)" }}>
      <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 36 }}>🏥</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>홈화면에 추가하기</div>
          {isIOS ? (
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>
              하단 공유버튼(📤) → "홈 화면에 추가" 탭
            </div>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>
              앱처럼 설치하면 더 편리하게 사용할 수 있어요!
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {!isIOS && (
            <button onClick={handleInstall}
              style={{ padding: "8px 14px", borderRadius: 9, border: "none", background: "#fff", color: "#2E7D9F", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              설치
            </button>
          )}
          <button onClick={handleDismiss}
            style={{ padding: "8px 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "#fff", fontSize: 13, cursor: "pointer" }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

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
  물리치료:              { bg: "#E8F4F8", c: "#2E7D9F" },
  작업치료:              { bg: "#EAF6EE", c: "#2E7D52" },
  연하치료:              { bg: "#FFF3E0", c: "#E07A00" },
  "연하전기(Stim plus)": { bg: "#FFF3E0", c: "#BF360C" },
  "순차적연하전기(RS Stim)": { bg: "#FFF3E0", c: "#E64A19" },
  인지치료:              { bg: "#F3E8FF", c: "#7B2EAF" },
  운동치료:              { bg: "#E0F7FA", c: "#00838F" },
  기타:                  { bg: "#F5F5F5", c: "#555555" },
};
const TYPES = ["물리치료", "작업치료", "연하치료", "연하전기(Stim plus)", "순차적연하전기(RS Stim)", "인지치료", "운동치료", "기타"];

// 치료사 없는 항목 (RFT 제외)
const NO_THERAPIST_TYPES = ["물리치료", "연하전기(Stim plus)", "순차적연하전기(RS Stim)"];
// 치료사·치료실 둘 다 없는 항목
const NO_THERAPIST_NO_ROOM_TYPES = ["물리치료"];
// 치료실만 있는 항목 (치료사 없음)
const ROOM_ONLY_TYPES = ["연하전기(Stim plus)", "순차적연하전기(RS Stim)"];
const RFT_ITEMS = [
  "코끼리자전거", "자동상하지자전거", "전기(FES)", "서기(Tilt)",
  "서기(ST)", "서기(큐보드)", "트래드밀", "스텝퍼",
  "발자전거", "계단", "평행봉",
];
const RFT_STYLE = { bg: "#FFF0F5", c: "#C2185B" };
const WEEK_DAYS_OPTIONS = ["", "월수금", "화목"];
const WEEK_DAYS_LABEL = { "": "매일", "월수금": "월수금", "화목": "화목" };
const WEEK_DAYS_COLOR = { "": null, "월수금": "#1565C0", "화목": "#6A1B9A" };
const CUSTOM_DAYS = ["월", "화", "수", "목", "금", "토"];

function getStyle(type) {
  return RFT_ITEMS.includes(type) ? RFT_STYLE : (TC[type] || { bg: "#eee", c: "#444" });
}
function isRFT(type) { return RFT_ITEMS.includes(type); }
function noTherapist(type) { return isRFT(type) || NO_THERAPIST_TYPES.includes(type); }
function noRoom(type) { return isRFT(type) || NO_THERAPIST_NO_ROOM_TYPES.includes(type); }
function getWdColor(week_days) {
  if (!week_days) return null;
  if (WEEK_DAYS_COLOR[week_days]) return WEEK_DAYS_COLOR[week_days];
  return "#E07A00"; // 직접선택 요일은 주황색
}
function getWdBg(week_days) {
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
        <div style={{ marginBottom: 12, display: "inline-block" }}>
          <img src="/icon-192.png" alt="양산제일병원 재활치료팀" style={{ width: 140, height: 140, borderRadius: 28, boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }} />
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
function Patient({ user, onLogout }) {
  const [tab, setTab] = useState("weekday");
  const [list, setList] = useState([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    setLoad(true);
    api(`schedules?patient_name=eq.${encodeURIComponent(user.name)}&day_type=eq.${tab}&specific_date=is.null&order=start_time.asc`)
      .then(d => setList(d || []))
      .catch(() => setList([]))
      .finally(() => setLoad(false));
  }, [tab, user.name]);

  const getSchedulesForTime = (time) =>
    list.filter(s => s.start_time <= time && s.end_time > time);

  const todayItems = list.filter(s => isActiveToday(s.week_days));
  const otherItems = list.filter(s => !isActiveToday(s.week_days));

  // ── 알람: 입원(15분전) / 외래(전날 18:00) ──
  const isOutpatient = (user.room || "").trim() === "외래";
  const [alarm, setAlarm] = useState(null);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    // 외래 환자: 전날 오후 6시 알람
    if (isOutpatient) {
      const timer = setInterval(() => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        // 오후 6시 (18:00) 정각 체크
        if (h === 18 && m === 0) {
          // 내일 치료가 있는지 확인 (weekday/weekend 기준)
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tDay = tomorrow.getDay();
          const isWeekend = tDay === 0 || tDay === 6;
          const tomorrowType = isWeekend ? "weekend" : "weekday";
          if (list.length > 0) {
            const tomorrowItems = list.filter(s => !dismissed.includes("outpatient_" + s.start_time + s.type));
            if (tomorrowItems.length > 0) {
              setAlarm({ kind: "outpatient", items: tomorrowItems });
            }
          }
        }
      }, 30000);
      return () => clearInterval(timer);
    }

    // 입원 환자: 오전 첫 치료 15분 전 / 오후 첫 치료 15분 전 알람
    if (todayItems.length === 0) return;
    const timer = setInterval(() => {
      const now = new Date();
      const plus15 = new Date(now.getTime() + 15 * 60000);
      const target = plus15.getHours().toString().padStart(2,"0") + ":" + plus15.getMinutes().toString().padStart(2,"0");

      // 오전 첫 치료 (12:00 미만 중 가장 빠른 것)
      const amItems = todayItems.filter(s => s.start_time < "12:00").sort((a, b) => a.start_time.localeCompare(b.start_time));
      // 오후 첫 치료 (12:00 이상 중 가장 빠른 것)
      const pmItems = todayItems.filter(s => s.start_time >= "12:00").sort((a, b) => a.start_time.localeCompare(b.start_time));

      const firstAm = amItems[0];
      const firstPm = pmItems[0];

      if (firstAm && firstAm.start_time === target && !dismissed.includes("am_first")) {
        setAlarm({ kind: "inpatient", item: firstAm, session: "am", items: amItems });
      } else if (firstPm && firstPm.start_time === target && !dismissed.includes("pm_first")) {
        setAlarm({ kind: "inpatient", item: firstPm, session: "pm", items: pmItems });
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [todayItems, dismissed, isOutpatient, list]);

  const dismissAlarm = () => {
    if (!alarm) return;
    if (alarm.kind === "inpatient") {
      // 오전/오후 세션 단위로 dismissed 처리
      setDismissed(prev => [...prev, alarm.session === "am" ? "am_first" : "pm_first"]);
    } else {
      setDismissed(prev => [...prev, ...alarm.items.map(s => "outpatient_" + s.start_time + s.type)]);
    }
    setAlarm(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: "Apple SD Gothic Neo, sans-serif" }}>
      {/* 알람 팝업 */}
      {alarm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          {alarm.kind === "inpatient" ? (
            /* 입원환자: 오전/오후 첫 치료 15분 전 알람 */
            <div style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>⏰</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: alarm.session === "am" ? "#E07A00" : "#1565C0", background: alarm.session === "am" ? "#FFF3E0" : "#E3F2FD", borderRadius: 8, padding: "5px 0", marginBottom: 12 }}>
                {alarm.session === "am" ? "🌅 오전 치료 15분 전!" : "🌇 오후 치료 15분 전!"}
              </div>
              <div style={{ fontSize: 13, color: "#7A8FA0", marginBottom: 12 }}>오늘 {alarm.session === "am" ? "오전" : "오후"} 치료 일정이에요</div>
              <div style={{ textAlign: "left", marginBottom: 20 }}>
                {alarm.items.map((s, i) => (
                  <div key={i} style={{ background: i === 0 ? "#F0F8FF" : "#F8FAFC", borderRadius: 10, padding: "12px 14px", marginBottom: 8, borderLeft: `4px solid ${getStyle(s.type).c}` }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#1A2B3C", marginBottom: 4 }}>{s.start_time} ~ {s.end_time}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: getStyle(s.type).c }}>{s.type}</div>
                    <div style={{ fontSize: 13, color: "#7A8FA0", marginTop: 2 }}>
                      🏠 {isRFT(s.type) ? "운동치료실" : (s.room || "-")}
                      {!isRFT(s.type) && s.therapist && <span style={{ marginLeft: 8 }}>👩‍⚕️ {s.therapist}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {/* 평가 안내 */}
              {user.evaluation && (
                <div style={{ background: "#F3E8FF", borderRadius: 12, padding: "12px 14px", marginBottom: 16, textAlign: "left", borderLeft: "4px solid #7B2EAF" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#7B2EAF", marginBottom: 6 }}>📋 오늘 평가가 있어요!</div>
                  {user.evaluation.split(",").map((e, i) => (
                    <div key={i} style={{ fontSize: 14, color: "#5A3A7A", fontWeight: 600 }}>· {e.trim()}</div>
                  ))}
                </div>
              )}
              <button onClick={dismissAlarm} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#2E7D9F,#1A5C7A)", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>
                확인
              </button>
            </div>
          ) : (
            /* 외래환자: 전날 오후 6시 알람 */
            <div style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, color: "#E07A00", marginBottom: 6, fontWeight: 700, background: "#FFF3E0", borderRadius: 8, padding: "6px 0" }}>내일 치료 일정 안내</div>
              <div style={{ fontSize: 14, color: "#7A8FA0", marginBottom: 16, marginTop: 8 }}>내일 예약된 치료입니다</div>
              <div style={{ textAlign: "left", marginBottom: 20 }}>
                {alarm.items.map((s, i) => (
                  <div key={i} style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", marginBottom: 8, borderLeft: `4px solid ${getStyle(s.type).c}` }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#1A2B3C", marginBottom: 4 }}>{s.start_time} ~ {s.end_time}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: getStyle(s.type).c }}>{s.type}</div>
                    {s.therapist && <div style={{ fontSize: 13, color: "#7A8FA0", marginTop: 2 }}>👩‍⚕️ {s.therapist}</div>}
                  </div>
                ))}
              </div>
              {/* 평가 안내 */}
              {user.evaluation && (
                <div style={{ background: "#F3E8FF", borderRadius: 12, padding: "12px 14px", marginBottom: 16, textAlign: "left", borderLeft: "4px solid #7B2EAF" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#7B2EAF", marginBottom: 6 }}>📋 내일 평가가 있어요!</div>
                  {user.evaluation.split(",").map((e, i) => (
                    <div key={i} style={{ fontSize: 14, color: "#5A3A7A", fontWeight: 600 }}>· {e.trim()}</div>
                  ))}
                </div>
              )}
              <button onClick={dismissAlarm} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#E07A00,#B85C00)", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>
                확인
              </button>
            </div>
          )}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: "linear-gradient(135deg,#1A4A6B,#2E7D9F)", padding: "48px 20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: 600, margin: "0 auto" }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, opacity: 0.8 }}>안녕하세요 👋</p>
            <h2 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800 }}>{user.name}님의 시간표</h2>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, color: "#fff", padding: "9px 16px", fontSize: 14, cursor: "pointer" }}>로그아웃</button>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, maxWidth: 600, margin: "20px auto 0" }}>
          {[["weekday", "📅 평일"], ["saturday", "🗓 토요일"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: tab === k ? "#fff" : "rgba(255,255,255,0.15)", color: tab === k ? "#2E7D9F" : "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* 카드 목록 */}
      <div style={{ padding: "16px 16px 40px", maxWidth: 600, margin: "0 auto" }}>
        {load ? (
          <p style={{ textAlign: "center", color: "#7A8FA0", padding: 40, fontSize: 18 }}>불러오는 중...</p>
        ) : list.length === 0 ? (
          <p style={{ textAlign: "center", color: "#7A8FA0", padding: 40, fontSize: 18 }}>등록된 시간표가 없습니다</p>
        ) : (
          <>
            {/* 오늘 해당 치료 - 오전/오후 구분 */}
            {todayItems.length > 0 && (() => {
              const amItems = todayItems.filter(s => s.start_time < "12:00");
              const pmItems = todayItems.filter(s => s.start_time >= "12:00");
              const renderCard = (s, i) => {
                const st = getStyle(s.type);
                const wdColor = getWdColor(s.week_days || "");
                return (
                  <div key={i} style={{ background: "#fff", borderRadius: 16, marginBottom: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderLeft: `5px solid ${st.c}` }}>
                    <div style={{ padding: "18px 20px" }}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: "#1A2B3C", marginBottom: 10 }}>
                        {s.start_time} ~ {s.end_time}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, background: st.bg, color: st.c, borderRadius: 8, padding: "5px 14px" }}>
                          {isRFT(s.type) && <span style={{ fontSize: 13, background: "#C2185B", color: "#fff", borderRadius: 4, padding: "2px 6px", marginRight: 6 }}>RFT</span>}
                          {s.type}
                        </span>
                        {s.week_days && (
                          <span style={{ fontSize: 15, background: wdColor, color: "#fff", borderRadius: 6, padding: "4px 12px", fontWeight: 700 }}>{s.week_days}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 18, color: "#5A7A8A", display: "flex", gap: 12 }}>
                        {!noRoom(s.type) && <span>🏠 {isRFT(s.type) ? "운동치료실" : (s.room || "-")}</span>}
                        {isRFT(s.type) && <span>🏠 운동치료실</span>}
                        {!noTherapist(s.type) && <span>👩‍⚕️ {s.therapist || "-"}</span>}
                      </div>
                    </div>
                  </div>
                );
              };
              return (
                <>
                  {amItems.length > 0 && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#E07A00", background: "#FFF3E0", borderRadius: 8, padding: "4px 14px" }}>🌅 오전</span>
                        <div style={{ flex: 1, height: 2, background: "#FFE0B2", borderRadius: 2 }} />
                      </div>
                      {amItems.map(renderCard)}
                    </>
                  )}
                  {pmItems.length > 0 && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, marginTop: amItems.length > 0 ? 8 : 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#1565C0", background: "#E3F2FD", borderRadius: 8, padding: "4px 14px" }}>🌇 오후</span>
                        <div style={{ flex: 1, height: 2, background: "#BBDEFB", borderRadius: 2 }} />
                      </div>
                      {pmItems.map(renderCard)}
                    </>
                  )}
                </>
              );
            })()}

            {/* 오늘 아닌 치료 */}
            {otherItems.length > 0 && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#aaa", marginBottom: 10, marginTop: 16, letterSpacing: 0.5 }}>
                  다른 요일 치료
                </div>
                {otherItems.map((s, i) => {
                  const st = getStyle(s.type);
                  const wdColor = getWdColor(s.week_days || "");
                  return (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, marginBottom: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", borderLeft: "5px solid #ddd", opacity: 0.45 }}>
                      <div style={{ padding: "16px 20px" }}>
                        {/* 시간 - 맨 위 */}
                        <div style={{ fontSize: 26, fontWeight: 800, color: "#888", marginBottom: 8 }}>
                          {s.start_time} ~ {s.end_time}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, background: st.bg, color: st.c, borderRadius: 8, padding: "4px 12px" }}>
                            {isRFT(s.type) && <span style={{ fontSize: 12, background: "#C2185B", color: "#fff", borderRadius: 4, padding: "2px 5px", marginRight: 5 }}>RFT</span>}
                            {s.type}
                          </span>
                          {s.week_days && (
                            <span style={{ fontSize: 13, background: wdColor, color: "#fff", borderRadius: 6, padding: "3px 10px", fontWeight: 700 }}>{s.week_days}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 16, color: "#aaa" }}>
                          {!noRoom(s.type) && <span>🏠 {isRFT(s.type) ? "운동치료실" : (s.room || "-")}</span>}
                          {isRFT(s.type) && <span>🏠 운동치료실</span>}
                          {!noTherapist(s.type) && <span style={{ marginLeft: 12 }}>👩‍⚕️ {s.therapist || "-"}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* 치료실 연락처 */}
        <ContactInfo />
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// 치료실 연락처
// ─────────────────────────────────────
const CONTACTS = [
  {
    name: "운동치료실",
    tel: "055.912.2160",
    color: "#C2185B",
    bg: "#FFF0F5",
    hours: [
      { label: "월 ~ 금", time: "08:30 ~ 17:30", note: "점심시간 12:30 ~ 13:30" },
      { label: "토", time: "08:30 ~ 12:30", note: "" },
    ],
  },
  {
    name: "작업치료실",
    tel: "055.912.2164",
    color: "#2E7D52",
    bg: "#EAF6EE",
    hours: [
      { label: "월 ~ 금", time: "08:30 ~ 17:30", note: "점심시간 12:30 ~ 13:30" },
      { label: "토", time: "08:30 ~ 12:30", note: "" },
    ],
  },
  {
    name: "물리치료실",
    tel: "055.912.2159",
    color: "#2E7D9F",
    bg: "#E8F4F8",
    hours: [
      { label: "월 ~ 금", time: "08:30 ~ 17:30", note: "점심시간 당직 운영" },
      { label: "토", time: "08:30 ~ 12:30", note: "" },
    ],
  },
];

function ContactInfo() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#7A8FA0", marginBottom: 10, letterSpacing: 0.5 }}>📞 치료실 연락처</div>
      <div style={{ display: "flex", gap: 8 }}>
        {CONTACTS.map((c) => (
          <button key={c.name} onClick={() => setOpen(open === c.name ? null : c.name)}
            style={{ flex: 1, padding: "10px 6px", borderRadius: 12, border: `2px solid ${open === c.name ? c.color : "#E8EEF4"}`, background: open === c.name ? c.bg : "#fff", color: c.color, fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", transition: "all 0.15s" }}>
            {c.name}
          </button>
        ))}
      </div>
      {open && (() => {
        const c = CONTACTS.find(x => x.name === open);
        return (
          <div style={{ marginTop: 10, background: c.bg, borderRadius: 14, padding: "16px 18px", borderLeft: `4px solid ${c.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: c.color }}>{c.name}</div>
              <a href={`tel:${c.tel.replace(/\./g, "-")}`}
                style={{ display: "flex", alignItems: "center", gap: 6, background: c.color, color: "#fff", borderRadius: 10, padding: "8px 16px", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>
                📞 {c.tel}
              </a>
            </div>
            <div style={{ borderTop: `1px solid ${c.color}22`, paddingTop: 10 }}>
              {c.hours.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: i < c.hours.length - 1 ? 8 : 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: c.color, minWidth: 60 }}>{h.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1A2B3C" }}>{h.time}</div>
                    {h.note && <div style={{ fontSize: 12, color: "#7A8FA0", marginTop: 2 }}>{h.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────
// 시간표 편집 셀
// ─────────────────────────────────────
function ScheduleCell({ time, schedules, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = 새항목
  const [form, setForm] = useState({ type: "", therapist: "", room: "", end_time: nextTime(time), week_days: "" });
  const [showCustomDays, setShowCustomDays] = useState(false);

  const openNew = () => {
    setEditTarget(null);
    setForm({ type: "", therapist: "", room: "", end_time: nextTime(time), week_days: "" });
    setShowCustomDays(false);
    setEditing(true);
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setForm({ type: s.type, therapist: s.therapist || "", room: s.room || "", end_time: s.end_time, week_days: s.week_days || "" });
    // 저장된 week_days가 매일/월수금/화목이 아니면 직접선택 모드로
    const isCustom = s.week_days && !["", "월수금", "화목"].includes(s.week_days);
    setShowCustomDays(isCustom);
    setEditing(true);
  };

  const rft = isRFT(form.type);
  const noTherapistForm = noTherapist(form.type);
  const noRoomForm = noRoom(form.type);

  const handleTypeChange = (val) => {
    setForm(prev => ({
      ...prev, type: val,
      therapist: noTherapist(val) ? "" : prev.therapist,
      room: isRFT(val) ? "운동치료실" : prev.room,
    }));
  };

  const handleSave = async () => {
    if (!form.type) return;
    if (!noTherapist(form.type) && !form.therapist.trim()) return;
    const saveData = {
      ...form,
      therapist: noTherapist(form.type) ? "" : form.therapist,
      room: isRFT(form.type) ? "운동치료실" : form.room,
    };
    await onSave(time, saveData, editTarget);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!editTarget) return;
    await onDelete(editTarget.id);
    setEditing(false);
  };

  const cellInp = { width: "100%", padding: "5px 6px", borderRadius: 6, border: "1.5px solid #DDE6EE", fontSize: 12, marginBottom: 4, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  if (editing) {
    return (
      <td style={{ padding: 6, verticalAlign: "top", background: "#FFFDE7", borderBottom: "1px solid #F0F4F8" }}>
        <select value={form.type} onChange={e => handleTypeChange(e.target.value)} style={{ ...cellInp, marginBottom: 4 }}>
          <option value="">치료 종류 선택</option>
          <optgroup label="── 일반 치료 ──">
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </optgroup>
          <optgroup label="── RFT (운동치료실) ──">
            {RFT_ITEMS.map(t => <option key={t} value={t}>{t}</option>)}
          </optgroup>
        </select>

        {/* 요일 선택 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          {WEEK_DAYS_OPTIONS.map(wd => (
            <button key={wd} onClick={() => { setForm(p => ({ ...p, week_days: wd })); setShowCustomDays(false); }}
              style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: `1.5px solid ${!showCustomDays && form.week_days === wd ? (WEEK_DAYS_COLOR[wd] || "#2E7D9F") : "#DDE6EE"}`, background: !showCustomDays && form.week_days === wd ? (WEEK_DAYS_COLOR[wd] || "#2E7D9F") : "#fff", color: !showCustomDays && form.week_days === wd ? "#fff" : "#555", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {WEEK_DAYS_LABEL[wd]}
            </button>
          ))}
          <button onClick={() => { setShowCustomDays(p => !p); setForm(p => ({ ...p, week_days: "" })); }}
            style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: `1.5px solid ${showCustomDays ? "#E07A00" : "#DDE6EE"}`, background: showCustomDays ? "#FFF3E0" : "#fff", color: showCustomDays ? "#E07A00" : "#555", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            직접선택
          </button>
        </div>
        {/* 직접선택 체크박스 */}
        {showCustomDays && (
          <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap", background: "#FFF3E0", borderRadius: 8, padding: "6px 8px", border: "1.5px solid #FFE0B2" }}>
            {CUSTOM_DAYS.map(day => {
              const selected = (form.week_days || "").includes(day);
              return (
                <button key={day} onClick={() => {
                  const curr = form.week_days || "";
                  const days = CUSTOM_DAYS.filter(d => curr.includes(d));
                  const next = selected ? days.filter(d => d !== day) : [...days, day];
                  // 월화수목금토 순서 유지
                  const ordered = CUSTOM_DAYS.filter(d => next.includes(d)).join("");
                  setForm(p => ({ ...p, week_days: ordered }));
                }}
                  style={{ padding: "3px 8px", borderRadius: 6, border: `1.5px solid ${selected ? "#E07A00" : "#DDE6EE"}`, background: selected ? "#E07A00" : "#fff", color: selected ? "#fff" : "#555", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {day}
                </button>
              );
            })}
            {form.week_days && <span style={{ fontSize: 10, color: "#E07A00", alignSelf: "center", marginLeft: 2 }}>({form.week_days})</span>}
          </div>
        )}

        {rft ? (
          <div style={{ padding: "4px 6px", marginBottom: 4, fontSize: 11, color: "#C2185B", background: "#FFF0F5", borderRadius: 6, border: "1.5px solid #F8BBD0" }}>
            🏋️ 운동치료실 · 치료사 없음
          </div>
        ) : noRoomForm ? (
          <div style={{ padding: "4px 6px", marginBottom: 4, fontSize: 11, color: "#2E7D9F", background: "#E8F4F8", borderRadius: 6, border: "1.5px solid #B3D9EF" }}>
            🏥 치료사·치료실 없음
          </div>
        ) : (
          <>
            {!noTherapistForm && (
              <input value={form.therapist} onChange={e => setForm(p => ({ ...p, therapist: e.target.value }))} placeholder="치료사" style={cellInp} />
            )}
            <input value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="치료실" style={cellInp} />
          </>
        )}

        <select value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} style={{ ...cellInp, marginBottom: 6 }}>
          {TIMES.filter(t => t > time).map(t => <option key={t} value={t}>{t}까지</option>)}
        </select>

        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={handleSave} style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "none", background: "#2E7D9F", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>저장</button>
          {editTarget && <button onClick={handleDelete} style={{ padding: "5px 8px", borderRadius: 6, border: "none", background: "#E05C5C", color: "#fff", fontSize: 11, cursor: "pointer" }}>삭제</button>}
          <button onClick={() => setEditing(false)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #DDE6EE", background: "#fff", fontSize: 11, cursor: "pointer" }}>취소</button>
        </div>
      </td>
    );
  }

  // 비편집 상태 - 여러 항목 표시
  return (
    <td style={{ padding: "4px 6px", borderBottom: "1px solid #F0F4F8", verticalAlign: "middle" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {schedules.map((s, i) => {
          const st = getStyle(s.type);
          const wdColor = getWdColor(s.week_days || "");
          return (
            <div key={i} onClick={() => openEdit(s)}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", borderRadius: 6, background: st.bg, cursor: "pointer", transition: "opacity .15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: st.c }}>
                  {isRFT(s.type) && <span style={{ fontSize: 9, background: "#C2185B", color: "#fff", borderRadius: 3, padding: "1px 3px", marginRight: 3 }}>RFT</span>}
                  {s.type}
                  {s.week_days && <span style={{ marginLeft: 4, fontSize: 9, background: wdColor, color: "#fff", borderRadius: 3, padding: "1px 4px" }}>{s.week_days}</span>}
                </div>
                {!noTherapist(s.type) && s.therapist && <div style={{ fontSize: 10, color: "#666" }}>{s.therapist}</div>}
                {isRFT(s.type) && <div style={{ fontSize: 10, color: "#C2185B" }}>운동치료실</div>}
              </div>
            </div>
          );
        })}
        <button onClick={openNew}
          style={{ padding: "3px 0", borderRadius: 6, border: "1.5px dashed #DDE6EE", background: "transparent", color: "#BCC8D4", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>+</button>
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

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const loadPatients = async () => {
    const d = await api("users?order=name.asc");
    setPatients((d || []).filter(u => u.role === "patient"));
  };

  useEffect(() => { loadPatients().catch(console.error); }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    if (tab === "specific" && !specificDate) return;
    setLoad(true);
    const query = tab === "specific"
      ? `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&specific_date=eq.${specificDate}&order=start_time.asc`
      : `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${tab}&specific_date=is.null&order=start_time.asc`;
    api(query)
      .then(d => setSchedules(d || []))
      .catch(() => setSchedules([]))
      .finally(() => setLoad(false));
  }, [selectedPatient, tab, specificDate]);

  const getSchedulesForTime = (time) =>
    schedules.filter(s => s.start_time <= time && s.end_time > time);

  const reloadSchedules = async () => {
    if (!selectedPatient) return;
    const query = tab === "specific"
      ? `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&specific_date=eq.${specificDate}&order=start_time.asc`
      : `schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${tab}&specific_date=is.null&order=start_time.asc`;
    const d = await api(query);
    setSchedules(d || []);
  };

  // 복사 기능
  const handleCopyFrom = async (fromTab) => {
    if (!selectedPatient || !specificDate) return;
    if (!confirm(`${fromTab === "weekday" ? "평일" : "토요일"} 시간표를 ${specificDate}에 복사할까요?
기존 내용은 삭제됩니다.`)) return;
    setSaving(true);
    try {
      // 기존 날짜 데이터 삭제
      await api(`schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&specific_date=eq.${specificDate}`, { method: "DELETE" });
      // 복사할 원본 데이터 가져오기
      const src = await api(`schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${fromTab}&specific_date=is.null&order=start_time.asc`);
      if (src && src.length > 0) {
        for (const s of src) {
          await api("schedules", {
            method: "POST",
            body: JSON.stringify({
              patient_name: selectedPatient.name,
              day_type: fromTab,
              specific_date: specificDate,
              start_time: s.start_time,
              end_time: s.end_time,
              type: s.type,
              therapist: s.therapist,
              room: s.room,
              week_days: s.week_days,
            }),
          });
        }
      }
      await reloadSchedules();
      flash(`${fromTab === "weekday" ? "평일" : "토요일"} 시간표를 복사했습니다 ✓`);
    } catch (e) { console.error(e); flash("복사 실패"); }
    finally { setSaving(false); }
  };

  // 초기화 기능
  const handleClearSpecific = async () => {
    if (!selectedPatient || !specificDate) return;
    if (!confirm(`${specificDate} 시간표를 초기화할까요?`)) return;
    setSaving(true);
    try {
      await api(`schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&specific_date=eq.${specificDate}`, { method: "DELETE" });
      await reloadSchedules();
      flash("초기화되었습니다 ✓");
    } catch (e) { console.error(e); flash("초기화 실패"); }
    finally { setSaving(false); }
  };

  const handleSave = async (time, form, existing) => {
    setSaving(true);
    try {
      if (existing) {
        await api(`schedules?id=eq.${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ type: form.type, therapist: form.therapist, room: form.room, end_time: form.end_time, week_days: form.week_days }),
        });
      } else {
        await api("schedules", {
          method: "POST",
          body: JSON.stringify({
            patient_name: selectedPatient.name,
            day_type: tab === "specific" ? "weekday" : tab,
            specific_date: tab === "specific" ? specificDate : null,
            start_time: time,
            end_time: form.end_time,
            type: form.type,
            therapist: form.therapist,
            room: form.room,
            week_days: form.week_days,
          }),
        });
      }
      await reloadSchedules();
      flash("저장되었습니다 ✓");
    } catch (e) { console.error(e); flash("저장 실패"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await api(`schedules?id=eq.${id}`, { method: "DELETE" });
      await reloadSchedules();
      flash("삭제되었습니다");
    } catch (e) { console.error(e); flash("삭제 실패"); }
    finally { setSaving(false); }
  };

  const handleAddPatient = async () => {
    if (!newPatient.name.trim() || !newPatient.password.trim()) return;
    setSaving(true);
    try {
      const saved = await api("users", {
        method: "POST",
        body: JSON.stringify({ name: newPatient.name.trim(), password: newPatient.password.trim(), room: newPatient.room.trim(), role: "patient" }),
      });
      const added = Array.isArray(saved) ? saved[0] : saved;
      if (added && added.id) {
        setPatients(prev => {
          const next = [...prev, added];
          next.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
          return next;
        });
      } else {
        await new Promise(r => setTimeout(r, 500));
        await loadPatients();
      }
      setNewPatient({ name: "", password: "", room: "" });
      setShowAddPatient(false);
      flash("환자가 추가되었습니다 ✓");
    } catch (e) { console.error(e); flash("추가 실패 - 다시 시도해주세요"); }
    finally { setSaving(false); }
  };

  const handleSaveEval = async (p) => {
    setSaving(true);
    try {
      await api(`users?id=eq.${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ evaluation: evalText.trim() }),
      });
      setPatients(prev => prev.map(u => u.id === p.id ? { ...u, evaluation: evalText.trim() } : u));
      if (selectedPatient && selectedPatient.id === p.id) {
        setSelectedPatient(prev => ({ ...prev, evaluation: evalText.trim() }));
      }
      setEditingEval(null);
      flash("평가 안내가 저장됐습니다 ✓");
    } catch (e) { console.error(e); flash("저장 실패"); }
    finally { setSaving(false); }
  };

  const handleDeletePatient = async (p) => {
    if (!confirm(`${p.name} 환자를 삭제할까요?\n시간표도 모두 삭제됩니다.`)) return;
    setSaving(true);
    try {
      await api(`schedules?patient_name=eq.${encodeURIComponent(p.name)}`, { method: "DELETE" });
      await api(`users?id=eq.${p.id}`, { method: "DELETE" });
      await loadPatients();
      if (selectedPatient && selectedPatient.id === p.id) setSelectedPatient(null);
      flash("삭제되었습니다");
    } catch (e) { console.error(e); flash("삭제 실패"); }
    finally { setSaving(false); }
  };

  const smallInp = { width: "100%", padding: "6px 8px", borderRadius: 6, border: "1.5px solid #DDE6EE", fontSize: 12, marginBottom: 5, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: "Apple SD Gothic Neo, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1A3A5C,#2E7D9F)", padding: "48px 20px 20px", color: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>🏥 양산제일병원 관리자</p>
            <h2 style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 800 }}>{user.name}님</h2>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {msg && <span style={{ background: "#4CAF8A", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{msg}</span>}
            {saving && <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>처리 중...</span>}
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, color: "#fff", padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>로그아웃</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 14px", display: "flex", gap: 14, flexWrap: "wrap" }}>
        {/* 환자 목록 */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ background: "#2E7D9F", color: "#fff", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>환자 목록</span>
              <button onClick={() => setShowAddPatient(p => !p)}
                style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 6, color: "#fff", width: 26, height: 26, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            {showAddPatient && (
              <div style={{ padding: 10, background: "#FFFDE7", borderBottom: "1px solid #F0F4F8" }}>
                <input value={newPatient.name} onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))} placeholder="이름 *" style={smallInp} />
                <input value={newPatient.password} onChange={e => setNewPatient(p => ({ ...p, password: e.target.value }))} placeholder="병록번호(비밀번호) *" style={smallInp} />
                <input value={newPatient.room} onChange={e => setNewPatient(p => ({ ...p, room: e.target.value }))} placeholder="병실 (선택)" style={smallInp} />
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={handleAddPatient} disabled={saving}
                    style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: saving ? "#aaa" : "#2E7D9F", color: "#fff", fontSize: 11, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "추가 중..." : "추가"}
                  </button>
                  <button onClick={() => { setShowAddPatient(false); setNewPatient({ name: "", password: "", room: "" }); }}
                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #DDE6EE", background: "#fff", fontSize: 11, cursor: "pointer" }}>취소</button>
                </div>
              </div>
            )}
            {patients.length === 0 && !showAddPatient && (
              <p style={{ textAlign: "center", color: "#7A8FA0", padding: 20, fontSize: 12 }}>환자 없음</p>
            )}
            {patients.map(p => (
              <div key={p.id} style={{ borderBottom: "1px solid #F0F4F8" }}>
                <div
                  style={{ padding: "10px 14px", cursor: "pointer", background: selectedPatient && selectedPatient.id === p.id ? "#E8F4F8" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setSelectedPatient(p)}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: selectedPatient && selectedPatient.id === p.id ? 700 : 500, color: selectedPatient && selectedPatient.id === p.id ? "#2E7D9F" : "#1A2B3C" }}>{p.name}</div>
                    {p.room && <div style={{ fontSize: 10, color: "#7A8FA0" }}>{p.room}</div>}
                    {p.evaluation && <div style={{ fontSize: 10, color: "#7B2EAF", marginTop: 2 }}>📋 {p.evaluation}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button onClick={e => { e.stopPropagation(); setEditingEval(p.id); setEvalText(p.evaluation || ""); }}
                      style={{ background: "none", border: "none", color: "#7B2EAF", fontSize: 13, cursor: "pointer", padding: "2px 4px" }} title="평가 안내">📋</button>
                    <button onClick={e => { e.stopPropagation(); handleDeletePatient(p); }}
                      style={{ background: "none", border: "none", color: "#ccc", fontSize: 14, cursor: "pointer", padding: "2px 4px" }}>✕</button>
                  </div>
                </div>
                {/* 평가 편집 인라인 폼 */}
                {editingEval === p.id && (
                  <div style={{ padding: "8px 10px", background: "#F3E8FF", borderTop: "1px solid #E8D5F5" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7B2EAF", marginBottom: 4 }}>📋 평가 안내 입력</div>
                    <input
                      value={evalText}
                      onChange={e => setEvalText(e.target.value)}
                      placeholder="예: 운동평가, 작업평가"
                      style={{ ...smallInp, marginBottom: 4, fontSize: 11 }}
                    />
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => handleSaveEval(p)} disabled={saving}
                        style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "none", background: "#7B2EAF", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>저장</button>
                      <button onClick={() => setEditingEval(null)}
                        style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #DDE6EE", background: "#fff", fontSize: 11, cursor: "pointer" }}>취소</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 시간표 편집 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedPatient ? (
            <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#7A8FA0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
              <p style={{ fontSize: 14, margin: 0 }}>왼쪽에서 환자를 선택하세요</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ background: "#2E7D9F", color: "#fff", padding: "10px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tab === "specific" ? 8 : 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{selectedPatient.name} 시간표 편집</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["weekday", "평일"], ["saturday", "토요일"], ["specific", "날짜지정"]].map(([k, l]) => (
                      <button key={k} onClick={() => setTab(k)} style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: tab === k ? "#fff" : "rgba(255,255,255,0.2)", color: tab === k ? "#2E7D9F" : "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>{l}</button>
                    ))}
                  </div>
                </div>
                {tab === "specific" && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)}
                      style={{ padding: "5px 8px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600, color: "#1A2B3C" }} />
                    {specificDate && (
                      <>
                        <button onClick={() => handleCopyFrom("weekday")} disabled={saving}
                          style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "#FFF3E0", color: "#E07A00", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📋 평일 복사</button>
                        <button onClick={() => handleCopyFrom("saturday")} disabled={saving}
                          style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "#E8F4F8", color: "#2E7D9F", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📋 토요일 복사</button>
                        <button onClick={handleClearSpecific} disabled={saving}
                          style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🗑 초기화</button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {load ? (
                <p style={{ textAlign: "center", color: "#7A8FA0", padding: 30 }}>불러오는 중...</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      <th style={{ padding: "10px 8px", fontSize: 12, fontWeight: 700, color: "#7A8FA0", width: "22%", textAlign: "center", borderBottom: "2px solid #EEF2F7" }}>시간</th>
                      <th style={{ padding: "10px 8px", fontSize: 12, fontWeight: 700, color: "#7A8FA0", textAlign: "center", borderBottom: "2px solid #EEF2F7" }}>치료 내용 (클릭하여 편집 · + 로 추가)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIMES.map((time, i) => {
                      const items = getSchedulesForTime(time);
                      return (
                        <tr key={time}>
                          <td style={{ padding: "8px 10px", fontSize: 12, color: "#7A8FA0", fontWeight: 600, textAlign: "center", borderBottom: "1px solid #F0F4F8", background: i % 2 === 0 ? "#fff" : "#FAFBFC", verticalAlign: "top" }}>{time}</td>
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
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // 앱 시작 시 자동 로그인 체크
  useEffect(() => {
    try {
      const saved = localStorage.getItem("yc_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) setUser(parsed);
      }
    } catch (e) {}
    setChecking(false);
  }, []);

  const handleLogin = (u) => {
    try { localStorage.setItem("yc_user", JSON.stringify(u)); } catch (e) {}
    setUser(u);
  };

  const handleLogout = () => {
    try { localStorage.removeItem("yc_user"); } catch (e) {}
    setUser(null);
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#1A4A6B,#2E7D9F,#4CAF8A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>🏥 불러오는 중...</div>
    </div>
  );

  return (
    <>
      <InstallBanner />
      {user
        ? user.role === "admin"
          ? <Admin user={user} onLogout={handleLogout} />
          : <Patient user={user} onLogout={handleLogout} />
        : <Login onLogin={handleLogin} />
      }
    </>
  );
}
