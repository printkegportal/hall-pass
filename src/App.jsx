import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const DESTINATIONS = [
  "Bathroom",
  "Water Fountain",
  "Nurse",
  "Library",
  "Counselor",
  "Other Classroom",
  "IT",
  "Administrator Office",
];

// Only these destinations trigger the 10-minute timer warning
const TIMED_DESTINATIONS = ["Bathroom", "Water Fountain"];
const FLAG_MINUTES = 10;

const SB_URL = "https://yzdeyaxjvfiqlagfmttv.supabase.co";
const SB_KEY = "sb_publishable_uw1fX_S-caaqiXsLi2ufeA_wnR7hUcP";
const APP_USER = "melissamoore16@gmail.com";
const APP_PASS = "zombie";
const supabaseClient = createClient(SB_URL, SB_KEY);

function isTimed(destination) { return TIMED_DESTINATIONS.includes(destination); }
function formatTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function formatDate(ts) { return new Date(ts).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
function elapsedMins(timeOut) { return Math.floor((Date.now() - new Date(timeOut)) / 60000); }

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  blue:       "#0e46b9",
  blueDark:   "#0a3490",
  blueLight:  "#2d5fd4",
  gray:       "#868686",
  grayDark:   "#444444",
  grayLight:  "#d0d0d0",
  grayBg:     "#f4f5f7",
  white:      "#ffffff",
  text:       "#1a1a1a",
  textLight:  "#555555",
  border:     "#cccccc",
  red:        "#c0392b",
  redBg:      "#fdf0ef",
  green:      "#1a7a3a",
  greenBg:    "#eef7f1",
};

const inputStyle = {
  background: C.white,
  border: `1.5px solid ${C.border}`,
  borderRadius: 7,
  padding: "9px 13px",
  color: C.text,
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

const btnPrimary = {
  background: C.blue,
  border: "none",
  borderRadius: 7,
  color: C.white,
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  padding: "9px 18px",
  letterSpacing: 0.3,
};

const btnSecondary = {
  background: C.white,
  border: `1.5px solid ${C.border}`,
  borderRadius: 7,
  color: C.grayDark,
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontWeight: 500,
  fontSize: 12,
  cursor: "pointer",
  padding: "7px 12px",
};

const btnDanger = {
  background: C.white,
  border: `1.5px solid #e0b0b0`,
  borderRadius: 7,
  color: C.red,
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontWeight: 500,
  fontSize: 12,
  cursor: "pointer",
  padding: "7px 12px",
};

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (email.trim() === APP_USER && password === APP_PASS) {
      localStorage.setItem("logged_in", "1");
      onLogin();
    } else {
      setError("Incorrect email or password.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.grayBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif", padding: 20 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 40, width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: C.blue, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>🏫</div>
          <div style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Hall Pass Tracker</div>
          <div style={{ color: C.gray, fontSize: 14 }}>Sign in to continue</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: C.grayDark, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="your@email.com" style={inputStyle} />
          </div>
          <div>
            <label style={{ color: C.grayDark, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              type="password" placeholder="••••••••" style={inputStyle} />
          </div>
          {error && <div style={{ color: C.red, fontSize: 13, background: C.redBg, border: `1px solid #e0b0b0`, borderRadius: 7, padding: "9px 13px" }}>{error}</div>}
          <button onClick={handleLogin} style={{ ...btnPrimary, marginTop: 6, padding: "12px", fontSize: 14, fontWeight: 700 }}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem("logged_in") === "1");
  const [teacherName, setTeacherName] = useState(localStorage.getItem("teacher_name") || "Mrs. Moore");
  const [editingSetup, setEditingSetup] = useState(false);
  const [tab, setTab] = useState("dashboard");

  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(localStorage.getItem("active_class_id") || null);
  const activeClass = classes.find(c => c.id === activeClassId) || null;

  const [classStudents, setClassStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [currentOut, setCurrentOut] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedDest, setSelectedDest] = useState(DESTINATIONS[0]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [printPass, setPrintPass] = useState(null);
  const [tick, setTick] = useState(0);

  const sb = supabaseClient;

  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 15000); return () => clearInterval(i); }, []);

  const loadClasses = useCallback(async () => {
    const { data } = await sb.from("classes").select("*").order("name");
    setClasses(data || []);
  }, []);

  const loadAllStudents = useCallback(async () => {
    const { data } = await sb.from("students").select("*").order("name");
    setAllStudents(data || []);
  }, []);

  const loadClassStudents = useCallback(async () => {
    if (!activeClassId) { setClassStudents([]); return; }
    const { data } = await sb.from("class_students")
      .select("student_id, students(id, name)").eq("class_id", activeClassId);
    const sorted = (data || []).map(r => r.students).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    setClassStudents(sorted);
  }, [activeClassId]);

  const loadCurrentOut = useCallback(async () => {
    if (!activeClassId) { setCurrentOut([]); return; }
    const { data } = await sb.from("passes").select("*, students(name)")
      .eq("class_id", activeClassId).is("time_in", null).order("time_out");
    setCurrentOut(data || []);
  }, [activeClassId]);

  const loadHistory = useCallback(async () => {
    let q = sb.from("passes").select("*, students(name), classes(name)")
      .not("time_in", "is", null).order("time_out", { ascending: false }).limit(300);
    if (historyFilter === "flagged") q = q.eq("flagged", true);
    else if (historyFilter.startsWith("class:")) q = q.eq("class_id", historyFilter.replace("class:", ""));
    else if (historyFilter !== "all") q = q.eq("student_id", historyFilter);
    const { data } = await q;
    setHistory(data || []);
  }, [historyFilter]);

  useEffect(() => { loadClasses(); loadAllStudents(); }, [loadClasses, loadAllStudents]);
  useEffect(() => { loadClassStudents(); loadCurrentOut(); }, [loadClassStudents, loadCurrentOut]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  function setActiveClass(id) {
    setActiveClassId(id);
    localStorage.setItem("active_class_id", id || "");
    setSelectedStudent("");
  }

  function saveTeacherName(name) {
    setTeacherName(name);
    localStorage.setItem("teacher_name", name);
    setEditingSetup(false);
  }

  async function issuePass() {
    if (!selectedStudent || !activeClassId) return;
    const student = classStudents.find(s => s.id === selectedStudent);
    const now = new Date().toISOString();
    const { data, error } = await sb.from("passes").insert({
      student_id: student.id, student_name: student.name,
      class_id: activeClassId, destination: selectedDest,
      time_out: now, flagged: false,
    }).select("*, students(name), classes(name)").single();
    if (!error) { setPrintPass(data); setSelectedStudent(""); loadCurrentOut(); }
  }

  async function returnStudent(passId) {
    const pass = currentOut.find(p => p.id === passId);
    if (!pass) return;
    const now = new Date();
    const mins = elapsedMins(pass.time_out);
    const shouldFlag = isTimed(pass.destination) && mins >= FLAG_MINUTES;
    await sb.from("passes").update({
      time_in: now.toISOString(),
      duration_seconds: Math.floor((now - new Date(pass.time_out)) / 1000),
      flagged: shouldFlag,
    }).eq("id", passId);
    loadCurrentOut(); loadHistory();
  }

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const availableStudents = classStudents.filter(s => !currentOut.find(o => o.student_id === s.id));
  const flaggedOut = currentOut.filter(p => isTimed(p.destination) && elapsedMins(p.time_out) >= FLAG_MINUTES).length;

  return (
    <div style={{ minHeight: "100vh", background: C.grayBg, fontFamily: "system-ui, -apple-system, sans-serif", color: C.text, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: C.blue, padding: "0 24px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", minHeight: 58 }}>
        <div style={{ fontSize: 22 }}>🏫</div>
        <div style={{ flex: 1, minWidth: 140 }}>
          {editingSetup ? (
            <TeacherEdit value={teacherName} onSave={saveTeacherName} onCancel={() => setEditingSetup(false)} />
          ) : (
            <div style={{ color: C.white, fontSize: 16, fontWeight: 700 }}>{teacherName} — Hall Pass Tracker</div>
          )}
        </div>

        {classes.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Class:</span>
            <select value={activeClassId || ""} onChange={e => setActiveClass(e.target.value || null)}
              style={{ ...inputStyle, width: "auto", minWidth: 200, padding: "6px 12px", fontSize: 13, borderColor: C.blueDark, background: C.white, color: C.text }}>
              <option value="">— Select Class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <button onClick={() => setEditingSetup(!editingSetup)}
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 7, color: C.white, cursor: "pointer", padding: "6px 12px", fontSize: 13 }}>
          ⚙ Settings
        </button>
        <button onClick={() => { localStorage.removeItem("logged_in"); setLoggedIn(false); }}
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 7, color: "rgba(255,255,255,0.8)", cursor: "pointer", padding: "6px 12px", fontSize: 12 }}>
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 20px", gap: 4 }}>
        {[["dashboard", "Dashboard"], ["history", "History"], ["classes", "Classes"], ["roster", "Roster"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: "none", border: "none",
            borderBottom: tab === id ? `3px solid ${C.blue}` : "3px solid transparent",
            color: tab === id ? C.blue : C.gray,
            fontFamily: "inherit", fontSize: 13, fontWeight: tab === id ? 700 : 500,
            padding: "14px 16px", cursor: "pointer",
          }}>{label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {flaggedOut > 0 && (
            <span style={{ background: C.redBg, border: `1px solid #e0b0b0`, borderRadius: 6, padding: "3px 10px", fontSize: 12, color: C.red, fontWeight: 600 }}>
              ⚠ {flaggedOut} over {FLAG_MINUTES}min
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.gray }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: currentOut.length > 0 ? "#e74c3c" : "#27ae60", display: "inline-block" }} />
            {currentOut.length} out
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>

        {tab === "dashboard" && (
          <Dashboard
            activeClass={activeClass} classes={classes}
            availableStudents={availableStudents} currentOut={currentOut}
            selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent}
            selectedDest={selectedDest} setSelectedDest={setSelectedDest}
            issuePass={issuePass} returnStudent={returnStudent}
            setPrintPass={setPrintPass} tick={tick} onSelectClass={setActiveClass}
          />
        )}
        {tab === "history" && (
          <HistoryTab history={history} historyFilter={historyFilter}
            setHistoryFilter={setHistoryFilter} allStudents={allStudents} classes={classes} />
        )}
        {tab === "classes" && (
          <ClassesTab classes={classes} allStudents={allStudents}
            onRefresh={() => { loadClasses(); loadAllStudents(); loadClassStudents(); }} />
        )}
        {tab === "roster" && (
          <RosterTab allStudents={allStudents} classes={classes}
            currentOut={currentOut} onRefresh={() => { loadAllStudents(); loadClassStudents(); }} />
        )}
      </div>

      {printPass && (
        <PrintPassModal pass={printPass} teacherName={teacherName}
          className={activeClass?.name || ""} onClose={() => setPrintPass(null)} />
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ activeClass, classes, availableStudents, currentOut, selectedStudent, setSelectedStudent, selectedDest, setSelectedDest, issuePass, returnStudent, setPrintPass, tick, onSelectClass }) {
  if (!activeClass) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗂</div>
        <div style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No class selected</div>
        <div style={{ color: C.gray, fontSize: 14, marginBottom: 24 }}>Pick a class from the dropdown above, or create one in the Classes tab first.</div>
        {classes.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {classes.map(c => (
              <button key={c.id} onClick={() => onSelectClass(c.id)} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 14 }}>{c.name}</button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Issue Pass card */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>
          Issue Pass — {activeClass.name}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
            style={{ ...inputStyle, flex: 2, minWidth: 180 }}>
            <option value="">— Select Student —</option>
            {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={selectedDest} onChange={e => setSelectedDest(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 160 }}>
            {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
          </select>
          <button onClick={issuePass} disabled={!selectedStudent} style={{
            ...btnPrimary,
            opacity: selectedStudent ? 1 : 0.4,
            cursor: selectedStudent ? "pointer" : "not-allowed",
            whiteSpace: "nowrap", padding: "9px 22px", fontSize: 14
          }}>🖨 Issue Pass</button>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: C.gray }}>
          {availableStudents.length} of {availableStudents.length + currentOut.length} students available
          {!TIMED_DESTINATIONS.includes(selectedDest) && selectedDest && (
            <span style={{ marginLeft: 12, color: C.blueLight, fontWeight: 500 }}>⏱ No timer for {selectedDest}</span>
          )}
        </div>
      </div>

      {/* Currently Out */}
      <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
        Currently Out — {currentOut.length} student{currentOut.length !== 1 ? "s" : ""}
      </div>

      {currentOut.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.grayLight, border: `1.5px dashed ${C.border}`, borderRadius: 12, fontSize: 14 }}>
          ✓ All students are in class
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {currentOut.map(pass => {
            const mins = elapsedMins(pass.time_out);
            const timed = isTimed(pass.destination);
            const isLong = timed && mins >= FLAG_MINUTES;
            return (
              <div key={pass.id} style={{
                background: isLong ? C.redBg : C.white,
                border: `1px solid ${isLong ? "#e0b0b0" : C.border}`,
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 14,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
              }}>
                <div style={{ fontSize: 24 }}>🚶</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isLong ? C.red : C.text }}>
                    {pass.students?.name || pass.student_name}
                  </div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
                    {pass.destination} · Out at {formatTime(pass.time_out)}
                    {!timed && <span style={{ marginLeft: 8, color: C.blueLight }}>· no timer</span>}
                  </div>
                </div>
                {timed ? (
                  <div style={{ textAlign: "center", minWidth: 52 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: isLong ? C.red : C.blue }}>{mins}m</div>
                    {isLong && <div style={{ fontSize: 10, color: C.red, fontWeight: 600 }}>LONG</div>}
                  </div>
                ) : (
                  <div style={{ minWidth: 52, textAlign: "center", fontSize: 11, color: C.grayLight }}>—</div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setPrintPass(pass)} style={{ ...btnSecondary, padding: "6px 10px" }} title="Reprint">🖨</button>
                  <button onClick={() => returnStudent(pass.id)} style={{
                    background: C.greenBg, border: `1px solid #90d0a8`, borderRadius: 7,
                    color: C.green, cursor: "pointer", padding: "6px 14px",
                    fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                  }}>Returned</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ history, historyFilter, setHistoryFilter, allStudents, classes }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = history.filter(entry => {
    if (!dateFrom && !dateTo) return true;
    const d = new Date(entry.time_out);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, flex: 1 }}>Pass History</div>
        <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}
          style={{ ...inputStyle, width: "auto", minWidth: 220 }}>
          <option value="all">All Classes & Students</option>
          <option value="flagged">⚠ Flagged (10+ min) Only</option>
          <optgroup label="── Filter by Class">
            {classes.map(c => <option key={c.id} value={`class:${c.id}`}>{c.name}</option>)}
          </optgroup>
          <optgroup label="── Filter by Student">
            {allStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </optgroup>
        </select>
      </div>
      {/* Date range */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: C.gray, fontWeight: 600 }}>Date:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ ...inputStyle, width: "auto", fontSize: 13, padding: "7px 12px" }} />
        <span style={{ fontSize: 13, color: C.gray }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ ...inputStyle, width: "auto", fontSize: 13, padding: "7px 12px" }} />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }}
            style={{ ...btnSecondary, padding: "7px 12px", fontSize: 12 }}>Clear</button>
        )}
        <span style={{ fontSize: 12, color: C.gray, marginLeft: 4 }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.grayLight, border: `1.5px dashed ${C.border}`, borderRadius: 12 }}>No records found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(entry => {
            const mins = entry.duration_seconds ? Math.floor(entry.duration_seconds / 60) : 0;
            const secs = entry.duration_seconds ? entry.duration_seconds % 60 : 0;
            return (
              <div key={entry.id} style={{
                background: entry.flagged ? C.redBg : C.white,
                border: `1px solid ${entry.flagged ? "#e0b0b0" : C.border}`,
                borderRadius: 10, padding: "12px 18px",
                display: "grid", gridTemplateColumns: "1fr auto auto auto",
                alignItems: "center", gap: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: entry.flagged ? C.red : C.text }}>
                    {entry.flagged && "⚠ "}{entry.students?.name || entry.student_name}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                    {entry.destination} · {entry.classes?.name || ""} · {formatDate(entry.time_out)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: C.grayLight, fontWeight: 600 }}>OUT</div>
                  <div style={{ fontSize: 13, color: C.textLight }}>{formatTime(entry.time_out)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: C.grayLight, fontWeight: 600 }}>IN</div>
                  <div style={{ fontSize: 13, color: C.textLight }}>{entry.time_in ? formatTime(entry.time_in) : "—"}</div>
                </div>
                <div style={{
                  background: entry.flagged ? "#fce8e6" : C.greenBg,
                  border: `1px solid ${entry.flagged ? "#e0b0b0" : "#90d0a8"}`,
                  borderRadius: 8, padding: "4px 10px", textAlign: "center", minWidth: 70
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: entry.flagged ? C.red : C.green }}>
                    {entry.duration_seconds ? `${mins}m ${secs}s` : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Classes Tab ──────────────────────────────────────────────────────────────
function ClassesTab({ classes, allStudents, onRefresh }) {
  const [newClassName, setNewClassName] = useState("");
  const [expandedClass, setExpandedClass] = useState(null);
  const [classStudentMap, setClassStudentMap] = useState({});
  const [editingClass, setEditingClass] = useState(null);
  const sb = supabaseClient;

  async function loadClassStudents(classId) {
    const { data } = await sb.from("class_students").select("student_id").eq("class_id", classId);
    setClassStudentMap(prev => ({ ...prev, [classId]: (data || []).map(r => r.student_id) }));
  }

  async function addClass() {
    const name = newClassName.trim();
    if (!name) return;
    await sb.from("classes").insert({ name });
    setNewClassName(""); onRefresh();
  }

  async function deleteClass(id) {
    if (!confirm("Delete this class? Students and pass history are kept.")) return;
    await sb.from("classes").delete().eq("id", id);
    onRefresh();
  }

  async function saveClassName(id, name) {
    await sb.from("classes").update({ name }).eq("id", id);
    setEditingClass(null); onRefresh();
  }

  async function toggleStudent(classId, studentId, enrolled) {
    if (enrolled) {
      await sb.from("class_students").delete().eq("class_id", classId).eq("student_id", studentId);
    } else {
      await sb.from("class_students").insert({ class_id: classId, student_id: studentId });
    }
    loadClassStudents(classId);
  }

  function handleExpand(classId) {
    if (expandedClass === classId) { setExpandedClass(null); return; }
    setExpandedClass(classId);
    loadClassStudents(classId);
  }

  return (
    <>
      <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>
        Classes / Periods — {classes.length} total
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input value={newClassName} onChange={e => setNewClassName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addClass()}
          placeholder="e.g. Period 1 — 8th Grade English"
          style={{ ...inputStyle, flex: 1 }} />
        <button onClick={addClass} style={{ ...btnPrimary, padding: "9px 18px" }}>+ Add Class</button>
      </div>
      {classes.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.grayLight, border: `1.5px dashed ${C.border}`, borderRadius: 12 }}>
          No classes yet — add your first period above
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {classes.map(cls => {
            const enrolled = classStudentMap[cls.id] || [];
            const isExpanded = expandedClass === cls.id;
            const isEditing = editingClass?.id === cls.id;
            return (
              <div key={cls.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: C.blue, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🗂</div>
                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input value={editingClass.name} onChange={e => setEditingClass({ ...editingClass, name: e.target.value })}
                          onKeyDown={e => e.key === "Enter" && saveClassName(cls.id, editingClass.name)}
                          style={{ ...inputStyle, padding: "5px 10px", fontSize: 13 }} autoFocus />
                        <button onClick={() => saveClassName(cls.id, editingClass.name)} style={{ ...btnPrimary, padding: "5px 12px" }}>Save</button>
                        <button onClick={() => setEditingClass(null)} style={{ ...btnSecondary, padding: "5px 10px" }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{cls.name}</div>
                        {isExpanded && enrolled.length > 0 && (
                          <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{enrolled.length} student{enrolled.length !== 1 ? "s" : ""} enrolled</div>
                        )}
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleExpand(cls.id)} style={{
                        ...btnSecondary, padding: "6px 12px", fontSize: 12,
                        color: isExpanded ? C.blue : C.grayDark,
                        borderColor: isExpanded ? C.blue : C.border
                      }}>{isExpanded ? "▲ Hide" : "▼ Students"}</button>
                      <button onClick={() => setEditingClass(cls)} style={{ ...btnSecondary, padding: "6px 10px" }}>✏️</button>
                      <button onClick={() => deleteClass(cls.id)} style={{ ...btnDanger, padding: "6px 10px" }}>🗑</button>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 18px", background: C.grayBg }}>
                    <div style={{ fontSize: 11, color: C.gray, fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Check students to enroll in this class
                    </div>
                    {allStudents.length === 0 ? (
                      <div style={{ color: C.gray, fontSize: 13 }}>No students yet — add them in the Roster tab first.</div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                        {allStudents.map(s => {
                          const isEnrolled = enrolled.includes(s.id);
                          return (
                            <label key={s.id} style={{
                              display: "flex", alignItems: "center", gap: 8,
                              background: isEnrolled ? "#e8f0fd" : C.white,
                              border: `1px solid ${isEnrolled ? C.blue : C.border}`,
                              borderRadius: 8, padding: "8px 12px", cursor: "pointer"
                            }}>
                              <input type="checkbox" checked={isEnrolled}
                                onChange={() => toggleStudent(cls.id, s.id, isEnrolled)}
                                style={{ accentColor: C.blue }} />
                              <span style={{ fontSize: 13, color: isEnrolled ? C.blue : C.text, fontWeight: isEnrolled ? 600 : 400 }}>{s.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Roster Tab ───────────────────────────────────────────────────────────────
function RosterTab({ allStudents, classes, currentOut, onRefresh }) {
  const [newName, setNewName] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentClasses, setStudentClasses] = useState({});
  const sb = supabaseClient;

  useEffect(() => {
    async function loadEnrollments() {
      const { data } = await sb.from("class_students").select("student_id, class_id");
      const map = {};
      (data || []).forEach(r => {
        if (!map[r.student_id]) map[r.student_id] = [];
        map[r.student_id].push(r.class_id);
      });
      setStudentClasses(map);
    }
    loadEnrollments();
  }, [allStudents]);

  async function addStudent() {
    const name = newName.trim();
    if (!name) return;
    await sb.from("students").insert({ name });
    setNewName(""); onRefresh();
  }

  async function saveEdit() {
    if (!editingStudent?.name?.trim()) return;
    await sb.from("students").update({ name: editingStudent.name.trim() }).eq("id", editingStudent.id);
    setEditingStudent(null); onRefresh();
  }

  async function deleteStudent(id) {
    if (!confirm("Remove this student? Their pass history will be kept.")) return;
    await sb.from("students").delete().eq("id", id);
    onRefresh();
  }

  return (
    <>
      <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>
        Global Roster — {allStudents.length} students
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addStudent()}
          placeholder="Add student name..."
          style={{ ...inputStyle, flex: 1 }} />
        <button onClick={addStudent} style={{ ...btnPrimary, padding: "9px 18px" }}>+ Add</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {allStudents.map(s => {
          const isOut = currentOut.find(o => o.student_id === s.id);
          const isEditing = editingStudent?.id === s.id;
          const enrolledIn = (studentClasses[s.id] || []).map(cid => classes.find(c => c.id === cid)?.name).filter(Boolean);
          return (
            <div key={s.id} style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "11px 16px",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOut ? "#27ae60" : C.grayLight, flexShrink: 0 }} />
              {isEditing ? (
                <>
                  <input value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && saveEdit()}
                    style={{ ...inputStyle, flex: 1, padding: "4px 8px", fontSize: 13 }} autoFocus />
                  <button onClick={saveEdit} style={{ ...btnPrimary, padding: "4px 12px", fontSize: 12 }}>Save</button>
                  <button onClick={() => setEditingStudent(null)} style={{ ...btnSecondary, padding: "4px 8px" }}>✕</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.name}</div>
                    {enrolledIn.length > 0 && (
                      <div style={{ fontSize: 11, color: C.gray, marginTop: 1 }}>{enrolledIn.join(" · ")}</div>
                    )}
                  </div>
                  {isOut && <span style={{ fontSize: 11, color: "#27ae60", fontWeight: 600, background: C.greenBg, border: "1px solid #90d0a8", borderRadius: 5, padding: "2px 7px" }}>OUT</span>}
                  <button onClick={() => setEditingStudent(s)} style={{ ...btnSecondary, padding: "5px 9px" }}>✏️</button>
                  <button onClick={() => deleteStudent(s.id)} style={{ ...btnDanger, padding: "5px 9px" }}>🗑</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Teacher name edit ────────────────────────────────────────────────────────
function TeacherEdit({ value, onSave, onCancel }) {
  const [name, setName] = useState(value);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSave(name)}
        style={{ ...inputStyle, padding: "4px 10px", fontSize: 14, width: 220, background: "rgba(255,255,255,0.15)", color: C.white, borderColor: "rgba(255,255,255,0.3)" }} autoFocus />
      <button onClick={() => onSave(name)} style={{ ...btnSecondary, background: "rgba(255,255,255,0.2)", color: C.white, borderColor: "rgba(255,255,255,0.3)", padding: "4px 12px" }}>Save</button>
      <button onClick={onCancel} style={{ ...btnSecondary, background: "transparent", color: "rgba(255,255,255,0.6)", borderColor: "transparent", padding: "4px 8px" }}>✕</button>
    </div>
  );
}

// ─── Print Pass — 4x6 landscape thermal label, black & white ─────────────────
function PrintPassModal({ pass, teacherName, className, onClose }) {
  const studentName = pass.students?.name || pass.student_name;

  useEffect(() => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Hall Pass</title>
  <style>
    @page {
      size: 6in 4in;
      margin: 0.15in;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 5.7in;
      height: 3.7in;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
      overflow: hidden;
    }
    .pass {
      width: 100%;
      height: 100%;
      border: 2.5px solid #000;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .school-bar {
      background: #fff;
      color: #000;
      text-align: center;
      padding: 5px 16px;
      font-size: 13pt;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
    }
    .header {
      background: #fff;
      color: #000;
      padding: 7px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #000;
    }
    .header-title { font-size: 10pt; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #000; }
    .header-class { font-size: 15pt; font-weight: 800; margin-top: 1px; color: #000; }
    .header-right { text-align: right; }
    .header-label { font-size: 9pt; letter-spacing: 1px; text-transform: uppercase; color: #000; }
    .header-teacher { font-size: 14pt; font-weight: 700; color: #000; }
    .body {
      flex: 1;
      padding: 8px 16px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px 14px;
      align-content: start;
      background: #fff;
    }
    .field-student { grid-column: 1 / -1; }
    .field-label {
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #000;
      margin-bottom: 2px;
    }
    .field-value {
      font-size: 17pt;
      font-weight: 800;
      border-bottom: 2px solid #000;
      padding-bottom: 2px;
      min-height: 28px;
      line-height: 1.1;
      color: #000;
    }
    .field-value.small { font-size: 14pt; font-weight: 700; color: #000; }
    .footer {
      border-top: 2px solid #000;
      padding: 6px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
    }
    .footer-msg {
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #000;
    }
    .sig-area { display: flex; gap: 20px; }
    .sig { text-align: center; }
    .sig-line {
      width: 160px;
      border-bottom: 2px solid #000;
      margin-bottom: 2px;
      height: 18px;
    }
    .sig-label { font-size: 9pt; font-weight: 600; color: #000; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="pass">
    <div class="school-bar">Bridges Preparatory School</div>
    <div class="header">
      <div>
        <div class="header-title">Hall Pass</div>
        <div class="header-class">${className}</div>
      </div>
      <div class="header-right">
        <div class="header-label">Teacher</div>
        <div class="header-teacher">${teacherName}</div>
      </div>
    </div>
    <div class="body">
      <div class="field-student">
        <div class="field-label">Student Name</div>
        <div class="field-value">${studentName}</div>
      </div>
      <div>
        <div class="field-label">Destination</div>
        <div class="field-value small">${pass.destination}</div>
      </div>
      <div>
        <div class="field-label">Date</div>
        <div class="field-value small">${formatDate(pass.time_out)}</div>
      </div>
      <div>
        <div class="field-label">Time Out</div>
        <div class="field-value small">${formatTime(pass.time_out)}</div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-msg">Carry this pass at all times in the hallway</div>
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-label">Teacher Signature</div>
      </div>
    </div>
  </div>
  <script>setTimeout(() => { window.print(); window.close(); }, 400);</script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=700,height=520");
    if (win) { win.document.write(html); win.document.close(); }
    onClose();
  }, []);

  return null;
}
