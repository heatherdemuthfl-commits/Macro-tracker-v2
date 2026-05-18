import { useState, useEffect } from "react";

const GOALS = { protein: 180, carbs: 188, fat: 60 };
const CALORIE_GOAL = 2050;

const QUICK_ADDS = [
  { name: "2 Eggs", protein: 12, carbs: 1, fat: 10, calories: 140 },
  { name: "Siggis Vanilla", protein: 16, carbs: 9, fat: 0, calories: 100 },
  { name: "Chomps Stick", protein: 9, carbs: 0, fat: 6, calories: 90 },
  { name: "RX Bar Choc Sea Salt", protein: 12, carbs: 23, fat: 8, calories: 210 },
  { name: "Cottage Cheese half cup", protein: 14, carbs: 4, fat: 2, calories: 90 },
  { name: "Chicken Sausage", protein: 14, carbs: 1, fat: 7, calories: 120 },
  { name: "Strawberries 1 cup", protein: 1, carbs: 11, fat: 0, calories: 45 },
  { name: "Protein Shake", protein: 25, carbs: 5, fat: 2, calories: 130 },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [entries, setEntries] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mt-" + todayKey());
      if (saved) setEntries(JSON.parse(saved));
    } catch(e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mt-" + todayKey(), JSON.stringify(entries));
    } catch(e) {}
  }, [entries]);

  const totals = entries.reduce((a, e) => ({
    protein: a.protein + (e.protein || 0),
    carbs: a.carbs + (e.carbs || 0),
    fat: a.fat + (e.fat || 0),
    calories: a.calories + (e.calories || 0),
  }), { protein: 0, carbs: 0, fat: 0, calories: 0 });

  async function addFood() {
    if (!input.trim()) return;
    setLoading(true);
    setStatus("Looking up macros...");
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: input.trim() })
      });
      const food = await res.json();
      setEntries(prev => [...prev, { ...food, id: Date.now() }]);
      setInput("");
      setStatus("");
    } catch(e) {
      setStatus("Could not find that food. Try again.");
      setTimeout(() => setStatus(""), 3000);
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "#0a0f1a", minHeight: "100vh", color: "#f1f5f9", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ fontSize: 11, color: "#22d3ee", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Macro Tracker</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Today</div>

      <div style={{ background: "#0f172a", borderRadius: 12, padding: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#22d3ee" }}>{totals.calories}</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>of {CALORIE_GOAL} kcal</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#22d3ee" }}>{Math.round(totals.protein)}g</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>of {GOALS.protein}g pro</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>{Math.round(totals.carbs)}g</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>of {GOALS.carbs}g carbs</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#a78bfa" }}>{Math.round(totals.fat)}g</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>of {GOALS.fat}g fat</div>
        </div>
      </div>

      <div style={{ background: "#0f172a", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>Log Food</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && addFood()}
            placeholder="e.g. 6oz grilled chicken"
            style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#f1f5f9", fontSize: 14, outline: "none" }}
          />
          <button onClick={addFood} disabled={loading} style={{ padding: "10px 16px", background: "#22d3ee", color: "#0a0f1a", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
            {loading ? "..." : "ADD"}
          </button>
        </div>
        {status && <div style={{ fontSize: 11, color: "#22d3ee", marginTop: 8 }}>{status}</div>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>Quick Add</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {QUICK_ADDS.map(item => (
            <button key={item.name} onClick={() => setEntries(prev => [...prev, { ...item, id: Date.now() }])}
              style={{ padding: "6px 12px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>
              {item.name} <span style={{ color: "#475569" }}>{item.protein}g</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>Today's Log</div>
        {entries.length === 0 && <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 24 }}>No food logged yet</div>}
        {entries.map((e, i) => (
          <div key={e.id || i} style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{e.name}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ fontSize: 11, color: "#22d3ee" }}>{e.protein}g P</span>
                <span style={{ fontSize: 11, color: "#f59e0b" }}>{e.carbs}g C</span>
                <span style={{ fontSize: 11, color: "#a78bfa" }}>{e.fat}g F</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{e.calories} kcal</span>
              </div>
            </div>
            <button onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))}
              style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 18 }}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}
