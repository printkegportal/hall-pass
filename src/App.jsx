import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const DESTINATIONS = ["Bathroom", "Nurse", "Office", "Library", "Counselor", "Water Fountain"];
const FLAG_MINUTES = 10;

function formatTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function formatDate(ts) { return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); }
function elapsedMins(timeOut) { return Math.floor((Date.now() - new Date(timeOut)) / 60000); }

const inputStyle = {
  background: "#0d1b2a", border: "1px solid #3a3a5e", borderRadius: 8,
  padding: "10px 14px", color: "#e8e0d0", fontFamily: "'Courier New', monospace",
  fontSize: 13, width: "100%", boxSizing: "border-box"
};
const btnGold = {
  background: "linear-gradient(135deg, #f0c040, #e0a020)", border: "none",
  borderRadius: 8, color: "#1a1a2e", fontFamily: "'Courier New', monospace",
  fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 1
};
const btnGhost = {
  background: "transparent", border: "1px solid #333", borderRadius: 8,
  color: "#888", cursor: "pointer", fontFamily: "'Courier New', monospace", fontSize: 11
};

// ─── Setup Screen ────────────────────────────────────────────────────────────
function SetupScreen({ onConnect }) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    if (!url || !key) return setError("Both fields are required.");
    setLoading(true); setError("");
    try {
      const client = createClient(url.trim(), key.trim(), {
        auth: { persistSession: true }
      });
      const { error: e } = await client.from("students").select("id").limit(1);
      if (e) throw new Error(e.message);
      localStorage.setItem("sb_url", url.trim());
      localStorage.setItem("sb_key", key.trim());
      onConnect(client);
    } catch { setError("Could not connect. Check your URL and key, and confirm the tables exist."); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f23", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", padding: 20 }}>
      <div style={{ background: "#1a1a2e", border: "1px solid #f0c040", borderRadius: 20, padding: 40, width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏫</div>
          <div style={{ color: "#f0c040", fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>Hall Pass Tracker</div>
          <div style={{ color: "#888", fontSize: 12, marginTop: 8 }}>Enter your Supabase credentials to connect</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: "#aaa", fontSize: 10, letterSpacing: 2, display: "block", marginBottom: 6 }}>SUPABASE PROJECT URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" style={inputStyle} />
          </div>
          <div>
            <label style={{ color: "#aaa", fontSize: 10, letterSpacing: 2, display: "block", marginBottom: 6 }}>SUPABASE ANON KEY</label>
            <input value={key} onChange={e => setKey(e.target.value)} type="password" placeholder="eyJ..." style={inputStyle} />
          </div>
          {error && <div style={{ color: "#ff8888", fontSize: 12, background: "#2a1010", border: "1px solid #aa4444", borderRadius: 8, padding: "10px 14px" }}>{error}</div>}
          <button onClick={handleConnect} disabled={loading} style={{ ...btnGold, marginTop: 8, padding: 14, fontSize: 13, letterSpacing: 2 }}>
            {loading ? "CONNECTING..." : "CONNECT →"}
          </button>
        </div>
        <div style={{ marginTop: 24, padding: 16, background: "#0d1b2a", borderRadius: 10, fontSize: 11, color: "#666", lineHeight: 1.8 }}>
          <strong style={{ color: "#888" }}>First time?</strong> See SETUP.md for step-by-step instructions including the SQL to create your tables.
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [supabase, setSupabase] = useState(null);
  const [teacherName, setTeacherName] = useState(localStorage.getItem("teacher_name") || "Mrs. Johnson");
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

  useEffect(() => {
    const url = localStorage.getItem("sb_url");
    const key = localStorage.getItem("sb_key");
    if (url && key) setSupabase(createClient(url, key));
  }, []);

  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 15000); return () => clearInterval(i); }, []);

  const loadClasses = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("classes").select("*").order("name");
    setClasses(data || []);
  }, [supabase]);

  const loadAllStudents = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("students").select("*").order("name");
    setAllStudents(data || []);
  }, [supabase]);

  const loadClassStudents = useCallback(async () => {
    if (!supabase || !activeClassId) { setClassStudents([]); return; }
    const { data } = await supabase
      .from("class_students")
      .select("student_id, students(id, name)")
      .eq("class_id", activeClassId);
    const sorted = (data || []).map(r => r.students).filter(Boolean).sort((a,b) => a.name.localeCompare(b.name));
    setClassStudents(sorted);
  }, [supabase, activeClassId]);

  const loadCurrentOut = useCallback(async () => {
    if (!supabase || !activeClassId) { setCurrentOut([]); return; }
    const { data } = await supabase.from("passes").select("*, students(name)")
      .eq("class_id", activeClassId).is("time_in", null).order("time_out");
    setCurrentOut(data || []);
  }, [supabase, activeClassId]);

  const loadHistory = useCallback(async () => {
    if (!supabase) return;
    let q = supabase.from("passes").select("*, students(name), classes(name)")
      .not("time_in", "is", null).order("time_out", { ascending: false }).limit(300);
    if (historyFilter === "flagged") q = q.eq("flagged", true);
    else if (historyFilter.startsWith("class:")) q = q.eq("class_id", historyFilter.replace("class:", ""));
    else if (historyFilter !== "all") q = q.eq("student_id", historyFilter);
    const { data } = await q;
    setHistory(data || []);
  }, [supabase, historyFilter]);

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
    const { data, error } = await supabase.from("passes").insert({
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
    await supabase.from("passes").update({
      time_in: now.toISOString(),
      duration_seconds: Math.floor((now - new Date(pass.time_out)) / 1000),
      flagged: mins >= FLAG_MINUTES,
    }).eq("id", passId);
    loadCurrentOut(); loadHistory();
  }

  if (!supabase) return <SetupScreen onConnect={setSupabase} />;

  const availableStudents = classStudents.filter(s => !currentOut.find(o => o.student_id === s.id));
  const flaggedOut = currentOut.filter(p => elapsedMins(p.time_out) >= FLAG_MINUTES).length;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0f0f23 0%,#1a1a3e 50%,#0d1b2a 100%)", fontFamily: "'Courier New', monospace", color: "#e8e0d0", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(90deg,#1a1a2e,#16213e)", borderBottom: "2px solid #f0c040", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 26 }}>🏫</div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ color: "#f0c040", fontSize: 9, letterSpacing: 3, textTransform: "uppercase" }}>Hall Pass Tracker</div>
          {editingSetup ? (
            <TeacherEdit value={teacherName} onSave={saveTeacherName} onCancel={() => setEditingSetup(false)} />
          ) : (
            <div style={{ fontSize: 15, fontFamily: "Georgia, serif", fontWeight: 700 }}>{teacherName}</div>
          )}
        </div>

        {classes.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "#666", letterSpacing: 2, textTransform: "uppercase" }}>Class:</span>
            <select value={activeClassId || ""} onChange={e => setActiveClass(e.target.value || null)}
              style={{ ...inputStyle, width: "auto", minWidth: 190, padding: "6px 12px", fontSize: 12, borderColor: "#f0c040", color: "#f0c040" }}>
              <option value="">— Select Class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <button onClick={() => setEditingSetup(!editingSetup)} style={{ ...btnGhost, padding: "6px 10px" }}>⚙️</button>
        <button onClick={() => { localStorage.removeItem("sb_url"); localStorage.removeItem("sb_key"); setSupabase(null); }}
          style={{ ...btnGhost, padding: "6px 10px", fontSize: 10 }}>Disconnect</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #222", background: "#12122a", padding: "0 16px" }}>
        {[["dashboard","🏠","Dashboard"],["history","📋","History"],["classes","🗂","Classes"],["roster","👥","Roster"]].map(([id,icon,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: "none", border: "none",
            borderBottom: tab === id ? "2px solid #f0c040" : "2px solid transparent",
            color: tab === id ? "#f0c040" : "#666",
            fontFamily: "inherit", fontSize: 10, letterSpacing: 2,
            padding: "12px 14px", cursor: "pointer", textTransform: "uppercase"
          }}>{icon} {label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, paddingRight: 4 }}>
          {flaggedOut > 0 && <span style={{ background: "#3a1010", border: "1px solid #ff4444", borderRadius: 6, padding: "2px 8px", fontSize: 9, color: "#ff8888" }}>⚠ {flaggedOut} LONG</span>}
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: currentOut.length > 0 ? "#ff4444" : "#44ff88", boxShadow: `0 0 8px ${currentOut.length > 0 ? "#ff4444" : "#44ff88"}` }} />
          <span style={{ fontSize: 10, color: "#666" }}>{currentOut.length} OUT</span>
        </div>
      </div>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: "24px 16px" }}>

        {tab === "dashboard" && (
          <Dashboard
            activeClass={activeClass} classes={classes}
            availableStudents={availableStudents} currentOut={currentOut}
            selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent}
            selectedDest={selectedDest} setSelectedDest={setSelectedDest}
            issuePass={issuePass} returnStudent={returnStudent}
            setPrintPass={setPrintPass} tick={tick}
            onSelectClass={setActiveClass}
          />
        )}

        {tab === "history" && (
          <HistoryTab history={history} historyFilter={historyFilter}
            setHistoryFilter={setHistoryFilter} allStudents={allStudents} classes={classes} />
        )}

        {tab === "classes" && (
          <ClassesTab supabase={supabase} classes={classes} allStudents={allStudents}
            onRefresh={() => { loadClasses(); loadAllStudents(); loadClassStudents(); }} />
        )}

        {tab === "roster" && (
          <RosterTab supabase={supabase} allStudents={allStudents} classes={classes}
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

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ activeClass, classes, availableStudents, currentOut, selectedStudent, setSelectedStudent, selectedDest, setSelectedDest, issuePass, returnStudent, setPrintPass, tick, onSelectClass }) {
  if (!activeClass) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗂</div>
        <div style={{ color: "#f0c040", fontSize: 14, fontFamily: "Georgia, serif", marginBottom: 8 }}>No class selected</div>
        <div style={{ color: "#666", fontSize: 12, marginBottom: 24 }}>Pick a class from the dropdown above, or create one in the Classes tab first.</div>
        {classes.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {classes.map(c => (
              <button key={c.id} onClick={() => onSelectClass(c.id)} style={{ ...btnGold, padding: "10px 20px", fontSize: 13 }}>{c.name}</button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#f0c040", letterSpacing: 3, textTransform: "uppercase", flex: 1 }}>Issue Pass</div>
          <div style={{ fontSize: 11, color: "#555" }}>{availableStudents.length} of {availableStudents.length + currentOut.length} available</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: 180 }}>
            <option value="">— Select Student —</option>
            {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={selectedDest} onChange={e => setSelectedDest(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 140 }}>
            {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
          </select>
          <button onClick={issuePass} disabled={!selectedStudent} style={{
            ...btnGold, opacity: selectedStudent ? 1 : 0.4,
            cursor: selectedStudent ? "pointer" : "not-allowed",
            whiteSpace: "nowrap", padding: "10px 20px"
          }}>🖨 Issue Pass</button>
        </div>
      </div>

      <div style={{ fontSize: 10, color: "#f0c040", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase" }}>
        Currently Out — {currentOut.length} student{currentOut.length !== 1 ? "s" : ""}
      </div>
      {currentOut.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#444", border: "1px dashed #2a2a4e", borderRadius: 12, fontSize: 13 }}>✓ All students are in class</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {currentOut.map(pass => {
            const mins = elapsedMins(pass.time_out);
            const isLong = mins >= FLAG_MINUTES;
            return (
              <div key={pass.id} style={{
                background: isLong ? "linear-gradient(135deg,#2a1010,#1a0808)" : "#1a1a2e",
                border: `1px solid ${isLong ? "#aa3333" : "#2a2a4e"}`,
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 14
              }}>
                <div style={{ fontSize: 26 }}>🚶</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: isLong ? "#ff9999" : "#e8e0d0" }}>
                    {pass.students?.name || pass.student_name}
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{pass.destination} · Out at {formatTime(pass.time_out)}</div>
                </div>
                <div style={{ textAlign: "center", minWidth: 56 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: isLong ? "#ff4444" : "#f0c040", fontFamily: "Georgia, serif" }}>{mins}m</div>
                  {isLong && <div style={{ fontSize: 9, color: "#ff6666", letterSpacing: 1 }}>LONG</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setPrintPass(pass)} style={{ ...btnGhost, padding: "6px 10px" }} title="Reprint">🖨</button>
                  <button onClick={() => returnStudent(pass.id)} style={{
                    background: "#1a3a1a", border: "1px solid #3a6a3a", borderRadius: 8,
                    color: "#88dd88", cursor: "pointer", padding: "6px 14px",
                    fontFamily: "inherit", fontSize: 11, fontWeight: 700, letterSpacing: 1
                  }}>RETURNED</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────
function HistoryTab({ history, historyFilter, setHistoryFilter, allStudents, classes }) {
  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#f0c040", letterSpacing: 3, textTransform: "uppercase", flex: 1 }}>Pass History</div>
        <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 210 }}>
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
      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#444", border: "1px dashed #2a2a4e", borderRadius: 12 }}>No records found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map(entry => {
            const mins = entry.duration_seconds ? Math.floor(entry.duration_seconds / 60) : 0;
            const secs = entry.duration_seconds ? entry.duration_seconds % 60 : 0;
            return (
              <div key={entry.id} style={{
                background: entry.flagged ? "#1e1010" : "#1a1a2e",
                border: `1px solid ${entry.flagged ? "#663333" : "#2a2a4e"}`,
                borderRadius: 10, padding: "12px 18px",
                display: "grid", gridTemplateColumns: "1fr auto auto auto",
                alignItems: "center", gap: 12
              }}>
                <div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: entry.flagged ? "#ff9999" : "#e8e0d0" }}>
                    {entry.flagged && "⚠ "}{entry.students?.name || entry.student_name}
                  </div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                    {entry.destination} · {entry.classes?.name || ""} · {formatDate(entry.time_out)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>OUT</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{formatTime(entry.time_out)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>IN</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{entry.time_in ? formatTime(entry.time_in) : "—"}</div>
                </div>
                <div style={{
                  background: entry.flagged ? "#3a1010" : "#1a3a1a",
                  border: `1px solid ${entry.flagged ? "#884444" : "#448844"}`,
                  borderRadius: 8, padding: "4px 10px", textAlign: "center", minWidth: 64
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: entry.flagged ? "#ff8888" : "#88dd88" }}>{mins}m {secs}s</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Classes Tab ─────────────────────────────────────────────────────────────
function ClassesTab({ supabase, classes, allStudents, onRefresh }) {
  const [newClassName, setNewClassName] = useState("");
  const [expandedClass, setExpandedClass] = useState(null);
  const [classStudentMap, setClassStudentMap] = useState({});
  const [editingClass, setEditingClass] = useState(null);

  async function loadClassStudents(classId) {
    const { data } = await supabase.from("class_students").select("student_id").eq("class_id", classId);
    setClassStudentMap(prev => ({ ...prev, [classId]: (data || []).map(r => r.student_id) }));
  }

  async function addClass() {
    const name = newClassName.trim();
    if (!name) return;
    await supabase.from("classes").insert({ name });
    setNewClassName(""); onRefresh();
  }

  async function deleteClass(id) {
    if (!confirm("Delete this class? Students and pass history are kept.")) return;
    await supabase.from("classes").delete().eq("id", id);
    onRefresh();
  }

  async function saveClassName(id, name) {
    await supabase.from("classes").update({ name }).eq("id", id);
    setEditingClass(null); onRefresh();
  }

  async function toggleStudent(classId, studentId, enrolled) {
    if (enrolled) {
      await supabase.from("class_students").delete().eq("class_id", classId).eq("student_id", studentId);
    } else {
      await supabase.from("class_students").insert({ class_id: classId, student_id: studentId });
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
      <div style={{ fontSize: 10, color: "#f0c040", letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>
        Classes / Periods — {classes.length} total
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input value={newClassName} onChange={e => setNewClassName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addClass()}
          placeholder="e.g. Period 1 — 8th Grade English"
          style={{ ...inputStyle, flex: 1 }} />
        <button onClick={addClass} style={{ ...btnGold, padding: "10px 18px" }}>+ Add Class</button>
      </div>
      {classes.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#444", border: "1px dashed #2a2a4e", borderRadius: 12 }}>
          No classes yet — add your first period above
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {classes.map(cls => {
            const enrolled = classStudentMap[cls.id] || [];
            const isExpanded = expandedClass === cls.id;
            const isEditing = editingClass?.id === cls.id;
            return (
              <div key={cls.id} style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 20 }}>🗂</div>
                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input value={editingClass.name} onChange={e => setEditingClass({ ...editingClass, name: e.target.value })}
                          onKeyDown={e => e.key === "Enter" && saveClassName(cls.id, editingClass.name)}
                          style={{ ...inputStyle, padding: "4px 10px", fontSize: 13 }} autoFocus />
                        <button onClick={() => saveClassName(cls.id, editingClass.name)} style={{ ...btnGold, padding: "4px 12px" }}>Save</button>
                        <button onClick={() => setEditingClass(null)} style={{ ...btnGhost, padding: "4px 10px" }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700 }}>{cls.name}</div>
                        {isExpanded && enrolled.length > 0 && (
                          <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{enrolled.length} student{enrolled.length !== 1 ? "s" : ""} enrolled</div>
                        )}
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleExpand(cls.id)} style={{
                        ...btnGhost, padding: "6px 12px", fontSize: 11,
                        color: isExpanded ? "#f0c040" : "#888", borderColor: isExpanded ? "#f0c040" : "#333"
                      }}>{isExpanded ? "▲ Hide" : "▼ Students"}</button>
                      <button onClick={() => setEditingClass(cls)} style={{ ...btnGhost, padding: "6px 10px" }} title="Rename">✏️</button>
                      <button onClick={() => deleteClass(cls.id)} style={{ ...btnGhost, padding: "6px 10px" }} title="Delete">🗑</button>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #2a2a4e", padding: "16px 18px" }}>
                    <div style={{ fontSize: 10, color: "#888", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>
                      Check students to enroll in this class
                    </div>
                    {allStudents.length === 0 ? (
                      <div style={{ color: "#555", fontSize: 12 }}>No students yet — add them in the Roster tab first.</div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                        {allStudents.map(s => {
                          const isEnrolled = enrolled.includes(s.id);
                          return (
                            <label key={s.id} style={{
                              display: "flex", alignItems: "center", gap: 8,
                              background: isEnrolled ? "#1a2e1a" : "#12122a",
                              border: `1px solid ${isEnrolled ? "#3a6a3a" : "#2a2a4e"}`,
                              borderRadius: 8, padding: "8px 12px", cursor: "pointer"
                            }}>
                              <input type="checkbox" checked={isEnrolled}
                                onChange={() => toggleStudent(cls.id, s.id, isEnrolled)}
                                style={{ accentColor: "#f0c040" }} />
                              <span style={{ fontFamily: "Georgia, serif", fontSize: 13, color: isEnrolled ? "#88dd88" : "#aaa" }}>{s.name}</span>
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

// ─── Roster Tab ──────────────────────────────────────────────────────────────
function RosterTab({ supabase, allStudents, classes, currentOut, onRefresh }) {
  const [newName, setNewName] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentClasses, setStudentClasses] = useState({});

  useEffect(() => {
    async function loadEnrollments() {
      if (!supabase) return;
      const { data } = await supabase.from("class_students").select("student_id, class_id");
      const map = {};
      (data || []).forEach(r => {
        if (!map[r.student_id]) map[r.student_id] = [];
        map[r.student_id].push(r.class_id);
      });
      setStudentClasses(map);
    }
    loadEnrollments();
  }, [supabase, allStudents]);

  async function addStudent() {
    const name = newName.trim();
    if (!name) return;
    await supabase.from("students").insert({ name });
    setNewName(""); onRefresh();
  }

  async function saveEdit() {
    if (!editingStudent?.name?.trim()) return;
    await supabase.from("students").update({ name: editingStudent.name.trim() }).eq("id", editingStudent.id);
    setEditingStudent(null); onRefresh();
  }

  async function deleteStudent(id) {
    if (!confirm("Remove this student? Their pass history will be kept.")) return;
    await supabase.from("students").delete().eq("id", id);
    onRefresh();
  }

  return (
    <>
      <div style={{ fontSize: 10, color: "#f0c040", letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>
        Global Roster — {allStudents.length} students
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addStudent()}
          placeholder="Add student name..."
          style={{ ...inputStyle, flex: 1 }} />
        <button onClick={addStudent} style={{ ...btnGold, padding: "10px 18px" }}>+ Add</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {allStudents.map(s => {
          const isOut = currentOut.find(o => o.student_id === s.id);
          const isEditing = editingStudent?.id === s.id;
          const enrolledIn = (studentClasses[s.id] || []).map(cid => classes.find(c => c.id === cid)?.name).filter(Boolean);
          return (
            <div key={s.id} style={{
              background: isOut ? "#1a2a1a" : "#1a1a2e",
              border: `1px solid ${isOut ? "#3a5a3a" : "#2a2a4e"}`,
              borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: isOut ? "#44ff88" : "#334", flexShrink: 0 }} />
              {isEditing ? (
                <>
                  <input value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && saveEdit()}
                    style={{ ...inputStyle, flex: 1, padding: "4px 8px", fontSize: 12 }} autoFocus />
                  <button onClick={saveEdit} style={{ ...btnGold, padding: "3px 10px", fontSize: 11 }}>Save</button>
                  <button onClick={() => setEditingStudent(null)} style={{ ...btnGhost, padding: "3px 8px" }}>✕</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 14 }}>{s.name}</div>
                    {enrolledIn.length > 0 && (
                      <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{enrolledIn.join(" · ")}</div>
                    )}
                  </div>
                  {isOut && <span style={{ fontSize: 9, color: "#44ff88", letterSpacing: 1 }}>OUT</span>}
                  <button onClick={() => setEditingStudent(s)} style={{ ...btnGhost, padding: "5px 8px" }} title="Edit">✏️</button>
                  <button onClick={() => deleteStudent(s.id)} style={{ ...btnGhost, padding: "5px 8px" }} title="Delete">🗑</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function TeacherEdit({ value, onSave, onCancel }) {
  const [name, setName] = useState(value);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && onSave(name)}
        style={{ ...inputStyle, padding: "3px 8px", fontSize: 13, width: 200 }} autoFocus />
      <button onClick={() => onSave(name)} style={{ ...btnGold, padding: "3px 10px", fontSize: 11 }}>Save</button>
      <button onClick={onCancel} style={{ ...btnGhost, padding: "3px 8px" }}>✕</button>
    </div>
  );
}

function PrintPassModal({ pass, teacherName, className, onClose }) {
  useEffect(() => { setTimeout(() => window.print(), 300); }, []);
  const studentName = pass.students?.name || pass.student_name;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <style>{`@media print { body > * { display:none!important } .print-pass { display:flex!important; position:fixed!important; inset:0!important; background:white!important; align-items:center!important; justify-content:center!important } .no-print{display:none!important} }`}</style>
      <div className="print-pass" style={{ display: "contents" }}>
        <div style={{ background: "white", borderRadius: 16, width: 480, overflow: "hidden", border: "3px solid #1a1a2e", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
          <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)", padding: "20px 28px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 34 }}>🏫</div>
            <div>
              <div style={{ color: "#f0c040", fontSize: 10, fontFamily: "'Courier New'", letterSpacing: 3, textTransform: "uppercase" }}>Hall Pass</div>
              <div style={{ color: "white", fontSize: 17, fontFamily: "Georgia, serif", fontWeight: 700 }}>{className}</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ color: "#f0c040", fontSize: 9, fontFamily: "'Courier New'", letterSpacing: 2 }}>TEACHER</div>
              <div style={{ color: "white", fontSize: 13, fontFamily: "Georgia, serif" }}>{teacherName}</div>
            </div>
          </div>
          <div style={{ borderTop: "3px dashed #e0c040", borderBottom: "3px dashed #e0c040", background: "#fffdf0", padding: "6px 28px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, fontFamily: "'Courier New'", color: "#999", letterSpacing: 2 }}>✂ CUT IF NEEDED</span>
            <span style={{ fontSize: 9, fontFamily: "'Courier New'", color: "#999", letterSpacing: 2 }}>AUTHORIZED PASS ✂</span>
          </div>
          <div style={{ padding: "24px 28px", background: "#fffdf0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <PassField label="Student Name" value={studentName} wide />
              <PassField label="Destination" value={pass.destination} />
              <PassField label="Date" value={formatDate(pass.time_out)} />
              <PassField label="Time Out" value={formatTime(pass.time_out)} />
            </div>
            <div style={{ borderTop: "1px solid #ccc", paddingTop: 16, display: "flex", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ borderBottom: "1px solid #333", minHeight: 28, marginBottom: 4 }} />
                <div style={{ fontSize: 9, fontFamily: "'Courier New'", color: "#888", letterSpacing: 1 }}>TEACHER SIGNATURE</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ borderBottom: "1px solid #333", minHeight: 28, marginBottom: 4, display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                  <span style={{ fontSize: 11, fontFamily: "'Courier New'", color: "#444" }}>Return by: ________</span>
                </div>
                <div style={{ fontSize: 9, fontFamily: "'Courier New'", color: "#888", letterSpacing: 1 }}>TIME LIMIT</div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 8, background: "#1a1a2e", borderRadius: 6, textAlign: "center" }}>
              <span style={{ color: "#f0c040", fontSize: 9, fontFamily: "'Courier New'", letterSpacing: 2 }}>CARRY THIS PASS AT ALL TIMES IN THE HALLWAY</span>
            </div>
          </div>
        </div>
      </div>
      <button className="no-print" onClick={onClose} style={{ position: "fixed", top: 24, right: 24, background: "white", border: "none", borderRadius: "50%", width: 40, height: 40, fontSize: 20, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>✕</button>
    </div>
  );
}

function PassField({ label, value, wide }) {
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <div style={{ fontSize: 9, fontFamily: "'Courier New'", color: "#888", letterSpacing: 2, marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
      <div style={{ borderBottom: "2px solid #1a1a2e", paddingBottom: 4, fontSize: wide ? 20 : 15, fontFamily: "Georgia, serif", fontWeight: 700, color: "#1a1a2e", minHeight: 28 }}>{value}</div>
    </div>
  );
}
