import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const STORAGE_KEY = "balancy_recurring";

export default function RecurringManager({ lang, t }) {
  const [list, setList]         = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [open, setOpen]         = useState(false);
  const [description, setDesc]  = useState("");
  const [amount, setAmount]     = useState("");
  const [category, setCat]      = useState("");
  const [type, setType]         = useState("expense");

  // Her ay başında otomatik ekle
  useEffect(() => {
    const lastRun = localStorage.getItem("balancy_recurring_lastrun");
    const now     = new Date();
    const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
    if (lastRun === thisMonth || list.length === 0) return;

    const today = now.toISOString().split("T")[0];
    list.forEach(async (item) => {
      await addDoc(collection(db, "transactions"), {
        userId: "default",
        type: item.type,
        description: item.description + (lang === "tr" ? " (Otomatik)" : " (Auto)"),
        amount: item.amount,
        category: item.category,
        txDate: today,
        createdAt: serverTimestamp(),
      });
    });
    localStorage.setItem("balancy_recurring_lastrun", thisMonth);
  }, [list]);

  const addItem = () => {
    if (!description.trim() || !amount || !category) return;
    const updated = [...list, { description: description.trim(), amount: parseFloat(amount), category, type }];
    setList(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDesc(""); setAmount(""); setCat(""); setType("expense");
    setOpen(false);
  };

  const removeItem = (i) => {
    const updated = list.filter((_, idx) => idx !== i);
    setList(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const CATS = type === "income"
    ? ["Salary","Freelance","Investment","Rental Income","Gift","Other Income"]
    : ["Rent","Groceries","Transport","Bills","Restaurant","Health","Clothing","Entertainment","Education","Technology","Other Expense"];

  const title     = lang === "tr" ? "Tekrarlayan İşlemler" : "Recurring Transactions";
  const addBtn    = lang === "tr" ? "+ Yeni Ekle" : "+ Add New";
  const empty     = lang === "tr" ? "Henüz tekrarlayan işlem yok." : "No recurring transactions yet.";
  const autoNote  = lang === "tr" ? "Her ay başında otomatik eklenir." : "Added automatically each month.";

  return (
    <div className="recurring-section">
      <div className="recurring-header">
        <p className="recurring-note">{autoNote}</p>
        <button className="cat-btn" onClick={() => setOpen(o => !o)}>{addBtn}</button>
      </div>

      {open && (
        <div className="recurring-form">
          <div className="type-toggle" style={{ marginBottom: 8 }}>
            <button type="button" className={`toggle-btn ${type === "income" ? "active active--income" : ""}`} onClick={() => { setType("income"); setCat(""); }}>
              {t("income", lang)}
            </button>
            <button type="button" className={`toggle-btn ${type === "expense" ? "active active--expense" : ""}`} onClick={() => { setType("expense"); setCat(""); }}>
              {t("expense", lang)}
            </button>
          </div>
          <input className="tx-input" placeholder={t("description", lang)} value={description} onChange={e => setDesc(e.target.value)} />
          <input className="tx-input" type="number" placeholder={`${t("amount", lang)} (₺)`} value={amount} onChange={e => setAmount(e.target.value)} />
          <select className="tx-input" value={category} onChange={e => setCat(e.target.value)}>
            <option value="">{t("selectCat", lang)}</option>
            {CATS.map(c => <option key={c} value={c}>{t(`categories.${c}`, lang)}</option>)}
          </select>
          <button
            className={`submit-btn ${type === "income" ? "submit-btn--income" : "submit-btn--expense"}`}
            onClick={addItem}
            disabled={!description.trim() || !amount || !category}
          >
            {lang === "tr" ? "Kaydet" : "Save"}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <p className="no-tx">{empty}</p>
      ) : (
        <ul className="tx-list">
          {list.map((item, i) => (
            <li key={i} className={`tx-item tx-item--${item.type}`}>
              <span className="tx-icon">↻</span>
              <div className="tx-info">
                <span className="tx-desc">{item.description}</span>
                <span className="tx-meta">{t(`categories.${item.category}`, lang)}</span>
              </div>
              <span className={`tx-amount tx-amount--${item.type}`}>
                {item.type === "income" ? "+" : "-"}₺{item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
              <button className="tx-delete" onClick={() => removeItem(i)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
