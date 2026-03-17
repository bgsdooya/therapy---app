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
  물리치료:   { bg: "#E8F4F8", c: "#2E7D9F" },
  작업치료:   { bg: "#EAF6EE", c: "#2E7D52" },
  연하치료:   { bg: "#FFF3E0", c: "#E07A00" },
  인지치료:   { bg: "#F3E8FF", c: "#7B2EAF" },
  운동치료:   { bg: "#E0F7FA", c: "#00838F" },
  기타:       { bg: "#F5F5F5", c: "#555555" },
};

const TYPES = ["물리치료", "작업치료", "연하치료", "인지치료", "운동치료", "기타"];

const RFT_ITEMS = [
  "코끼리자전거", "자동상하지자전거", "전기(FES)", "서기(Tilt)",
  "서기(ST)", "서기(큐보드)", "트래드밀", "스텝퍼",
  "발자전거", "계단", "평행봉",
];

const RFT_STYLE = { bg: "#FFF0F5", c: "#C2185B" };

function getStyle(type) {
  if (RFT_ITEMS.includes(type)) return RFT_STYLE;
  return TC[type] || { bg: "#eee", c: "#444" };
}

function isRFT(type) {
  return RFT_ITEMS.includes(type);
}

const TIMES = [
  "08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00",
  "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00",
];

function nextTime(t) {
  const idx = TIMES.indexOf(t);
  return idx >= 0 && idx < TIMES.length - 1 ? TIMES[idx + 1] : t;
}

const baseInp = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1.5px solid #DDE6EE",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 8,
  fontFamily: "inherit",
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
    } finally {
      setLoad(false);
    }
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
function Patient({ user, onLogout }) {
  const [tab, setTab] = useState("weekday");
  const [list, setList] = useState([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    setLoad(true);
    api(`schedules?patient_name=eq.${encodeURIComponent(user.name)}&day_type=eq.${tab}&order=start_time.asc`)
      .then(d => { setList(d || []); })
      .catch(() => setList([]))
      .finally(() => setLoad(false));
  }, [tab, user.name]);

  const getScheduleForTime = (time) =>
    list.find(s => s.start_time <= time && s.end_time > time) || null;

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: "Apple SD Gothic Neo, sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg,#1A4A6B,#2E7D9F)", padding: "48px 20px 20px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
        {load ? (
          <p style={{ textAlign: "center", color: "#7A8FA0", padding: 30 }}>불러오는 중...</p>
        ) : (
          <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#2E7D9F", color: "#fff" }}>
                  <th style={{ padding: "10px 8px", fontSize: 12, fontWeight: 700, width: "25%", textAlign: "center" }}>시간</th>
                  <th style={{ padding: "10px 8px", fontSize: 12, fontWeight: 700, width: "42%", textAlign: "center" }}>치료 종류</th>
                  <th style={{ padding: "10px 8px", fontSize: 12, fontWeight: 700, width: "33%", textAlign: "center" }}>담당 치료사</th>
                </tr>
              </thead>
              <tbody>
                {TIMES.map((time, i) => {
                  const s = getScheduleForTime(time);
                  const st = s ? getStyle(s.type) : null;
                  return (
                    <tr key={time} style={{ borderBottom: "1px solid #F0F4F8", background: s ? st.bg : i % 2 === 0 ? "#fff" : "#FAFBFC" }}>
                      <td style={{ padding: "10px 8px", fontSize: 12, color: "#7A8FA0", fontWeight: 600, textAlign: "center" }}>{time}</td>
                      <td style={{ padding: "10px 8px", fontSize: 12, fontWeight: 700, color: s ? st.c : "#ccc", textAlign: "center" }}>
                        {s ? (
                          <span>
                            {isRFT(s.type) && <span style={{ fontSize: 9, background: "#C2185B", color: "#fff", borderRadius: 3, padding: "1px 4px", marginRight: 4 }}>RFT</span>}
                            {s.type}
                          </span>
                        ) : "-"}
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, color: s ? "#1A2B3C" : "#ccc", textAlign: "center" }}>
                        {s ? (isRFT(s.type) ? "운동치료실" : (s.therapist || "-")) : "-"}
                      </td>
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

// ─────────────────────────────────────
// 시간표 편집 셀
// ─────────────────────────────────────
function ScheduleCell({ time, schedule, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    type: "",
    therapist: "",
    room: "",
    end_time: nextTime(time),
  });

  useEffect(() => {
    setForm({
      type: schedule ? schedule.type : "",
      therapist: schedule ? (schedule.therapist || "") : "",
      room: schedule ? (schedule.room || "") : "",
      end_time: schedule ? schedule.end_time : nextTime(time),
    });
  }, [schedule, time]);

  const st = schedule ? getStyle(schedule.type) : null;
  const rft = isRFT(form.type);

  const handleTypeChange = (val) => {
    setForm(prev => ({
      ...prev,
      type: val,
      therapist: isRFT(val) ? "" : prev.therapist,
      room: isRFT(val) ? "운동치료실" : prev.room,
    }));
  };

  const handleSave = async () => {
    if (!form.type) return;
    if (!rft && !form.therapist.trim()) return;
    const saveData = {
      ...form,
      therapist: rft ? "" : form.therapist,
      room: rft ? "운동치료실" : form.room,
    };
    await onSave(time, saveData, schedule);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!schedule) return;
    await onDelete(schedule.id);
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

        {rft ? (
          <div style={{ padding: "4px 6px", marginBottom: 4, fontSize: 11, color: "#C2185B", background: "#FFF0F5", borderRadius: 6, border: "1.5px solid #F8BBD0" }}>
            🏋️ 운동치료실 · 치료사 없음
          </div>
        ) : (
          <>
            <input value={form.therapist} onChange={e => setForm(p => ({ ...p, therapist: e.target.value }))} placeholder="치료사" style={cellInp} />
            <input value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="치료실" style={cellInp} />
          </>
        )}

        <select value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} style={{ ...cellInp, marginBottom: 6 }}>
          {TIMES.filter(t => t > time).map(t => <option key={t} value={t}>{t}까지</option>)}
        </select>

        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={handleSave} style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "none", background: "#2E7D9F", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>저장</button>
          {schedule && <button onClick={handleDelete} style={{ padding: "5px 8px", borderRadius: 6, border: "none", background: "#E05C5C", color: "#fff", fontSize: 11, cursor: "pointer" }}>삭제</button>}
          <button onClick={() => setEditing(false)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #DDE6EE", background: "#fff", fontSize: 11, cursor: "pointer" }}>취소</button>
        </div>
      </td>
    );
  }

  return (
    <td
      onClick={() => setEditing(true)}
      style={{ padding: "8px 6px", cursor: "pointer", background: schedule ? st.bg : "transparent", borderBottom: "1px solid #F0F4F8", textAlign: "center" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {schedule ? (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: st.c }}>
            {isRFT(schedule.type) && (
              <span style={{ fontSize: 9, background: "#C2185B", color: "#fff", borderRadius: 3, padding: "1px 4px", marginRight: 3 }}>RFT</span>
            )}
            {schedule.type}
          </div>
          {isRFT(schedule.type) ? (
            <div style={{ fontSize: 10, color: "#C2185B", marginTop: 2 }}>운동치료실</div>
          ) : (
            <>
              {schedule.therapist && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{schedule.therapist}</div>}
              {schedule.room && <div style={{ fontSize: 10, color: "#999" }}>{schedule.room}</div>}
            </>
          )}
        </div>
      ) : (
        <span style={{ color: "#DDE6EE", fontSize: 18 }}>+</span>
      )}
    </td>
  );
}

// ─────────────────────────────────────
// 관리자 화면
// ─────────────────────────────────────
function Admin({ user, onLogout }) {
  const [tab, setTab] = useState("weekday");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [load, setLoad] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", password: "", room: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const flash = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };

  const loadPatients = async () => {
    const d = await api("users?role=eq.patient&order=name.asc");
    setPatients(d || []);
  };

  useEffect(() => {
    loadPatients().catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    setLoad(true);
    api(`schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${tab}&order=start_time.asc`)
      .then(d => setSchedules(d || []))
      .catch(() => setSchedules([]))
      .finally(() => setLoad(false));
  }, [selectedPatient, tab]);

  const getScheduleForTime = (time) =>
    schedules.find(s => s.start_time <= time && s.end_time > time) || null;

  const reloadSchedules = async () => {
    if (!selectedPatient) return;
    const d = await api(`schedules?patient_name=eq.${encodeURIComponent(selectedPatient.name)}&day_type=eq.${tab}&order=start_time.asc`);
    setSchedules(d || []);
  };

  const handleSave = async (time, form, existing) => {
    setSaving(true);
    try {
      if (existing) {
        await api(`schedules?id=eq.${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ type: form.type, therapist: form.therapist, room: form.room, end_time: form.end_time }),
        });
      } else {
        await api("schedules", {
          method: "POST",
          body: JSON.stringify({
            patient_name: selectedPatient.name,
            day_type: tab,
            start_time: time,
            end_time: form.end_time,
            type: form.type,
            therapist: form.therapist,
            room: form.room,
          }),
        });
      }
      await reloadSchedules();
      flash("저장되었습니다 ✓");
    } catch (e) {
      console.error(e);
      flash("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await api(`schedules?id=eq.${id}`, { method: "DELETE" });
      await reloadSchedules();
      flash("삭제되었습니다");
    } catch (e) {
      console.error(e);
      flash("삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPatient = async () => {
    if (!newPatient.name.trim() || !newPatient.password.trim()) return;
    setSaving(true);
    try {
      await api("users", {
        method: "POST",
        body: JSON.stringify({
          name: newPatient.name.trim(),
          password: newPatient.password.trim(),
          room: newPatient.room.trim(),
          role: "patient",
        }),
      });
      // 500ms 대기 후 목록 다시 불러오기
      await new Promise(r => setTimeout(r, 500));
      await loadPatients();
      setNewPatient({ name: "", password: "", room: "" });
      setShowAddPatient(false);
      flash("환자가 추가되었습니다 ✓");
    } catch (e) {
      console.error(e);
      flash("추가 실패 - 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
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
    } catch (e) {
      console.error(e);
      flash("삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  const smallInp = { width: "100%", padding: "6px 8px", borderRadius: 6, border: "1.5px solid #DDE6EE", fontSize: 12, marginBottom: 5, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: "Apple SD Gothic Neo, sans-serif" }}>
      {/* 헤더 */}
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
              <button
                onClick={() => setShowAddPatient(p => !p)}
                style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 6, color: "#fff", width: 26, height: 26, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>+</button>
            </div>

            {showAddPatient && (
              <div style={{ padding: 10, background: "#FFFDE7", borderBottom: "1px solid #F0F4F8" }}>
                <input
                  value={newPatient.name}
                  onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))}
                  placeholder="이름 *"
                  style={smallInp}
                />
                <input
                  value={newPatient.password}
                  onChange={e => setNewPatient(p => ({ ...p, password: e.target.value }))}
                  placeholder="병록번호(비밀번호) *"
                  style={smallInp}
                />
                <input
                  value={newPatient.room}
                  onChange={e => setNewPatient(p => ({ ...p, room: e.target.value }))}
                  placeholder="병실 (선택)"
                  style={smallInp}
                />
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={handleAddPatient}
                    disabled={saving}
                    style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: saving ? "#aaa" : "#2E7D9F", color: "#fff", fontSize: 11, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "추가 중..." : "추가"}
                  </button>
                  <button
                    onClick={() => { setShowAddPatient(false); setNewPatient({ name: "", password: "", room: "" }); }}
                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #DDE6EE", background: "#fff", fontSize: 11, cursor: "pointer" }}>취소</button>
                </div>
              </div>
            )}

            {patients.length === 0 && !showAddPatient && (
              <p style={{ textAlign: "center", color: "#7A8FA0", padding: 20, fontSize: 12 }}>환자 없음</p>
            )}

            {patients.map(p => (
              <div
                key={p.id}
                style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #F0F4F8", background: selectedPatient && selectedPatient.id === p.id ? "#E8F4F8" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => setSelectedPatient(p)}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: selectedPatient && selectedPatient.id === p.id ? 700 : 500, color: selectedPatient && selectedPatient.id === p.id ? "#2E7D9F" : "#1A2B3C" }}>{p.name}</div>
                  {p.room && <div style={{ fontSize: 10, color: "#7A8FA0" }}>{p.room}</div>}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDeletePatient(p); }}
                  style={{ background: "none", border: "none", color: "#ccc", fontSize: 14, cursor: "pointer", padding: "2px 4px" }}>✕</button>
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
              <div style={{ background: "#2E7D9F", color: "#fff", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{selectedPatient.name} 시간표 편집</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["weekday", "평일"], ["weekend", "주말"]].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: tab === k ? "#fff" : "rgba(255,255,255,0.2)", color: tab === k ? "#2E7D9F" : "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{l}</button>
                  ))}
                </div>
              </div>
              {load ? (
                <p style={{ textAlign: "center", color: "#7A8FA0", padding: 30 }}>불러오는 중...</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      <th style={{ padding: "10px 8px", fontSize: 12, fontWeight: 700, color: "#7A8FA0", width: "22%", textAlign: "center", borderBottom: "2px solid #EEF2F7" }}>시간</th>
                      <th style={{ padding: "10px 8px", fontSize: 12, fontWeight: 700, color: "#7A8FA0", textAlign: "center", borderBottom: "2px solid #EEF2F7" }}>치료 내용 (클릭하여 편집)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIMES.map((time, i) => {
                      const s = getScheduleForTime(time);
                      return (
                        <tr key={time}>
                          <td style={{ padding: "8px 10px", fontSize: 12, color: "#7A8FA0", fontWeight: 600, textAlign: "center", borderBottom: "1px solid #F0F4F8", background: i % 2 === 0 ? "#fff" : "#FAFBFC" }}>{time}</td>
                          <ScheduleCell time={time} schedule={s} onSave={handleSave} onDelete={handleDelete} />
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
  return user
    ? user.role === "admin"
      ? <Admin user={user} onLogout={() => setUser(null)} />
      : <Patient user={user} onLogout={() => setUser(null)} />
    : <Login onLogin={setUser} />;
}
