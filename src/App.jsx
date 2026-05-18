import { useState, useEffect, useRef } from "react";

const GOALS = { protein: 180, carbs: 188, fat: 60, currentWeight: 178, goalWeight: 165 };

const QUICK_ADDS = [
  { name: "2 Eggs", protein: 12, carbs: 1, fat: 10, calories: 140 },
  { name: "Siggi's Vanilla", protein: 16, carbs: 9, fat: 0, calories: 100 },
  { name: "Chomps Stick", protein: 9, carbs: 0, fat: 6, calories: 90 },
  { name: "RX Bar Choc Sea Salt", protein: 12, carbs: 23, fat: 8, calories: 210 },
  { name: "Cottage Cheese 1/2c", protein: 14, carbs: 4, fat: 2, calories: 90 },
  { name: "Chicken Sausage", protein: 14, carbs: 1, fat: 7, calories: 120 },
  { name: "Strawberries 1c", protein: 1, carbs: 11, fat: 0, calories: 45 },
  { name: "Protein Shake", protein: 25, carbs: 5, fat: 2, calories: 130 },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function Ring({ value, goal, label, color, unit = "g" }) {
  const pct = Math.min((value / goal) * 100, 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width="88" height="88" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ marginTop:-66, marginBottom:18, textAlign:"center", zIndex:1 }}>
        <div style={{ fontSize:18, fontWeight:800, color:"#f1f5f9", fontFamily:"monospace" }}>
          {value}<span style={{ fontSize:11, color:"#94a3b8" }}>{unit}</span>
        </div>
        <div style={{ fontSize:9, color:"#64748b", letterSpacing:1, textTransform:"uppercase" }}>
          of {goal}{unit}
        </div>
      </div>
      <div style={{ fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:1, textTransform:"uppercase" }}>
        {label}
      </div>
    </div>
  );
}

export default function MacroTracker() {
  const [entries, setEntries] = useState([]);
  const [allDays, setAllDays] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [workoutDay, setWorkoutDay] = useState(true);
  const [viewDate, setViewDate] = useState(todayKey());
  const [showHistory, setShowHistory] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const inputRef = useRef();
  const calorieGoal = workoutDay ? 2050 : 1850;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("macrotracker-all-days");
      if (saved) {
        const data = JSON.parse(saved);
        setAllDays(data);
        setEntries(data[todayKey()] || []);
      }
    } catch(e) {}
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    try {
      const updated = { ...allDays, [viewDate]: entries };
      setAllDays(updated);
      localStorage.setItem("macrotracker-all-days", JSON.stringify(updated));
    } catch(e) {}
  }, [entries]);

  const totals = entries.reduce(
    (acc, e) => ({
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
      calories: acc.calories + (e.calories || 0),
    }),
    { protein:​​​​​​​​​​​​​​​​
