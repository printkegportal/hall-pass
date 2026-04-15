import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const DESTINATIONS = [
  "Bathroom", "Water Fountain", "Nurse", "Library",
  "Counselor", "Other Classroom", "IT", "Administrator Office",
];
const TIMED_DESTINATIONS = ["Bathroom", "Water Fountain"];
const FLAG_MINUTES = 10;
const SB_URL = "https://yzdeyaxjvfiqlagfmttv.supabase.co";
const SB_KEY = "sb_publishable_uw1fX_S-caaqiXsLi2ufeA_wnR7hUcP";
const ADMIN_EMAIL = "melissamoore16@gmail.com";
const sb = createClient(SB_URL, SB_KEY);

function isTimed(dest) { return TIMED_DESTINATIONS.includes(dest); }
function formatTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function formatDate(ts) { return new Date(ts).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
function formatDateShort(ts) { return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); }
function elapsedMins(t) { return Math.floor((Date.now() - new Date(t)) / 60000); }

const C = {
  blue: "#0e46b9", blueDark: "#0a3490", blueLight: "#2d5fd4",
  gray: "#868686", grayDark: "#444", grayLight: "#d0d0d0",
  grayBg: "#f4f5f7", white: "#ffffff", text: "#1a1a1a", textLight: "#555",
  border: "#cccccc", red: "#c0392b", redBg: "#fdf0ef",
  green: "#1a7a3a", greenBg: "#eef7f1",
};

const inp = {
  background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 7,
  padding: "9px 13px", color: C.text, fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none",
};
const btnP = {
  background: C.blue, border: "none", borderRadius: 7, color: C.white,
  fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 600,
  fontSize: 13, cursor: "pointer", padding: "9px 18px",
};
const btnS = {
  background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 7,
  color: C.grayDark, fontFamily: "system-ui, -apple-system, sans-serif",
  fontWeight: 500, fontSize: 12, cursor: "pointer", padding: "7px 12px",
};
const btnD = {
  background: C.white, border: "1.5px solid #e0b0b0", borderRadius: 7,
  color: C.red, fontFamily: "system-ui, -apple-system, sans-serif",
  fontWeight: 500, fontSize: 12, cursor: "pointer", padding: "7px 12px",
};

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setError("");
    const { data, error: e } = await sb.from("teachers")
      .select("*").eq("email", email.trim().toLowerCase()).eq("password", password).single();
    if (e || !data) {
      setError("Incorrect email or password.");
    } else {
      localStorage.setItem("teacher_id", data.id);
      onLogin(data);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.grayBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif", padding: 20 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 40, width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: C.blue, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>🏫</div>
          <div style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Hall Pass Tracker</div>
          <div style={{ color: C.gray, fontSize: 14 }}>Bridges Preparatory School</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: C.grayDark, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="your@email.com" style={inp} />
          </div>
          <div>
            <label style={{ color: C.grayDark, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} type="password" placeholder="••••••••" style={inp} />
          </div>
          {error && <div style={{ color: C.red, fontSize: 13, background: C.redBg, border: "1px solid #e0b0b0", borderRadius: 7, padding: "9px 13px" }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ ...btnP, marginTop: 6, padding: 12, fontSize: 14, fontWeight: 700 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");

  const [allStudents, setAllStudents] = useState([]);
  const [currentOut, setCurrentOut] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null); // {id, name}
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedDest, setSelectedDest] = useState(DESTINATIONS[0]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [printPass, setPrintPass] = useState(null);
  const [studentHistoryModal, setStudentHistoryModal] = useState(null);
  const [tick, setTick] = useState(0);

  const isAdmin = teacher?.email === ADMIN_EMAIL;

  // Auto-login from localStorage
  useEffect(() => {
    async function tryAutoLogin() {
      const id = localStorage.getItem("teacher_id");
      if (id) {
        const { data } = await sb.from("teachers").select("*").eq("id", id).single();
        if (data) setTeacher(data);
      }
      setLoading(false);
    }
    tryAutoLogin();
  }, []);

  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 15000); return () => clearInterval(i); }, []);

  const loadStudents = useCallback(async () => {
    const { data } = await sb.from("students").select("*").order("name");
    setAllStudents(data || []);
  }, []);

  const loadCurrentOut = useCallback(async () => {
    const { data } = await sb.from("passes").select("*, students(name), teachers(name, subject)")
      .is("time_in", null).order("time_out");
    setCurrentOut(data || []);
  }, []);

  const loadHistory = useCallback(async () => {
    let q = sb.from("passes").select("*, students(name), teachers(name, subject)")
      .not("time_in", "is", null).order("time_out", { ascending: false }).limit(500);
    if (historyFilter === "flagged") q = q.eq("flagged", true);
    else if (historyFilter !== "all") q = q.eq("student_id", historyFilter);
    const { data } = await q;
    setHistory(data || []);
  }, [historyFilter]);

  useEffect(() => { if (teacher) { loadStudents(); loadCurrentOut(); } }, [teacher, loadStudents, loadCurrentOut]);
  useEffect(() => { if (teacher) loadHistory(); }, [teacher, loadHistory]);

  async function issuePass() {
    if (!selectedStudent || !teacher) return;
    const now = new Date().toISOString();
    const { data, error } = await sb.from("passes").insert({
      student_id: selectedStudent.id,
      student_name: selectedStudent.name,
      teacher_id: teacher.id,
      destination: selectedDest,
      time_out: now,
      flagged: false,
    }).select("*, students(name), teachers(name, subject)").single();
    if (!error) {
      setPrintPass(data);
      setSelectedStudent(null);
      setStudentSearch("");
      loadCurrentOut();
    }
  }

  async function returnStudent(passId) {
    const pass = currentOut.find(p => p.id === passId);
    if (!pass) return;
    const now = new Date();
    const mins = elapsedMins(pass.time_out);
    await sb.from("passes").update({
      time_in: now.toISOString(),
      duration_seconds: Math.floor((now - new Date(pass.time_out)) / 1000),
      flagged: isTimed(pass.destination) && mins >= FLAG_MINUTES,
    }).eq("id", passId);
    loadCurrentOut(); loadHistory();
  }

  function signOut() {
    localStorage.removeItem("teacher_id");
    setTeacher(null);
  }

  if (loading) return <div style={{ minHeight: "100vh", background: C.grayBg, display: "flex", alignItems: "center", justifyContent: "center", color: C.gray, fontFamily: "system-ui" }}>Loading...</div>;
  if (!teacher) return <LoginScreen onLogin={t => setTeacher(t)} />;

  const flaggedOut = currentOut.filter(p => isTimed(p.destination) && elapsedMins(p.time_out) >= FLAG_MINUTES).length;
  const availableStudents = allStudents.filter(s => !currentOut.find(o => o.student_id === s.id));

  return (
    <div style={{ minHeight: "100vh", background: C.grayBg, fontFamily: "system-ui, -apple-system, sans-serif", color: C.text, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: C.blue, padding: "0 24px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", minHeight: 58 }}>
        <div style={{ fontSize: 22 }}>🏫</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.white, fontSize: 16, fontWeight: 700 }}>Hall Pass Tracker</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Bridges Preparatory School</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, textAlign: "right" }}>
          <div style={{ fontWeight: 600 }}>{teacher.name}</div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>{teacher.subject}</div>
        </div>
        <button onClick={signOut} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 7, color: "rgba(255,255,255,0.8)", cursor: "pointer", padding: "6px 12px", fontSize: 12 }}>
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 20px", gap: 4 }}>
        {[
          ["dashboard", "Dashboard"],
          ["history", "History"],
          ["roster", "Roster"],
          ["teachers", isAdmin ? "Teachers" : "My Profile"],
        ].map(([id, label]) => (
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
            <span style={{ background: C.redBg, border: "1px solid #e0b0b0", borderRadius: 6, padding: "3px 10px", fontSize: 12, color: C.red, fontWeight: 600 }}>
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
            teacher={teacher} allStudents={allStudents} availableStudents={availableStudents}
            currentOut={currentOut} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent}
            studentSearch={studentSearch} setStudentSearch={setStudentSearch}
            selectedDest={selectedDest} setSelectedDest={setSelectedDest}
            issuePass={issuePass} returnStudent={returnStudent}
            setPrintPass={setPrintPass} tick={tick}
          />
        )}
        {tab === "history" && (
          <HistoryTab history={history} historyFilter={historyFilter}
            setHistoryFilter={setHistoryFilter} allStudents={allStudents} />
        )}
        {tab === "roster" && (
          <RosterTab allStudents={allStudents} currentOut={currentOut}
            isAdmin={isAdmin} onRefresh={loadStudents}
            onViewHistory={s => setStudentHistoryModal(s)} />
        )}
        {tab === "teachers" && (
          <TeachersTab teacher={teacher} isAdmin={isAdmin}
            onTeacherUpdated={updated => setTeacher(updated)} />
        )}
      </div>

      {printPass && (
        <PrintPassModal pass={printPass} teacher={teacher} onClose={() => setPrintPass(null)} />
      )}
      {studentHistoryModal && (
        <StudentHistoryModal student={studentHistoryModal} onClose={() => setStudentHistoryModal(null)} />
      )}
    </div>
  );
}

// ─── Typeahead Student Search ─────────────────────────────────────────────────
function StudentSearch({ availableStudents, selectedStudent, setSelectedStudent, studentSearch, setStudentSearch }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const matches = studentSearch.length > 0
    ? availableStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 10)
    : [];

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(s) {
    setSelectedStudent(s);
    setStudentSearch(s.name);
    setOpen(false);
  }

  function handleInput(e) {
    setStudentSearch(e.target.value);
    setSelectedStudent(null);
    setOpen(true);
  }

  return (
    <div ref={ref} style={{ position: "relative", flex: 2, minWidth: 200 }}>
      <input
        value={studentSearch}
        onChange={handleInput}
        onFocus={() => studentSearch && setOpen(true)}
        placeholder="Search student name..."
        style={{ ...inp, borderColor: selectedStudent ? C.blue : C.border }}
      />
      {selectedStudent && (
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.blue, fontSize: 16 }}>✓</div>
      )}
      {open && matches.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: C.white, border: `1.5px solid ${C.blue}`, borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto"
        }}>
          {matches.map(s => (
            <div key={s.id} onMouseDown={() => select(s)} style={{
              padding: "10px 14px", cursor: "pointer", fontSize: 14,
              borderBottom: `1px solid ${C.border}`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#e8f0fd"}
              onMouseLeave={e => e.currentTarget.style.background = C.white}
            >{s.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ teacher, allStudents, availableStudents, currentOut, selectedStudent, setSelectedStudent, studentSearch, setStudentSearch, selectedDest, setSelectedDest, issuePass, returnStudent, setPrintPass, tick }) {
  return (
    <>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>Issue Pass</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StudentSearch
            availableStudents={availableStudents}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
          />
          <select value={selectedDest} onChange={e => setSelectedDest(e.target.value)} style={{ ...inp, flex: 1, minWidth: 160 }}>
            {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
          </select>
          <button onClick={issuePass} disabled={!selectedStudent} style={{
            ...btnP, opacity: selectedStudent ? 1 : 0.4,
            cursor: selectedStudent ? "pointer" : "not-allowed",
            whiteSpace: "nowrap", padding: "9px 22px", fontSize: 14
          }}>🖨 Issue Pass</button>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: C.gray }}>
          {availableStudents.length} of {allStudents.length} students available
          {selectedDest && !TIMED_DESTINATIONS.includes(selectedDest) && (
            <span style={{ marginLeft: 12, color: C.blueLight, fontWeight: 500 }}>⏱ No timer for {selectedDest}</span>
          )}
        </div>
      </div>

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
                    {pass.teachers && <span style={{ marginLeft: 8, color: C.blueLight }}>· {pass.teachers.name}</span>}
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
                  <button onClick={() => setPrintPass(pass)} style={{ ...btnS, padding: "6px 10px" }} title="Reprint">🖨</button>
                  <button onClick={() => returnStudent(pass.id)} style={{
                    background: C.greenBg, border: "1px solid #90d0a8", borderRadius: 7,
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
function HistoryTab({ history, historyFilter, setHistoryFilter, allStudents }) {
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
        <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ ...inp, width: "auto", minWidth: 220 }}>
          <option value="all">All Students</option>
          <option value="flagged">⚠ Flagged (10+ min) Only</option>
          <optgroup label="── Filter by Student">
            {allStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </optgroup>
        </select>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: C.gray, fontWeight: 600 }}>Date:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inp, width: "auto", fontSize: 13, padding: "7px 12px" }} />
        <span style={{ fontSize: 13, color: C.gray }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inp, width: "auto", fontSize: 13, padding: "7px 12px" }} />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} style={{ ...btnS, padding: "7px 12px", fontSize: 12 }}>Clear</button>
        )}
        <span style={{ fontSize: 12, color: C.gray }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
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
                alignItems: "center", gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: entry.flagged ? C.red : C.text }}>
                    {entry.flagged && "⚠ "}{entry.students?.name || entry.student_name}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                    {entry.destination}
                    {entry.teachers && ` · ${entry.teachers.name}`}
                    {` · ${formatDateShort(entry.time_out)}`}
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

// ─── Roster Tab ───────────────────────────────────────────────────────────────
function RosterTab({ allStudents, currentOut, isAdmin, onRefresh, onViewHistory }) {
  const [newName, setNewName] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = allStudents.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

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
        Student Roster — {allStudents.length} students
      </div>
      {isAdmin && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addStudent()}
            placeholder="Add student name..." style={{ ...inp, flex: 1 }} />
          <button onClick={addStudent} style={{ ...btnP, padding: "9px 18px" }}>+ Add</button>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." style={{ ...inp, maxWidth: 300 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(s => {
          const isOut = currentOut.find(o => o.student_id === s.id);
          const isEditing = editingStudent?.id === s.id;
          return (
            <div key={s.id} style={{
              background: C.white, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "11px 16px",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOut ? "#27ae60" : C.grayLight, flexShrink: 0 }} />
              {isEditing ? (
                <>
                  <input value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && saveEdit()}
                    style={{ ...inp, flex: 1, padding: "4px 8px", fontSize: 13 }} autoFocus />
                  <button onClick={saveEdit} style={{ ...btnP, padding: "4px 12px", fontSize: 12 }}>Save</button>
                  <button onClick={() => setEditingStudent(null)} style={{ ...btnS, padding: "4px 8px" }}>✕</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <button onClick={() => onViewHistory(s)} style={{
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      fontSize: 14, fontWeight: 600, color: C.blue, textDecoration: "underline",
                      fontFamily: "inherit", textAlign: "left"
                    }}>{s.name}</button>
                  </div>
                  {isOut && <span style={{ fontSize: 11, color: "#27ae60", fontWeight: 600, background: C.greenBg, border: "1px solid #90d0a8", borderRadius: 5, padding: "2px 7px" }}>OUT</span>}
                  {isAdmin && <>
                    <button onClick={() => setEditingStudent(s)} style={{ ...btnS, padding: "5px 9px" }}>✏️</button>
                    <button onClick={() => deleteStudent(s.id)} style={{ ...btnD, padding: "5px 9px" }}>🗑</button>
                  </>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Student History Modal ────────────────────────────────────────────────────
function StudentHistoryModal({ student, onClose }) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await sb.from("passes")
        .select("*, teachers(name, subject)")
        .eq("student_id", student.id)
        .order("time_out", { ascending: false });
      setPasses(data || []);
      setLoading(false);
    }
    load();
  }, [student.id]);

  const total = passes.length;
  const flagged = passes.filter(p => p.flagged).length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
        {/* Modal header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{student.name}</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
              {total} pass{total !== 1 ? "es" : ""} total
              {flagged > 0 && <span style={{ color: C.red, marginLeft: 10 }}>⚠ {flagged} flagged</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ ...btnS, padding: "6px 12px", fontSize: 16 }}>✕</button>
        </div>
        {/* Pass list */}
        <div style={{ overflowY: "auto", padding: "16px 24px", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.gray }}>Loading...</div>
          ) : passes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.grayLight }}>No passes yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {passes.map(p => {
                const mins = p.duration_seconds ? Math.floor(p.duration_seconds / 60) : 0;
                const secs = p.duration_seconds ? p.duration_seconds % 60 : 0;
                return (
                  <div key={p.id} style={{
                    background: p.flagged ? C.redBg : C.grayBg,
                    border: `1px solid ${p.flagged ? "#e0b0b0" : C.border}`,
                    borderRadius: 10, padding: "11px 16px",
                    display: "grid", gridTemplateColumns: "1fr auto auto auto",
                    alignItems: "center", gap: 12
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: p.flagged ? C.red : C.text }}>
                        {p.flagged && "⚠ "}{p.destination}
                      </div>
                      <div style={{ fontSize: 11, color: C.gray, marginTop: 1 }}>
                        {formatDateShort(p.time_out)}
                        {p.teachers && ` · ${p.teachers.name}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: C.grayLight, fontWeight: 600 }}>OUT</div>
                      <div style={{ fontSize: 12, color: C.textLight }}>{formatTime(p.time_out)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: C.grayLight, fontWeight: 600 }}>IN</div>
                      <div style={{ fontSize: 12, color: C.textLight }}>{p.time_in ? formatTime(p.time_in) : "—"}</div>
                    </div>
                    <div style={{
                      background: p.flagged ? "#fce8e6" : C.greenBg,
                      border: `1px solid ${p.flagged ? "#e0b0b0" : "#90d0a8"}`,
                      borderRadius: 8, padding: "4px 10px", textAlign: "center", minWidth: 64
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: p.flagged ? C.red : C.green }}>
                        {p.duration_seconds ? `${mins}m ${secs}s` : p.time_in ? "—" : "Out"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Teachers Tab ─────────────────────────────────────────────────────────────
function TeachersTab({ teacher, isAdmin, onTeacherUpdated }) {
  const [teachers, setTeachers] = useState([]);
  const [newT, setNewT] = useState({ name: "", email: "", password: "", subject: "", role: "teacher" });
  const [editingT, setEditingT] = useState(null);
  const [editingSelf, setEditingSelf] = useState(null);
  const [msg, setMsg] = useState("");

  const loadTeachers = useCallback(async () => {
    const { data } = await sb.from("teachers").select("*").order("name");
    setTeachers(data || []);
  }, []);

  useEffect(() => { loadTeachers(); }, [loadTeachers]);

  async function addTeacher() {
    const { name, email, password, subject, role } = newT;
    if (!name.trim() || !email.trim() || !password.trim()) return;
    await sb.from("teachers").insert({ name: name.trim(), email: email.trim().toLowerCase(), password, subject: subject.trim(), role });
    setNewT({ name: "", email: "", password: "", subject: "", role: "teacher" });
    loadTeachers();
  }

  async function saveEdit() {
    const { id, name, email, password, subject, role } = editingT;
    await sb.from("teachers").update({ name, email: email.toLowerCase(), password, subject, role }).eq("id", id);
    setEditingT(null); loadTeachers();
  }

  async function deleteTeacher(id) {
    if (!confirm("Remove this teacher? Their pass history will be kept.")) return;
    await sb.from("teachers").delete().eq("id", id);
    loadTeachers();
  }

  async function saveSelf() {
    const { id, name, subject, password } = editingSelf;
    if (!name.trim()) return;
    const { data } = await sb.from("teachers").update({ name: name.trim(), subject: subject.trim(), password }).eq("id", id).select().single();
    if (data) { onTeacherUpdated(data); setMsg("Profile updated!"); setTimeout(() => setMsg(""), 3000); }
    setEditingSelf(null); loadTeachers();
  }

  // Non-admin: just show profile edit
  if (!isAdmin) {
    const s = editingSelf || teacher;
    return (
      <div style={{ maxWidth: 440 }}>
        <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>My Profile</div>
        {msg && <div style={{ color: C.green, background: C.greenBg, border: "1px solid #90d0a8", borderRadius: 8, padding: "9px 14px", marginBottom: 16, fontSize: 13 }}>{msg}</div>}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Name" value={s.name} onChange={v => setEditingSelf({ ...(editingSelf || teacher), name: v })} editing={!!editingSelf} />
          <Field label="Subject" value={s.subject || ""} onChange={v => setEditingSelf({ ...(editingSelf || teacher), subject: v })} editing={!!editingSelf} placeholder="e.g. ELA, Math" />
          <Field label="Email" value={s.email} editing={false} />
          <Field label="Password" value={editingSelf?.password || ""} onChange={v => setEditingSelf({ ...(editingSelf || teacher), password: v })} editing={!!editingSelf} type="password" placeholder="New password" />
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {editingSelf
              ? <><button onClick={saveSelf} style={{ ...btnP, padding: "8px 18px" }}>Save Changes</button><button onClick={() => setEditingSelf(null)} style={{ ...btnS }}>Cancel</button></>
              : <button onClick={() => setEditingSelf({ ...teacher })} style={{ ...btnP, padding: "8px 18px" }}>Edit Profile</button>
            }
          </div>
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <>
      <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Teachers — {teachers.length} total</div>

      {/* Add teacher */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, marginBottom: 12 }}>Add New Teacher</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input value={newT.name} onChange={e => setNewT({ ...newT, name: e.target.value })} placeholder="Full Name" style={inp} />
          <input value={newT.email} onChange={e => setNewT({ ...newT, email: e.target.value })} placeholder="Email" style={inp} />
          <input value={newT.password} onChange={e => setNewT({ ...newT, password: e.target.value })} placeholder="Password" style={inp} />
          <input value={newT.subject} onChange={e => setNewT({ ...newT, subject: e.target.value })} placeholder="Subject (e.g. Math, ELA)" style={inp} />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={newT.role} onChange={e => setNewT({ ...newT, role: e.target.value })} style={{ ...inp, width: "auto" }}>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={addTeacher} style={{ ...btnP, padding: "9px 18px" }}>+ Add Teacher</button>
        </div>
      </div>

      {/* Teacher list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {teachers.map(t => {
          const isEditing = editingT?.id === t.id;
          return (
            <div key={t.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {isEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input value={editingT.name} onChange={e => setEditingT({ ...editingT, name: e.target.value })} placeholder="Name" style={inp} />
                    <input value={editingT.email} onChange={e => setEditingT({ ...editingT, email: e.target.value })} placeholder="Email" style={inp} />
                    <input value={editingT.password} onChange={e => setEditingT({ ...editingT, password: e.target.value })} placeholder="Password" style={inp} />
                    <input value={editingT.subject || ""} onChange={e => setEditingT({ ...editingT, subject: e.target.value })} placeholder="Subject" style={inp} />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={editingT.role} onChange={e => setEditingT({ ...editingT, role: e.target.value })} style={{ ...inp, width: "auto" }}>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={saveEdit} style={{ ...btnP, padding: "7px 16px" }}>Save</button>
                    <button onClick={() => setEditingT(null)} style={{ ...btnS }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: t.role === "admin" ? C.blue : C.grayLight, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {t.role === "admin" ? "⭐" : "👤"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{t.name} {t.role === "admin" && <span style={{ fontSize: 10, color: C.blue, fontWeight: 700, background: "#e8f0fd", borderRadius: 4, padding: "1px 6px", marginLeft: 6 }}>ADMIN</span>}</div>
                    <div style={{ fontSize: 12, color: C.gray }}>
                      {t.email}{t.subject && ` · ${t.subject}`}
                    </div>
                  </div>
                  <button onClick={() => setEditingT(t)} style={{ ...btnS, padding: "6px 10px" }}>✏️</button>
                  {t.email !== ADMIN_EMAIL && (
                    <button onClick={() => deleteTeacher(t.id)} style={{ ...btnD, padding: "6px 10px" }}>🗑</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Field({ label, value, onChange, editing, type = "text", placeholder }) {
  return (
    <div>
      <label style={{ color: C.grayDark, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
      {editing
        ? <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || label} style={inp} />
        : <div style={{ fontSize: 14, color: C.text, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>{value || <span style={{ color: C.grayLight }}>—</span>}</div>
      }
    </div>
  );
}

// ─── Print Pass — 4x6 thermal, black & white ──────────────────────────────────
function PrintPassModal({ pass, teacher, onClose }) {
  const studentName = pass.students?.name || pass.student_name;
  const subject = teacher?.subject || pass.teachers?.subject || "";
  const teacherName = teacher?.name || pass.teachers?.name || "";

  useEffect(() => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Hall Pass</title>
  <style>
    @page { size: 6in 4in; margin: 0.15in; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 5.7in; height: 3.7in; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; overflow: hidden; }
    .pass { width: 100%; height: 100%; border: 2.5px solid #000; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; }
    .school-bar { background: #fff; color: #000; text-align: center; padding: 5px 16px; font-size: 13pt; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; border-bottom: 2px solid #000; }
    .header { background: #fff; color: #000; padding: 7px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; }
    .header-title { font-size: 10pt; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #000; }
    .header-subject { font-size: 15pt; font-weight: 800; margin-top: 1px; color: #000; }
    .header-right { text-align: right; }
    .header-label { font-size: 9pt; letter-spacing: 1px; text-transform: uppercase; color: #000; }
    .header-teacher { font-size: 14pt; font-weight: 700; color: #000; }
    .body { flex: 1; padding: 8px 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 14px; align-content: start; background: #fff; }
    .field-student { grid-column: 1 / -1; }
    .field-label { font-size: 9pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #000; margin-bottom: 2px; }
    .field-value { font-size: 17pt; font-weight: 800; border-bottom: 2px solid #000; padding-bottom: 2px; min-height: 28px; line-height: 1.1; color: #000; }
    .field-value.small { font-size: 14pt; font-weight: 700; color: #000; }
    .footer { border-top: 2px solid #000; padding: 6px 16px; display: flex; align-items: center; justify-content: space-between; background: #fff; }
    .footer-msg { font-size: 9pt; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #000; }
    .sig { text-align: center; }
    .sig-line { width: 160px; border-bottom: 2px solid #000; margin-bottom: 2px; height: 18px; }
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
        <div class="header-subject">${subject}</div>
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
