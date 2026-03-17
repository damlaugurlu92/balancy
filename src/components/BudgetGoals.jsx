import { useState } from "react";

const EXPENSE_CATS = [
  { key: "Rent",          icon: "🏠" },
  { key: "Groceries",     icon: "🛒" },
  { key: "Transport",     icon: "🚗" },
  { key: "Bills",         icon: "💡" },
  { key: "Restaurant",    icon: "🍽" },
  { key: "Health",        icon: "❤️" },
  { key: "Clothing",      icon: "👗" },
  { key: "Entertainment", icon: "🎬" },
  { key: "Education",     icon: "📚" },
  { key: "Technology",    icon: "📱" },
  { key: "Other Expense", icon: "💸" },
];

export default function BudgetGoals({ transactions, lang, t }) {
  const storageKey = "balancy_budgets";
  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
  });
  const [editing, setEditing] = useState(null);
  const [inputVal, setInputVal] = useState("");

  const saveBudget = (cat) => {
    const val = parseFloat(inputVal);
    if (!val || val <= 0) { setEditing(null); return; }
    const updated = { ...budgets, [cat]: val };
    setBudgets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setEditing(null);
    setInputVal("");
  };

  const removeBudget = (cat) => {
    const updated = { ...budgets };
    delete updated[cat];
    setBudgets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const spentMap = {};
  transactions.filter(tx => tx.type === "expense").forEach(tx => {
    spentMap[tx.category] = (spentMap[tx.category] || 0) + tx.amount;
  });

  const title = lang === "tr" ? "Bütçe Hedefleri" : "Budget Goals";
  const addLabel = lang === "tr" ? "Limit ekle" : "Add limit";
  const noGoals = lang === "tr" ? "Henüz hedef eklenmedi. Kategori seçerek başla." : "No goals yet. Click a category to add a limit.";

  const hasBudgets = Object.keys(budgets).length > 0;

  return (
    <div className="budget-section">
      {/* Kategori seçici */}
      <div className="budget-cats">
        {EXPENSE_CATS.map(c => (
          <button
            key={c.key}
            className={`cat-btn ${budgets[c.key] ? "cat-btn--active" : ""}`}
            onClick={() => { setEditing(c.key); setInputVal(budgets[c.key] || ""); }}
          >
            {c.icon} {t(`categories.${c.key}`, lang)}
          </button>
        ))}
      </div>

      {/* Limit giriş */}
      {editing && (
        <div className="budget-input-row">
          <span className="budget-input-label">
            {t(`categories.${editing}`, lang)} {lang === "tr" ? "limiti (₺)" : "limit (₺)"}
          </span>
          <input
            className="tx-input"
            type="number"
            min="1"
            placeholder="₺"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveBudget(editing)}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="submit-btn submit-btn--income" style={{ flex: 1, padding: "8px" }} onClick={() => saveBudget(editing)}>
              {lang === "tr" ? "Kaydet" : "Save"}
            </button>
            {budgets[editing] && (
              <button className="submit-btn submit-btn--expense" style={{ padding: "8px 12px" }} onClick={() => { removeBudget(editing); setEditing(null); }}>
                {lang === "tr" ? "Sil" : "Del"}
              </button>
            )}
            <button className="toggle-btn" style={{ padding: "8px 12px" }} onClick={() => setEditing(null)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* İlerleme çubukları */}
      {hasBudgets ? (
        <div className="budget-bars">
          {Object.entries(budgets).map(([cat, limit]) => {
            const spent = spentMap[cat] || 0;
            const pct   = Math.min((spent / limit) * 100, 100);
            const over  = spent > limit;
            return (
              <div key={cat} className="budget-bar-item">
                <div className="budget-bar-header">
                  <span className="budget-bar-cat">{t(`categories.${cat}`, lang)}</span>
                  <span className={`budget-bar-amounts ${over ? "budget-over" : ""}`}>
                    ₺{spent.toLocaleString("tr-TR", { minimumFractionDigits: 0 })} / ₺{limit.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                    {over && <span className="budget-over-tag"> {lang === "tr" ? "Aşıldı!" : "Over!"}</span>}
                  </span>
                </div>
                <div className="budget-track">
                  <div
                    className={`budget-fill ${over ? "budget-fill--over" : pct > 80 ? "budget-fill--warn" : "budget-fill--ok"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="no-tx">{noGoals}</p>
      )}
    </div>
  );
}
