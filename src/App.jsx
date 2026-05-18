import { useState, useEffect, useRef } from "react";

const GOALS = { protein: 180, carbs: 188, fat: 60, currentWeight: 178, goalWeight: 165 };

const QUICK_ADDS = [
  { name: "2 Eggs", protein: 12, carbs: 1, fat: 10, calories: 140 },
  { name: "Siggis Vanilla", protein: 16, carbs: 9, fat: 0, calories: 100 },
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

function Ring({ value, goal, label, color, unit }) {
  unit = unit || "g";
  var pct = Math.min((value / goal) * 100, 100);
  var r = 36;
  var circ = 2 * Math.PI * r;
  var dash = (pct / 100) * circ;
  return (
    React.createElement("div", { style: { display:"flex", flexDirection:"column", alignItems:"center", gap:4 } },
      React.createElement("svg", { width:"88", height:"88", style: { transform:"rotate(-90deg)" } },
        React.createElement("circle", { cx:"44", cy:"44", r:r, fill:"none", stroke:"#1e293b", strokeWidth:"8" }),
        React.createElement("circle", { cx:"44", cy:"44", r:r, fill:"none", stroke:color, strokeWidth:"8",
          strokeDasharray: dash + " " + circ, strokeLinecap:"round",
          style: { transition:"stroke-dasharray 0.6s ease" } })
      ),
      React.createElement("div", { style: { marginTop:-66, marginBottom:18, textAlign:"center", zIndex:1 } },
        React.createElement("div", { style: { fontSize:18, fontWeight:800, color:"#f1f5f9", fontFamily:"monospace" } },
          value, React.createElement("span", { style: { fontSize:11, color:"#94a3b8" } }, unit)
        ),
        React.createElement("div", { style: { fontSize:9, color:"#64748b", letterSpacing:1, textTransform:"uppercase" } },
          "of " + goal + unit
        )
      ),
      React.createElement("div", { style: { fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:1, textTransform:"uppercase" } }, label)
    )
  );
}

export default function MacroTracker() {
  var stateEntries = useState([]);
  var entries = stateEntries[0];
  var setEntries = stateEntries[1];
  var stateAllDays = useState({});
  var allDays = stateAllDays[0];
  var setAllDays = stateAllDays[1];
  var stateInput = useState("");
  var input = stateInput[0];
  var setInput = stateInput[1];
  var stateLoading = useState(false);
  var loading = stateLoading[0];
  var setLoading = stateLoading[1];
  var stateAiStatus = useState("");
  var aiStatus = stateAiStatus[0];
  var setAiStatus = stateAiStatus[1];
  var stateWorkout = useState(true);
  var workoutDay = stateWorkout[0];
  var setWorkoutDay = stateWorkout[1];
  var stateViewDate = useState(todayKey());
  var viewDate = stateViewDate[0];
  var setViewDate = stateViewDate[1];
  var stateHistory = useState(false);
  var showHistory = stateHistory[0];
  var setShowHistory = stateHistory[1];
  var stateInit = useState(false);
  var initialized = stateInit[0];
  var setInitialized = stateInit[1];
  var inputRef = useRef();
  var calorieGoal = workoutDay ? 2050 : 1850;

  useEffect(function() {
    try {
      var saved = localStorage.getItem("macrotracker-all-days");
      if (saved) {
        var data = JSON.parse(saved);
        setAllDays(data);
        setEntries(data[todayKey()] || []);
      }
    } catch(e) {}
    setInitialized(true);
  }, []);

  useEffect(function() {
    if (!initialized) return;
    try {
      var updated = Object.assign({}, allDays);
      updated[viewDate] = entries;
      setAllDays(updated);
      localStorage.setItem("macrotracker-all-days", JSON.stringify(updated));
    } catch(e) {}
  }, [entries]);

  var totals = entries.reduce(function(acc, e) {
    return {
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
      calories: acc.calories + (e.calories || 0),
    };
  }, { protein:0, carbs:0, fat:0, calories:0 });

  async function lookupFood(foodText) {
    setLoading(true);
    setAiStatus("Looking up macros...");
    try {
      var res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: foodText })
      });
      var parsed = await res.json();
      setAiStatus("");
      return parsed;
    } catch(e) {
      setAiStatus("Could not look up that food. Try again.");
      setTimeout(function() { setAiStatus(""); }, 3000);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!input.trim()) return;
    var food = await lookupFood(input.trim());
    if (food) {
      setEntries(function(prev) { return prev.concat([Object.assign({}, food, { id: Date.now() })]); });
      setInput("");
    }
  }

  function handleQuickAdd(item) {
    setEntries(function(prev) { return prev.concat([Object.assign({}, item, { id: Date.now() })]); });
  }

  function removeEntry(id) {
    setEntries(function(prev) { return prev.filter(function(e) { return e.id !== id; }); });
  }

  function switchDay(date) {
    setViewDate(date);
    setEntries(allDays[date] || []);
    setShowHistory(false);
  }

  var calPct = Math.min((totals.calories / calorieGoal) * 100, 100);
  var remainingProtein = Math.max(GOALS.protein - totals.protein, 0);
  var remainingCal = Math.max(calorieGoal - totals.calories, 0);
  var historyDates = Object.keys(allDays).sort().reverse().filter(function(d) { return d !== todayKey(); });

  return (
    React.createElement("div", { style: { minHeight:"100vh", background:"#0a0f1a", color:"#f1f5f9", fontFamily:"sans-serif", paddingBottom:80 } },
      React.createElement("div", { style: { background:"linear-gradient(135deg,#0f172a,#1e293b)", borderBottom:"1px solid #1e293b", padding:"20px 20px 16px", position:"sticky", top:0, zIndex:10 } },
        React.createElement("div", { style: { display:"flex", justifyContent:"space-between", alignItems:"flex-start" } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize:11, letterSpacing:3, color:"#22d3ee", textTransform:"uppercase", fontWeight:700, marginBottom:2 } }, "MACRO TRACKER"),
            React.createElement("div", { style: { fontSize:22, fontWeight:800, color:"#f1f5f9", fontFamily:"monospace" } }, viewDate === todayKey() ? "Today" : viewDate)
          ),
          React.createElement("div", { style: { display:"flex", gap:8 } },
            React.createElement("button", { onClick: function() { setWorkoutDay(function(w) { return !w; }); }, style: { padding:"6px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, background:workoutDay?"#22d3ee22":"#1e293b", color:workoutDay?"#22d3ee":"#64748b" } }, workoutDay ? "WORKOUT" : "REST DAY"),
            React.createElement("button", { onClick: function() { setShowHistory(function(h) { return !h; }); }, style: { padding:"6px 12px", borderRadius:20, border:"1px solid #1e293b", cursor:"pointer", fontSize:11, background:"transparent", color:"#64748b" } }, showHistory ? "CLOSE" : "HISTORY")
          )
        ),
        React.createElement("div", { style: { marginTop:14 } },
          React.createElement("div", { style: { display:"flex", justifyContent:"space-between", marginBottom:6 } },
            React.createElement("span", { style: { fontSize:11, color:"#64748b" } }, "CALORIES"),
            React.createElement("span", { style: { fontSize:11, fontFamily:"monospace", color:calPct>=100?"#ef4444":"#22d3ee" } }, totals.calories + " / " + calorieGoal + " kcal")
          ),
          React.createElement("div", { style: { height:6, background:"#1e293b", borderRadius:3, overflow:"hidden" } },
            React.createElement("div", { style: { height:"100%", width:calPct+"%", borderRadius:3, background:calPct>=100?"#ef4444":calPct>=75?"#22c55e":"#22d3ee", transition:"width 0.6s ease" } })
          ),
          React.createElement("div", { style: { fontSize:10, color:"#475569", marginTop:4, textAlign:"right" } }, remainingCal > 0 ? remainingCal + " kcal remaining" : "Goal reached!")
        )
      ),

      showHistory ? React.createElement("div", { style: { background:"#0f172a", borderBottom:"1px solid #1e293b", padding:"12px 20px" } },
        React.createElement("div", { style: { fontSize:11, color:"#64748b", marginBottom:10, textTransform:"uppercase", letterSpacing:2 } }, "Past Days"),
        historyDates.length === 0 ? React.createElement("div", { style: { color:"#475569", fontSize:13 } }, "No history yet") : null,
        historyDates.map(function(d) {
          var dt = allDays[d] || [];
          var dp = dt.reduce(function(a,e) { return { protein:a.protein+e.protein, calories:a.calories+e.calories }; }, { protein:0, calories:0 });
          return React.createElement("button", { key:d, onClick: function() { switchDay(d); }, style: { display:"flex", justifyContent:"space-between", width:"100%", padding:"10px 0", background:"transparent", border:"none", borderBottom:"1px solid #1e293b", cursor:"pointer", color:"#f1f5f9" } },
            React.createElement("span", { style: { fontSize:13, fontFamily:"monospace" } }, d),
            React.createElement("span", { style: { fontSize:11, color:"#64748b" } }, dp.protein + "g protein / " + dp.calories + " kcal")
          );
        }),
        viewDate !== todayKey() ? React.createElement("button", { onClick: function() { switchDay(todayKey()); }, style: { marginTop:10, padding:"8px 16px", background:"#22d3ee22", color:"#22d3ee", border:"none", borderRadius:20, cursor:"pointer", fontSize:11, fontWeight:700 } }, "Back to Today") : null
      ) : null,

      React.createElement("div", { style: { padding:"20px 20px 0" } },
        React.createElement("div", { style: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", background:"#0f172a", borderRadius:16, padding:"20px 10px", border:"1px solid #1e293b", marginBottom:20 } },
          React.createElement(Ring, { value:Math.round(totals.protein), goal:GOALS.protein, label:"Protein", color:"#22d3ee" }),
          React.createElement(Ring, { value:Math.round(totals.carbs), goal:GOALS.carbs, label:"Carbs", color:"#f59e0b" }),
          React.createElement(Ring, { value:Math.round(totals.fat), goal:GOALS.fat, label:"Fat", color:"#a78bfa" })
        ),

        remainingProtein > 0 ?
          React.createElement("div", { style: { background:"#0f172a", border:"1px solid #22d3ee33", borderRadius:12, padding:"10px 14px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" } },
            React.createElement("span", { style: { fontSize:12, color:"#94a3b8" } }, "Protein remaining"),
            React.createElement("span", { style: { fontSize:16, fontWeight:800, color:"#22d3ee", fontFamily:"monospace" } }, remainingProtein + "g")
          ) :
          React.createElement("div", { style: { background:"#052e16", border:"1px solid #22c55e44", borderRadius:12, padding:"10px 14px", marginBottom:16, textAlign:"center", fontSize:13, color:"#22c55e", fontWeight:700 } }, "Protein goal crushed!"),

        React.createElement("div", { style: { background:"#0f172a", border:"1px solid #1e293b", borderRadius:16, padding:16, marginBottom:20 } },
          React.createElement("div", { style: { fontSize:11, letterSpacing:2, color:"#64748b", marginBottom:10, textTransform:"uppercase" } }, "Log Food"),
          React.createElement("div", { style: { display:"flex", gap:8 } },
            React.createElement("input", { ref:inputRef, value:input, onChange: function(e) { setInput(e.target.value); }, onKeyDown: function(e) { if(e.key==="Enter" && !loading) handleAdd(); },
              placeholder:"e.g. 6oz grilled chicken breast",
              style: { flex:1, background:"#1e293b", border:"1px solid #334155", borderRadius:10, padding:"10px 14px", color:"#f1f5f9", fontSize:14, outline:"none" } }),
            React.createElement("button", { onClick:handleAdd, disabled:loading || !input.trim(), style: { padding:"10px 18px", background:loading?"#1e293b":"#22d3ee", color:loading?"#64748b":"#0a0f1a", border:"none", borderRadius:10, cursor:loading?"not-allowed":"pointer", fontSize:13, fontWeight:800 } }, loading ? "..." : "ADD")
          ),
          aiStatus ? React.createElement("div", { style: { fontSize:11, color:"#22d3ee", marginTop:8, fontStyle:"italic" } }, aiStatus) : null
        ),

        React.createElement("div", { style: { marginBottom:20 } },
          React.createElement("div", { style: { fontSize:11, letterSpacing:2, color:"#64748b", marginBottom:10, textTransform:"uppercase" } }, "Quick Add Favorites"),
          React.createElement("div", { style: { display:"flex", flexWrap:"wrap", gap:8 } },
            QUICK_ADDS.map(function(item) {
              return React.createElement("button", { key:item.name, onClick: function() { handleQuickAdd(item); }, style: { padding:"7px 12px", background:"#0f172a", border:"1px solid #1e293b", borderRadius:20, color:"#94a3b8", fontSize:11, cursor:"pointer", fontWeight:600 } },
                item.name + " ", React.createElement("span", { style: { color:"#475569" } }, item.protein + "g")
              );
            })
          )
        ),

        React.createElement("div", null,
          React.createElement("div", { style: { fontSize:11, letterSpacing:2, color:"#64748b", marginBottom:10, textTransform:"uppercase" } }, viewDate === todayKey() ? "Today's Log" : "Log for " + viewDate),
          entries.length === 0 ? React.createElement("div", { style: { background:"#0f172a", border:"1px dashed #1e293b", borderRadius:12, padding:24, textAlign:"center", color:"#475569", fontSize:13 } }, "No food logged yet. Type above or tap a quick add!") : null,
          entries.map(function(entry, i) {
            return React.createElement("div", { key:entry.id || i, style: { background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" } },
              React.createElement("div", { style: { flex:1 } },
                React.createElement("div", { style: { fontSize:14, fontWeight:600, color:"#f1f5f9", marginBottom:4 } }, entry.name),
                React.createElement("div", { style: { display:"flex", gap:12 } },
                  React.createElement("span", { style: { fontSize:11, color:"#22d3ee" } }, entry.protein + "g P"),
                  React.createElement("span", { style: { fontSize:11, color:"#f59e0b" } }, entry.carbs + "g C"),
                  React.createElement("span", { style: { fontSize:11, color:"#a78bfa" } }, entry.fat + "g F"),
                  React.createElement("span", { style: { fontSize:11, color:"#64748b" } }, entry.calories + " kcal")
                )
              ),
              viewDate === todayKey() ? React.createElement("button", { onClick: function() { removeEntry(entry.id); }, style: { background:"transparent", border:"none", color:"#334155", cursor:"pointer", fontSize:18, padding:"0 4px" } }, "x") : null
            );
          })
        ),

        React.createElement("div", { style: { background:"#0f172a", border:"1px solid #1e293b", borderRadius:16, padding:16, marginTop:20 } },
          React.createElement("div", { style: { fontSize:11, letterSpacing:2, color:"#64748b", marginBottom:12, textTransform:"uppercase" } }, "Weight Goal"),
          React.createElement("div", { style: { display:"flex", justifyContent:"space-between" } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontSize:28, fontWeight:800, fontFamily:"monospace", color:"#f1f5f9" } }, GOALS.currentWeight, React.createElement("span", { style: { fontSize:13, color:"#64748b" } }, " lbs")),
              React.createElement("div", { style: { fontSize:11, color:"#64748b" } }, "Current")
            ),
            React.createElement("div", { style: { textAlign:"right" } },
              React.createElement("div", { style: { fontSize:28, fontWeight:800, fontFamily:"monospace", color:"#22c55e" } }, GOALS.goalWeight, React.createElement("span", { style: { fontSize:13, color:"#64748b" } }, " lbs")),
              React.createElement("div", { style: { fontSize:11, color:"#64748b" } }, "Goal")
            )
          ),
          React.createElement("div", { style: { fontSize:11, color:"#475569", textAlign:"center", marginTop:8 } }, (GOALS.currentWeight - GOALS.goalWeight) + " lbs to go / ~8-12 weeks at your deficit")
        )
      )
    )
  );
}
