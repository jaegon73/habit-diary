import { useState, useEffect, useCallback, useRef } from "react";

// ─── 기본 데이터 ───────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "exercise", name: "운동", emoji: "🏃", color: "#FF6B6B" },
  { id: "hobby",    name: "취미", emoji: "🎨", color: "#A78BFA" },
  { id: "study",    name: "공부", emoji: "📚", color: "#4ECDC4" },
];

const DEFAULT_HABITS = [
  { id: "h1", categoryId: "exercise", name: "런닝",     emoji: "👟", target: 3, unit: "회/주" },
  { id: "h2", categoryId: "exercise", name: "골프",     emoji: "⛳", target: 3, unit: "회/주" },
  { id: "h3", categoryId: "exercise", name: "푸시업",   emoji: "💪", target: 3, unit: "회/주" },
  { id: "h4", categoryId: "study",    name: "책읽기",   emoji: "📖", target: 3, unit: "회/주" },
  { id: "h5", categoryId: "study",    name: "듀오링고", emoji: "🦉", target: 3, unit: "회/주" },
];

const CAT_COLORS = ["#FF6B6B","#4ECDC4","#FFE66D","#A78BFA","#F97316","#34D399","#60A5FA","#F472B6"];
const CAT_EMOJIS = ["🏃","📚","🎨","🎵","💼","🍀","⚽","🧘","✈️","🎮","🍳","🌿"];
const HABIT_EMOJIS = ["👟","⛳","💪","📖","🦉","🎸","🎹","✏️","🧘","🏊","🚴","🎯","🧩","🍎","☕","💊","🛌","🧹","💰","🌅"];
const WEEKDAYS = ["월","화","수","목","금","토","일"];

// ─── 유틸 ──────────────────────────────────────────────────────
function toKST(date = new Date()) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" })).toISOString().split("T")[0];
}
function uid() { return Math.random().toString(36).slice(2, 9); }

function getWeekDates(offset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toKST(d);
  });
}

function getMonthDates(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  const startDay = (first.getDay() + 6) % 7;
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d).toISOString().split("T")[0]);
  }
  return days;
}

function calcStreak(habitId, records, today) {
  let streak = 0;
  let d = new Date(today);
  while (true) {
    const ds = toKST(d);
    if (records[ds]?.[habitId]?.done) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

// ─── 서브 컴포넌트 ─────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
      onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"#1a1a28",borderRadius:20,padding:24,width:"100%",maxWidth:400,maxHeight:"80vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div style={{ fontWeight:700,fontSize:17 }}>{title}</div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#666",fontSize:22,cursor:"pointer",lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmojiPicker({ value, onChange, list }) {
  return (
    <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginTop:8 }}>
      {list.map(e => (
        <button key={e} onClick={() => onChange(e)}
          style={{ width:36,height:36,borderRadius:8,border:`2px solid ${value===e?"#fff":"transparent"}`,background:value===e?"#2a2a3e":"none",fontSize:18,cursor:"pointer" }}>
          {e}
        </button>
      ))}
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display:"flex",gap:8,marginTop:8,flexWrap:"wrap" }}>
      {CAT_COLORS.map(c => (
        <button key={c} onClick={() => onChange(c)}
          style={{ width:28,height:28,borderRadius:"50%",background:c,border:`3px solid ${value===c?"#fff":"transparent"}`,cursor:"pointer" }} />
      ))}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12,color:"#888",marginBottom:6 }}>{label}</div>}
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%",background:"#0d0d14",border:"1px solid #2a2a3e",borderRadius:10,padding:"10px 12px",color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit" }} />
    </div>
  );
}

function Btn({ children, onClick, color="#4ECDC4", secondary, small, danger }) {
  const bg = danger ? "#FF6B6B22" : secondary ? "#1e1e2e" : color+"22";
  const border = danger ? "#FF6B6B44" : secondary ? "#2a2a3e" : color+"44";
  const tc = danger ? "#FF6B6B" : secondary ? "#888" : color;
  return (
    <button onClick={onClick}
      style={{ background:bg,border:`1px solid ${border}`,color:tc,borderRadius:10,padding:small?"6px 12px":"10px 18px",fontSize:small?12:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}>
      {children}
    </button>
  );
}

// ─── 메인 앱 ───────────────────────────────────────────────────
export default function App() {
  const today = toKST();
  const [cats, setCats] = useState(null);
  const [habits, setHabits] = useState(null);
  const [records, setRecords] = useState({});
  const [view, setView] = useState("today");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);      // 오늘 탭 날짜 이동 (0=오늘)
  const [draftDay, setDraftDay] = useState({});        // 선택 날짜 임시 체크 상태
  const [isDirty, setIsDirty] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [calMonth, setCalMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });

  // Modals
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [memoText, setMemoText] = useState("");

  // ── 선택된 날짜 계산 ──
  const selectedDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return toKST(d);
  })();
  const isToday = selectedDate === today;

  // ── Load (localStorage) ──
  useEffect(() => {
    try {
      const r1 = localStorage.getItem("hd-cats");
      const r2 = localStorage.getItem("hd-habits");
      const r3 = localStorage.getItem("hd-records");
      const loadedRecords = r3 ? JSON.parse(r3) : {};
      setCats(r1 ? JSON.parse(r1) : DEFAULT_CATEGORIES);
      setHabits(r2 ? JSON.parse(r2) : DEFAULT_HABITS);
      setRecords(loadedRecords);
      setDraftDay(loadedRecords[today] || {});
    } catch {
      setCats(DEFAULT_CATEGORIES);
      setHabits(DEFAULT_HABITS);
    }
    setLoading(false);
  }, []);

  // 날짜 이동 시 draft 초기화
  useEffect(() => {
    setDraftDay(records[selectedDate] || {});
    setIsDirty(false);
  }, [selectedDate]);

  // ── Save (localStorage) ──
  const persist = useCallback((key, val) => {
    setSaving(true);
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    setTimeout(() => setSaving(false), 400);
  }, []);

  const saveCats    = (v) => { setCats(v);    persist("hd-cats", v); };
  const saveHabits  = (v) => { setHabits(v);  persist("hd-habits", v); };
  const saveRecords = (v) => { setRecords(v); persist("hd-records", v); };

  // ── Toggle (draft만) ──
  function toggleHabit(habitId) {
    const prev = draftDay[habitId];
    const done = !prev?.done;
    setDraftDay(d => ({
      ...d,
      [habitId]: { ...prev, done, time: done ? new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}) : null },
    }));
    setIsDirty(true);
  }

  // ── 선택 날짜 기록 확정 저장 ──
  function saveDayRecords() {
    const newR = { ...records, [selectedDate]: draftDay };
    saveRecords(newR);
    setIsDirty(false);
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 1500);
  }

  function saveMemo(habitId, text) {
    setDraftDay(d => ({ ...d, [habitId]: { ...(d[habitId]||{}), memo: text } }));
    setIsDirty(true);
    setModal(null);
  }

  // ── Category CRUD ──
  function addCat({ name, emoji, color }) {
    saveCats([...cats, { id: uid(), name, emoji, color }]);
    setModal(null);
  }
  function editCat({ id, name, emoji, color }) {
    saveCats(cats.map(c => c.id===id ? {...c,name,emoji,color} : c));
    setModal(null);
  }
  function deleteCat(id) {
    if (!window.confirm("카테고리와 해당 습관을 모두 삭제할까요?")) return;
    saveCats(cats.filter(c=>c.id!==id));
    saveHabits(habits.filter(h=>h.categoryId!==id));
  }

  // ── Habit CRUD ──
  function addHabit({ name, emoji, categoryId, target }) {
    saveHabits([...habits, { id:uid(), name, emoji, categoryId, target:parseInt(target)||3, unit:"회/주" }]);
    setModal(null);
  }
  function editHabit({ id, name, emoji, categoryId, target }) {
    saveHabits(habits.map(h => h.id===id ? {...h,name,emoji,categoryId,target:parseInt(target)||3} : h));
    setModal(null);
  }
  function deleteHabit(id) {
    if (!window.confirm("이 습관을 삭제할까요?")) return;
    saveHabits(habits.filter(h=>h.id!==id));
  }

  // ── Computed ──
  const weekDates = getWeekDates(weekOffset);
  const todayDone = habits ? Object.values(draftDay).filter(r=>r.done).length : 0;
  const todayTotal = (habits||[]).length;

  function getStreak(habitId) { return calcStreak(habitId, records, today); }
  function getWeeklyCount(habitId) { return weekDates.filter(d=>records[d]?.[habitId]?.done).length; }
  function getDayScore(ds) {
    if (!records[ds]) return 0;
    return (habits||[]).filter(h=>records[ds][h.id]?.done).length;
  }

  const yearNow = new Date().getFullYear();
  const yearStart = new Date(yearNow, 0, 1);
  const yearEnd   = new Date(yearNow, 11, 31);
  const totalDays = Math.round((yearEnd-yearStart)/86400000)+1;
  const passedDays = Math.round((new Date()-yearStart)/86400000)+1;

  if (loading || !cats || !habits) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0d0d14",color:"#fff",fontFamily:"sans-serif"}}>
      불러오는 중...
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif", background:"#0d0d14", minHeight:"100vh", color:"#fff", maxWidth:480, margin:"0 auto", paddingBottom:80 }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{display:none}
        input::placeholder{color:#444}
        input{caret-color:#4ECDC4}
        .fade{animation:fadeIn 0.3s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .ripple:active{transform:scale(0.97)}
        .tab{flex:1;padding:10px 0;background:none;border:none;border-top:2px solid transparent;color:#555;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;letter-spacing:0.05em;transition:color 0.2s;display:flex;flex-direction:column;align-items:center;gap:3px}
        .tab.on{color:#fff;border-top-color:#fff}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{padding:"28px 22px 18px",background:"linear-gradient(180deg,#13131f 0%,#0d0d14 100%)",borderBottom:"1px solid #1a1a28"}}>
        {/* 앱 타이틀 */}
        <div style={{fontSize:11,color:"#444",letterSpacing:"0.18em",fontWeight:700,marginBottom:10,textTransform:"uppercase"}}>오늘도 ✓</div>
        {/* 날짜 크게 */}
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12}}>
          <div>
            <div style={{fontSize:52,fontWeight:900,letterSpacing:"-0.04em",lineHeight:1,color:"#fff"}}>
              {new Date().toLocaleDateString("ko-KR",{month:"long",day:"numeric"})}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
              <span style={{fontSize:14,color:"#555",fontWeight:600}}>
                {new Date().toLocaleDateString("ko-KR",{year:"numeric"})}
              </span>
              <span style={{width:3,height:3,borderRadius:"50%",background:"#333",display:"inline-block"}}/>
              <span style={{fontSize:14,fontWeight:700,color:"#4ECDC4"}}>
                {["일","월","화","수","목","금","토"][new Date().getDay()]}요일
              </span>
            </div>
          </div>
          {/* 오늘 달성 */}
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:10,color:"#444",marginBottom:4,letterSpacing:"0.08em"}}>오늘 달성</div>
            <div style={{fontSize:38,fontWeight:900,lineHeight:1,color:todayDone===todayTotal&&todayTotal>0?"#FFE66D":"#fff"}}>
              {todayDone}<span style={{fontSize:16,color:"#333",fontWeight:400}}>/{todayTotal}</span>
            </div>
            {todayTotal>0 && (
              <div style={{marginTop:6,width:70,height:4,background:"#1e1e2e",borderRadius:2,marginLeft:"auto",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(todayDone/todayTotal)*100}%`,background:todayDone===todayTotal?"#FFE66D":"#4ECDC4",borderRadius:2,transition:"width 0.5s"}}/>
              </div>
            )}
          </div>
        </div>
        {saving && <div style={{marginTop:8,fontSize:10,color:"#333",textAlign:"right"}}>저장 중...</div>}
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",borderBottom:"1px solid #1a1a28",background:"#0d0d14",position:"sticky",top:0,zIndex:20}}>
        {[["today","오늘","◉"],["week","주간","▦"],["month","월간","▣"],["year","연간","◈"],["manage","관리","⚙"]].map(([v,l,ic])=>(
          <button key={v} className={`tab${view===v?" on":""}`} onClick={()=>setView(v)}>
            <span style={{fontSize:14}}>{ic}</span><span>{l}</span>
          </button>
        ))}
      </div>

      {/* ── VIEWS ── */}
      <div className="fade" key={view} style={{padding:"18px 16px"}}>

        {/* ════ TODAY ════ */}
        {view==="today" && (
          <div>
            {/* 날짜 네비게이션 */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,background:"#13131f",borderRadius:14,padding:"10px 6px"}}>
              <button onClick={()=>setDayOffset(p=>p-1)}
                style={{background:"none",border:"none",color:"#888",fontSize:22,cursor:"pointer",padding:"4px 12px",lineHeight:1}}>‹</button>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:800,color:isToday?"#4ECDC4":"#fff"}}>
                  {new Date(selectedDate+"T00:00:00").toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"short"})}
                </div>
                {isToday && <div style={{fontSize:10,color:"#4ECDC4",marginTop:2,letterSpacing:"0.08em"}}>오늘</div>}
                {!isToday && (
                  <button onClick={()=>setDayOffset(0)}
                    style={{fontSize:10,color:"#555",background:"none",border:"none",cursor:"pointer",marginTop:2,fontFamily:"inherit",textDecoration:"underline"}}>
                    오늘로 돌아가기
                  </button>
                )}
              </div>
              <button onClick={()=>setDayOffset(p=>Math.min(0,p+1))}
                style={{background:"none",border:"none",color:dayOffset===0?"#2a2a3e":"#888",fontSize:22,cursor:"pointer",padding:"4px 12px",lineHeight:1}}>›</button>
            </div>

            {cats.map(cat=>{
              const catHabits = habits.filter(h=>h.categoryId===cat.id);
              if(catHabits.length===0) return null;
              return (
                <div key={cat.id} style={{marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                    <span style={{fontSize:16}}>{cat.emoji}</span>
                    <span style={{fontSize:13,fontWeight:700,color:cat.color}}>{cat.name}</span>
                    <div style={{flex:1,height:1,background:cat.color+"33",marginLeft:4}}/>
                  </div>
                  {catHabits.map(h=>{
                    const draft = draftDay[h.id] || {};
                    const saved = records[selectedDate]?.[h.id] || {};
                    const done = !!draft.done;
                    const unsaved = done !== !!saved.done;
                    const streak = getStreak(h.id);
                    return (
                      <div key={h.id} className="ripple" style={{
                        marginBottom:10,
                        background: done ? `linear-gradient(135deg,${cat.color}18,#13131f)` : "#13131f",
                        border: unsaved
                          ? `2px dashed ${done ? cat.color+"88" : "#444"}`
                          : `1px solid ${done ? cat.color+"44" : "#1e1e2e"}`,
                        borderRadius:14, padding:"14px 16px", transition:"all 0.2s", position:"relative",
                      }}>
                        {unsaved && (
                          <div style={{position:"absolute",top:8,right:10,fontSize:9,color:"#FFE66D",background:"#FFE66D22",padding:"2px 7px",borderRadius:20,fontWeight:700}}>
                            미저장
                          </div>
                        )}
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <button onClick={()=>toggleHabit(h.id)} style={{width:36,height:36,borderRadius:10,border:`2px solid ${done?cat.color:"#2a2a3e"}`,background:done?cat.color+"22":"none",fontSize:18,cursor:"pointer",flexShrink:0,transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {done ? <span style={{color:cat.color,fontWeight:900,fontSize:16}}>✓</span> : <span>{h.emoji}</span>}
                          </button>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,fontSize:15,display:"flex",alignItems:"center",gap:6}}>
                              {h.name}
                              {streak>=2 && <span style={{fontSize:11,color:"#FF6B6B",background:"#FF6B6B22",padding:"2px 7px",borderRadius:20}}>🔥{streak}일</span>}
                            </div>
                            {draft.memo && <div style={{fontSize:11,color:"#666",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>💬 {draft.memo}</div>}
                            {done && draft.time && <div style={{fontSize:10,color:cat.color,marginTop:2}}>✓ {draft.time}</div>}
                          </div>
                          <button onClick={()=>{setMemoText(draft.memo||"");setModalData({habitId:h.id,name:h.name});setModal("memo");}}
                            style={{background:"none",border:"none",fontSize:16,cursor:"pointer",opacity:0.5,padding:"4px"}}>💬</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {habits.length===0 && (
              <div style={{textAlign:"center",padding:"40px 0",color:"#444"}}>
                <div style={{fontSize:32,marginBottom:10}}>🌱</div>
                <div style={{fontSize:14}}>아직 습관이 없어요</div>
                <div style={{fontSize:12,marginTop:6,color:"#333"}}>'관리' 탭에서 추가해보세요</div>
              </div>
            )}

            {habits.length>0 && (
              <div>
                <div style={{background:"#13131f",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#555",marginBottom:7}}>
                    <span>달성률</span>
                    <span>{todayTotal ? Math.round((todayDone/todayTotal)*100) : 0}%</span>
                  </div>
                  <div style={{height:6,background:"#1e1e2e",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${todayTotal?(todayDone/todayTotal)*100:0}%`,background:"linear-gradient(90deg,#4ECDC4,#FFE66D)",borderRadius:3,transition:"width 0.4s"}}/>
                  </div>
                </div>
                <button onClick={saveDayRecords} disabled={!isDirty}
                  style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
                    background: saveAnim ? "linear-gradient(90deg,#34D399,#4ECDC4)" : isDirty ? "linear-gradient(90deg,#4ECDC4,#60A5FA)" : "#1a1a28",
                    color: isDirty||saveAnim ? "#fff" : "#333",
                    fontSize:16,fontWeight:800,cursor:isDirty?"pointer":"default",fontFamily:"inherit",
                    transition:"all 0.3s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {saveAnim ? "✓ 저장됐어요!" : isDirty ? "💾 기록 저장" : "✓ 저장 완료"}
                </button>
                {isDirty && <div style={{textAlign:"center",marginTop:6,fontSize:11,color:"#555"}}>저장하지 않으면 새로고침 시 체크가 사라져요</div>}
              </div>
            )}
          </div>
        )}

        {/* ════ WEEK ════ */}
        {view==="week" && (
          <div>
            {/* 주간 네비 */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <button onClick={()=>setWeekOffset(p=>p-1)} style={{background:"none",border:"none",color:"#888",fontSize:20,cursor:"pointer",padding:"4px 10px"}}>‹</button>
              <div style={{fontSize:13,fontWeight:600}}>
                {weekOffset===0?"이번 주":weekOffset===-1?"지난 주":`${Math.abs(weekOffset)}주 전`}
                <span style={{fontSize:11,color:"#555",marginLeft:6}}>({weekDates[0].slice(5)} ~ {weekDates[6].slice(5)})</span>
              </div>
              <button onClick={()=>setWeekOffset(p=>Math.min(0,p+1))} style={{background:"none",border:"none",color:weekOffset===0?"#2a2a3e":"#888",fontSize:20,cursor:"pointer",padding:"4px 10px"}}>›</button>
            </div>

            {/* 주간 캘린더 - 7칸 세로 스크롤 */}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {WEEKDAYS.map((wd, i) => {
                const ds = weekDates[i];
                const isToday = ds === today;
                const isFuture = ds > today;
                const day = ds.slice(8);
                const doneHabits = habits.filter(h => records[ds]?.[h.id]?.done);
                const cat4habit = (h) => cats.find(c => c.id === h.categoryId);

                return (
                  <div key={ds} style={{
                    borderRadius:14,
                    border:`1px solid ${isToday?"#ffffff44":"#1e1e2e"}`,
                    background: isToday ? "#16162a" : "#13131f",
                    overflow:"hidden",
                    opacity: isFuture ? 0.35 : 1,
                  }}>
                    {/* 날짜 헤더 행 */}
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom: doneHabits.length>0 ? "1px solid #1e1e2e" : "none", background: isToday?"#1e1e3a":"transparent"}}>
                      <div style={{display:"flex",alignItems:"baseline",gap:5}}>
                        <span style={{fontSize:20,fontWeight:900,color:isToday?"#fff":"#888",lineHeight:1}}>{day}</span>
                        <span style={{fontSize:11,fontWeight:700,color:isToday?"#4ECDC4":"#444"}}>{wd}</span>
                      </div>
                      {isToday && <span style={{fontSize:10,color:"#4ECDC4",background:"#4ECDC422",padding:"2px 8px",borderRadius:20,fontWeight:600}}>오늘</span>}
                      {doneHabits.length > 0 && (
                        <span style={{marginLeft:"auto",fontSize:11,color:"#555"}}>{doneHabits.length}/{habits.length}</span>
                      )}
                      {doneHabits.length === 0 && !isFuture && (
                        <span style={{marginLeft:"auto",fontSize:11,color:"#2a2a3e"}}>—</span>
                      )}
                    </div>

                    {/* 완료 습관 목록 */}
                    {doneHabits.length > 0 && (
                      <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:7}}>
                        {doneHabits.map(h => {
                          const cat = cat4habit(h);
                          const streak = getStreak(h.id);
                          return (
                            <div key={h.id} style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:17,lineHeight:1}}>{h.emoji}</span>
                              <span style={{fontSize:13,fontWeight:600,color:cat?.color||"#fff",flex:1}}>{h.name}</span>
                              {streak >= 2 && <span style={{fontSize:10,color:"#FF6B6B"}}>🔥{streak}</span>}
                              {records[ds][h.id]?.memo && <span style={{fontSize:11,color:"#444"}}>💬</span>}
                              {records[ds][h.id]?.time && <span style={{fontSize:10,color:"#333"}}>{records[ds][h.id].time}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 주간 달성 요약 */}
            <div style={{marginTop:16,background:"#13131f",borderRadius:14,padding:"14px 16px"}}>
              <div style={{fontSize:12,color:"#555",marginBottom:10,fontWeight:600}}>이번 주 습관별 달성</div>
              {habits.map(h=>{
                const cnt = getWeeklyCount(h.id);
                const cat = cats.find(c=>c.id===h.categoryId);
                const achieved = cnt >= h.target;
                return (
                  <div key={h.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontSize:15}}>{h.emoji}</span>
                    <span style={{fontSize:13,flex:1,color:"#aaa"}}>{h.name}</span>
                    <div style={{display:"flex",gap:3}}>
                      {weekDates.map((ds,i)=>{
                        const done = records[ds]?.[h.id]?.done;
                        return <div key={i} style={{width:16,height:16,borderRadius:4,background:done?(cat?.color||"#4ECDC4"):"#1e1e2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>
                          {done&&"✓"}
                        </div>;
                      })}
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:achieved?(cat?.color||"#4ECDC4"):"#555",minWidth:28,textAlign:"right"}}>
                      {cnt}/{h.target}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ MONTH ════ */}
        {view==="month" && (
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <button onClick={()=>setCalMonth(p=>p.month===0?{year:p.year-1,month:11}:{...p,month:p.month-1})} style={{background:"none",border:"none",color:"#888",fontSize:20,cursor:"pointer",padding:"4px 10px"}}>‹</button>
              <div style={{fontWeight:700,fontSize:15}}>{calMonth.year}년 {calMonth.month+1}월</div>
              <button onClick={()=>setCalMonth(p=>p.month===11?{year:p.year+1,month:0}:{...p,month:p.month+1})} style={{background:"none",border:"none",color:"#888",fontSize:20,cursor:"pointer",padding:"4px 10px"}}>›</button>
            </div>

            {/* 요일 헤더 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
              {WEEKDAYS.map(w=>(
                <div key={w} style={{textAlign:"center",fontSize:10,color:"#444",padding:"4px 0",fontWeight:600}}>{w}</div>
              ))}
            </div>

            {/* 달력 칸 - 아이콘 표시 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:20}}>
              {getMonthDates(calMonth.year, calMonth.month).map((ds, i) => {
                if (!ds) return <div key={i} />;
                const day = parseInt(ds.slice(8));
                const isToday = ds === today;
                const isFuture = ds > today;
                const doneHabits = habits.filter(h => records[ds]?.[h.id]?.done);
                const allDone = doneHabits.length === habits.length && habits.length > 0;

                return (
                  <div key={ds} style={{
                    borderRadius: 10,
                    border: `1px solid ${isToday ? "#ffffff55" : doneHabits.length > 0 ? "#2a2a3e" : "#1a1a28"}`,
                    background: isToday ? "#16162a" : doneHabits.length > 0 ? "#161622" : "#13131f",
                    minHeight: 56,
                    padding: "6px 4px 5px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    opacity: isFuture ? 0.25 : 1,
                    position: "relative",
                  }}>
                    {/* 날짜 숫자 */}
                    <div style={{
                      fontSize: 11,
                      fontWeight: isToday ? 800 : 500,
                      color: isToday ? "#4ECDC4" : "#666",
                      lineHeight: 1,
                    }}>{day}</div>

                    {/* 완료 습관 이모지들 */}
                    {doneHabits.length > 0 && (
                      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:1,lineHeight:1}}>
                        {doneHabits.map(h => (
                          <span key={h.id} style={{fontSize:13,lineHeight:1.2}}>{h.emoji}</span>
                        ))}
                      </div>
                    )}

                    {/* 전체 달성 시 별 표시 */}
                    {allDone && (
                      <div style={{position:"absolute",top:2,right:3,fontSize:8,color:"#FFE66D"}}>★</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div style={{background:"#13131f",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
              <div style={{fontSize:11,color:"#555",marginBottom:8,fontWeight:600}}>습관 아이콘</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                {habits.map(h=>{
                  const cat = cats.find(c=>c.id===h.categoryId);
                  return (
                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:14}}>{h.emoji}</span>
                      <span style={{fontSize:11,color:cat?.color||"#888"}}>{h.name}</span>
                    </div>
                  );
                })}
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:11,color:"#FFE66D"}}>★</span>
                  <span style={{fontSize:11,color:"#555"}}>전체 달성</span>
                </div>
              </div>
            </div>

            {/* 월간 달성 요약 */}
            {(() => {
              const mDates = getMonthDates(calMonth.year, calMonth.month).filter(Boolean);
              const passed = mDates.filter(ds => ds <= today);
              const totalPossible = passed.length * habits.length;
              const totalDone = passed.reduce((acc, ds) => acc + habits.filter(h => records[ds]?.[h.id]?.done).length, 0);
              const perfectDays = passed.filter(ds => habits.length > 0 && habits.every(h => records[ds]?.[h.id]?.done)).length;
              return (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  <div style={{background:"#13131f",borderRadius:12,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:22,fontWeight:900,color:"#4ECDC4"}}>{totalDone}</div>
                    <div style={{fontSize:10,color:"#555",marginTop:3}}>총 달성</div>
                  </div>
                  <div style={{background:"#13131f",borderRadius:12,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:22,fontWeight:900,color:"#FFE66D"}}>{perfectDays}</div>
                    <div style={{fontSize:10,color:"#555",marginTop:3}}>완벽한 날 ★</div>
                  </div>
                  <div style={{background:"#13131f",borderRadius:12,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:22,fontWeight:900,color:"#A78BFA"}}>{totalPossible>0?Math.round(totalDone/totalPossible*100):0}<span style={{fontSize:12,fontWeight:400,color:"#555"}}>%</span></div>
                    <div style={{fontSize:10,color:"#555",marginTop:3}}>달성률</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ════ YEAR ════ */}
        {view==="year" && (
          <div>
            <div style={{marginBottom:16,background:"#13131f",borderRadius:14,padding:"16px"}}>
              <div style={{fontSize:11,color:"#555",marginBottom:4}}>{yearNow}년 진행률</div>
              <div style={{fontSize:30,fontWeight:900}}>{Math.round((passedDays/totalDays)*100)}<span style={{fontSize:13,color:"#555",fontWeight:400}}>%</span></div>
              <div style={{margin:"8px 0 4px",height:6,background:"#1e1e2e",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(passedDays/totalDays)*100}%`,background:"linear-gradient(90deg,#4ECDC4,#FFE66D,#FF6B6B)",borderRadius:3}}/>
              </div>
              <div style={{fontSize:11,color:"#555"}}>{passedDays}일 경과 / {totalDays}일</div>
            </div>

            {cats.map(cat=>{
              const catH = habits.filter(h=>h.categoryId===cat.id);
              if(!catH.length) return null;
              return (
                <div key={cat.id} style={{marginBottom:16}}>
                  <div style={{fontSize:12,color:cat.color,fontWeight:700,marginBottom:8}}>{cat.emoji} {cat.name}</div>
                  {catH.map(h=>{
                    let yearDone=0;
                    for(let d=new Date(yearStart);d<=new Date();d.setDate(d.getDate()+1)){
                      if(records[toKST(d)]?.[h.id]?.done) yearDone++;
                    }
                    const allWeeks = Math.ceil(passedDays/7);
                    let achievedWeeks=0;
                    for(let w=0;w<allWeeks;w++){
                      const cnt = Array.from({length:7},(_,i)=>{const d=new Date(yearStart);d.setDate(d.getDate()+w*7+i);return toKST(d);})
                        .filter(ds=>records[ds]?.[h.id]?.done).length;
                      if(cnt>=h.target) achievedWeeks++;
                    }
                    const weekRate = allWeeks?achievedWeeks/allWeeks*100:0;
                    const streak = getStreak(h.id);
                    return (
                      <div key={h.id} style={{marginBottom:10,background:"#13131f",borderRadius:14,padding:"14px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:20}}>{h.emoji}</span>
                            <div>
                              <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:6}}>
                                {h.name}
                                {streak>=2&&<span style={{fontSize:10,color:"#FF6B6B",background:"#FF6B6B22",padding:"2px 6px",borderRadius:20}}>🔥{streak}일</span>}
                              </div>
                              <div style={{fontSize:10,color:"#555"}}>주 {h.target}회 목표</div>
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:18,fontWeight:800,color:cat.color}}>{yearDone}<span style={{fontSize:11,color:"#555",fontWeight:400}}>일</span></div>
                          </div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <div style={{background:"#0d0d14",borderRadius:10,padding:"10px"}}>
                            <div style={{fontSize:10,color:"#555",marginBottom:3}}>목표 달성 주</div>
                            <div style={{fontSize:16,fontWeight:700}}>{achievedWeeks}<span style={{fontSize:10,color:"#555",fontWeight:400}}>/{allWeeks}주</span></div>
                            <div style={{marginTop:5,height:3,background:"#1e1e2e",borderRadius:2}}>
                              <div style={{height:"100%",width:`${weekRate}%`,background:cat.color,borderRadius:2}}/>
                            </div>
                          </div>
                          <div style={{background:"#0d0d14",borderRadius:10,padding:"10px"}}>
                            <div style={{fontSize:10,color:"#555",marginBottom:3}}>주간 달성률</div>
                            <div style={{fontSize:16,fontWeight:700,color:weekRate>=70?cat.color:"#fff"}}>{Math.round(weekRate)}<span style={{fontSize:10,color:"#555",fontWeight:400}}>%</span></div>
                            {weekRate>=70&&<div style={{fontSize:9,color:cat.color,marginTop:3}}>🔥 잘 하고 있어요</div>}
                            {weekRate<50&&weekRate>0&&<div style={{fontSize:9,color:"#FF6B6B",marginTop:3}}>💪 더 노력해봐요</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ════ MANAGE ════ */}
        {view==="manage" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:700}}>카테고리 & 습관</div>
              <Btn small onClick={()=>{setModalData({name:"",emoji:"🏃",color:CAT_COLORS[0]});setModal("addCat");}}>+ 카테고리</Btn>
            </div>
            {cats.map(cat=>{
              const catH = habits.filter(h=>h.categoryId===cat.id);
              return (
                <div key={cat.id} style={{marginBottom:16,background:"#13131f",borderRadius:14,overflow:"hidden",border:"1px solid #1e1e2e"}}>
                  {/* Category header */}
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:cat.color+"18",borderBottom:"1px solid #1e1e2e"}}>
                    <span style={{fontSize:18}}>{cat.emoji}</span>
                    <span style={{fontWeight:700,color:cat.color,flex:1}}>{cat.name}</span>
                    <button onClick={()=>{setModalData({...cat});setModal("editCat");}} style={{background:"none",border:"none",color:"#666",fontSize:13,cursor:"pointer",padding:"4px 8px"}}>수정</button>
                    <button onClick={()=>deleteCat(cat.id)} style={{background:"none",border:"none",color:"#FF6B6B88",fontSize:13,cursor:"pointer",padding:"4px 8px"}}>삭제</button>
                  </div>
                  {/* Habits */}
                  {catH.map(h=>(
                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:"11px 14px",borderBottom:"1px solid #1a1a28"}}>
                      <span style={{fontSize:16}}>{h.emoji}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:600}}>{h.name}</div>
                        <div style={{fontSize:11,color:"#555"}}>주 {h.target}회 목표</div>
                      </div>
                      {/* 카테고리 이동 버튼 */}
                      <button
                        title="카테고리 이동"
                        onClick={()=>{setModalData({...h});setModal("moveHabit");}}
                        style={{background:"#1e1e2e",border:"1px solid #2a2a3e",borderRadius:7,color:"#888",fontSize:11,cursor:"pointer",padding:"5px 8px",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                        이동
                      </button>
                      <button onClick={()=>{setModalData({...h});setModal("editHabit");}} style={{background:"none",border:"none",color:"#666",fontSize:12,cursor:"pointer",padding:"4px 6px"}}>수정</button>
                      <button onClick={()=>deleteHabit(h.id)} style={{background:"none",border:"none",color:"#FF6B6B88",fontSize:12,cursor:"pointer",padding:"4px 6px"}}>삭제</button>
                    </div>
                  ))}
                  {/* Add habit btn */}
                  <button onClick={()=>{setModalData({name:"",emoji:"✏️",categoryId:cat.id,target:3});setModal("addHabit");}}
                    style={{width:"100%",padding:"10px",background:"none",border:"none",color:"#555",fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                    + 습관 추가
                  </button>
                </div>
              );
            })}
            {cats.length===0 && (
              <div style={{textAlign:"center",padding:"40px 0",color:"#444"}}>
                <div style={{fontSize:32,marginBottom:10}}>🗂️</div>
                <div style={{fontSize:14}}>카테고리를 추가해보세요</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* 카테고리 추가 */}
      {modal==="addCat" && (
        <Modal title="카테고리 추가" onClose={()=>setModal(null)}>
          <Input label="이름" value={modalData.name} onChange={v=>setModalData(p=>({...p,name:v}))} placeholder="예: 건강" />
          <div style={{fontSize:12,color:"#888",marginBottom:6}}>이모지</div>
          <EmojiPicker value={modalData.emoji} onChange={e=>setModalData(p=>({...p,emoji:e}))} list={CAT_EMOJIS}/>
          <div style={{fontSize:12,color:"#888",margin:"14px 0 6px"}}>색상</div>
          <ColorPicker value={modalData.color} onChange={c=>setModalData(p=>({...p,color:c}))}/>
          <div style={{display:"flex",gap:8,marginTop:20}}>
            <Btn secondary onClick={()=>setModal(null)}>취소</Btn>
            <Btn onClick={()=>modalData.name.trim()&&addCat(modalData)}>추가</Btn>
          </div>
        </Modal>
      )}

      {/* 카테고리 수정 */}
      {modal==="editCat" && (
        <Modal title="카테고리 수정" onClose={()=>setModal(null)}>
          <Input label="이름" value={modalData.name} onChange={v=>setModalData(p=>({...p,name:v}))} placeholder="카테고리 이름"/>
          <div style={{fontSize:12,color:"#888",marginBottom:6}}>이모지</div>
          <EmojiPicker value={modalData.emoji} onChange={e=>setModalData(p=>({...p,emoji:e}))} list={CAT_EMOJIS}/>
          <div style={{fontSize:12,color:"#888",margin:"14px 0 6px"}}>색상</div>
          <ColorPicker value={modalData.color} onChange={c=>setModalData(p=>({...p,color:c}))}/>
          <div style={{display:"flex",gap:8,marginTop:20}}>
            <Btn secondary onClick={()=>setModal(null)}>취소</Btn>
            <Btn onClick={()=>modalData.name.trim()&&editCat(modalData)}>저장</Btn>
          </div>
        </Modal>
      )}

      {/* 습관 추가 */}
      {modal==="addHabit" && (
        <Modal title="습관 추가" onClose={()=>setModal(null)}>
          <Input label="습관 이름" value={modalData.name} onChange={v=>setModalData(p=>({...p,name:v}))} placeholder="예: 러닝"/>
          <div style={{fontSize:12,color:"#888",marginBottom:6}}>이모지</div>
          <EmojiPicker value={modalData.emoji} onChange={e=>setModalData(p=>({...p,emoji:e}))} list={HABIT_EMOJIS}/>
          <div style={{marginTop:14}}>
            <div style={{fontSize:12,color:"#888",marginBottom:6}}>카테고리</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {cats.map(c=>(
                <button key={c.id} onClick={()=>setModalData(p=>({...p,categoryId:c.id}))}
                  style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${modalData.categoryId===c.id?c.color:"#2a2a3e"}`,background:modalData.categoryId===c.id?c.color+"22":"none",color:modalData.categoryId===c.id?c.color:"#888",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginTop:14}}>
            <div style={{fontSize:12,color:"#888",marginBottom:6}}>주간 목표 횟수</div>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4,5,6,7].map(n=>(
                <button key={n} onClick={()=>setModalData(p=>({...p,target:n}))}
                  style={{width:36,height:36,borderRadius:8,border:`1px solid ${modalData.target===n?"#4ECDC4":"#2a2a3e"}`,background:modalData.target===n?"#4ECDC422":"none",color:modalData.target===n?"#4ECDC4":"#888",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:20}}>
            <Btn secondary onClick={()=>setModal(null)}>취소</Btn>
            <Btn onClick={()=>modalData.name.trim()&&addHabit(modalData)}>추가</Btn>
          </div>
        </Modal>
      )}

      {/* 습관 수정 */}
      {modal==="editHabit" && (
        <Modal title="습관 수정" onClose={()=>setModal(null)}>
          <Input label="습관 이름" value={modalData.name} onChange={v=>setModalData(p=>({...p,name:v}))} placeholder="습관 이름"/>
          <div style={{fontSize:12,color:"#888",marginBottom:6}}>이모지</div>
          <EmojiPicker value={modalData.emoji} onChange={e=>setModalData(p=>({...p,emoji:e}))} list={HABIT_EMOJIS}/>
          <div style={{marginTop:14}}>
            <div style={{fontSize:12,color:"#888",marginBottom:6}}>카테고리</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {cats.map(c=>(
                <button key={c.id} onClick={()=>setModalData(p=>({...p,categoryId:c.id}))}
                  style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${modalData.categoryId===c.id?c.color:"#2a2a3e"}`,background:modalData.categoryId===c.id?c.color+"22":"none",color:modalData.categoryId===c.id?c.color:"#888",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginTop:14}}>
            <div style={{fontSize:12,color:"#888",marginBottom:6}}>주간 목표 횟수</div>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4,5,6,7].map(n=>(
                <button key={n} onClick={()=>setModalData(p=>({...p,target:n}))}
                  style={{width:36,height:36,borderRadius:8,border:`1px solid ${modalData.target===n?"#4ECDC4":"#2a2a3e"}`,background:modalData.target===n?"#4ECDC422":"none",color:modalData.target===n?"#4ECDC4":"#888",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:20}}>
            <Btn secondary onClick={()=>setModal(null)}>취소</Btn>
            <Btn onClick={()=>modalData.name.trim()&&editHabit(modalData)}>저장</Btn>
          </div>
        </Modal>
      )}

      {/* 카테고리 이동 */}
      {modal==="moveHabit" && (
        <Modal title={`📦 "${modalData.name}" 이동`} onClose={()=>setModal(null)}>
          <div style={{fontSize:12,color:"#666",marginBottom:16}}>이동할 카테고리를 선택하세요</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {cats.map(c=>{
              const isCurrent = c.id===modalData.categoryId;
              return (
                <button key={c.id} onClick={()=>{ if(!isCurrent){ editHabit({...modalData,categoryId:c.id}); } }}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:12,border:`1px solid ${isCurrent?c.color+"66":"#2a2a3e"}`,background:isCurrent?c.color+"18":"#0d0d14",cursor:isCurrent?"default":"pointer",fontFamily:"inherit",transition:"all 0.15s",opacity:isCurrent?0.6:1}}>
                  <span style={{fontSize:22}}>{c.emoji}</span>
                  <div style={{flex:1,textAlign:"left"}}>
                    <div style={{fontSize:15,fontWeight:700,color:isCurrent?c.color:"#fff"}}>{c.name}</div>
                    <div style={{fontSize:11,color:"#555",marginTop:1}}>{habits.filter(h=>h.categoryId===c.id).length}개 습관</div>
                  </div>
                  {isCurrent
                    ? <span style={{fontSize:11,color:c.color,background:c.color+"22",padding:"3px 10px",borderRadius:20}}>현재</span>
                    : <span style={{fontSize:16,color:"#555"}}>→</span>
                  }
                </button>
              );
            })}
          </div>
          <div style={{marginTop:16}}>
            <Btn secondary onClick={()=>setModal(null)}>취소</Btn>
          </div>
        </Modal>
      )}

      {/* 메모 */}
      {modal==="memo" && (
        <Modal title={`💬 ${modalData.name} 메모`} onClose={()=>setModal(null)}>
          <div style={{fontSize:12,color:"#666",marginBottom:8}}>오늘의 기록을 남겨보세요</div>
          <textarea value={memoText} onChange={e=>setMemoText(e.target.value)} placeholder="예: 5km 달렸음, 무릎 살짝 아팠음..."
            style={{width:"100%",minHeight:100,background:"#0d0d14",border:"1px solid #2a2a3e",borderRadius:10,padding:"12px",color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit",resize:"vertical",lineHeight:1.6}}/>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <Btn secondary onClick={()=>setModal(null)}>취소</Btn>
            <Btn onClick={()=>saveMemo(modalData.habitId,memoText)}>저장</Btn>
          </div>
        </Modal>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#13131f",borderTop:"1px solid #1e1e2e",display:"flex"}}>
        {[["today","오늘","◉"],["week","주간","▦"],["month","월간","▣"],["year","연간","◈"],["manage","관리","⚙"]].map(([v,l,ic])=>(
          <button key={v} className={`tab${view===v?" on":""}`} onClick={()=>setView(v)}>
            <span style={{fontSize:14}}>{ic}</span><span>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
