import { useState, useEffect } from "react";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp,
} from "firebase/firestore";
import { db } from "./lib/firebase";
import { t } from "./i18n/index.js";
import Dashboard from "./components/Dashboard";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import PieChart from "./components/PieChart";
import FilterBar from "./components/FilterBar";
import AnalysisPanel from "./components/AnalysisPanel";
import BudgetGoals from "./components/BudgetGoals";
import RecurringManager from "./components/RecurringManager";
import TrendChart from "./components/TrendChart";

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("month");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [lang, setLang] = useState(
    () => localStorage.getItem("davidata_lang") || "tr"
  );

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(
      collection(db, "transactions"),
      orderBy("txDate", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const toggleLang = () => {
    const next = lang === "tr" ? "en" : "tr";
    setLang(next);
    localStorage.setItem("davidata_lang", next);
  };

  const handleAdd = async (tx) => {
    await addDoc(collection(db, "transactions"), {
      ...tx,
      userId: "default",
      createdAt: serverTimestamp(),
    });
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "transactions", id));
  };

  const getFilterMeta = () => {
    const n = new Date();
    const currentMonth = n.getMonth();
    const currentYear  = n.getFullYear();
    if (filter === "month") {
      const start = new Date(selectedMonth.year, selectedMonth.month, 1).toISOString().split("T")[0];
      const end   = new Date(selectedMonth.year, selectedMonth.month + 1, 0).toISOString().split("T")[0];
      return { startDate: start, endDate: end, monthCount: 1 };
    }
    if (filter === "3months")   return { startDate: new Date(currentYear, currentMonth - 2, 1).toISOString().split("T")[0], endDate: null, monthCount: 3 };
    if (filter === "6months")   return { startDate: new Date(currentYear, currentMonth - 5, 1).toISOString().split("T")[0], endDate: null, monthCount: 6 };
    if (filter === "thisYear")  return { startDate: new Date(currentYear, 0, 1).toISOString().split("T")[0], endDate: null, monthCount: currentMonth + 1 };
    return { startDate: null, endDate: null, monthCount: 1 };
  };

  const { startDate, endDate, monthCount } = getFilterMeta();
  const filtered = transactions.filter((tx) => {
    if (startDate && tx.txDate < startDate) return false;
    if (endDate   && tx.txDate > endDate)   return false;
    return true;
  });

  const income  = filtered.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
  const expense = filtered.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
  const net     = income - expense;

  const avgIncome  = income  / monthCount;
  const avgExpense = expense / monthCount;
  const avgNet     = net     / monthCount;

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="header-logo">◈</span>
          <div>
            <h1 className="header-title">Balancy</h1>
            <p className="header-sub">{t("appSub", lang)}</p>
          </div>
        </div>
        <button className="lang-btn" onClick={toggleLang}>
          {lang === "tr" ? "EN" : "TR"}
        </button>
      </header>

      <FilterBar
        active={filter}
        onChange={setFilter}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        lang={lang}
      />

      <main className="main">
        <section className="left-panel">
          <Dashboard
            income={income}
            expense={expense}
            net={net}
            txCount={filtered.length}
            avgIncome={avgIncome}
            avgExpense={avgExpense}
            avgNet={avgNet}
            monthCount={monthCount}
            lang={lang}
            t={t}
          />
          <AnalysisPanel transactions={filtered} period={filter === "month" ? `${selectedMonth.year}-${selectedMonth.month + 1}` : filter} lang={lang} />

          <div className="section-title">{t("distribution", lang)}</div>
          <PieChart transactions={filtered} lang={lang} t={t} />
          <div className="section-title">{lang === "tr" ? "Son 6 Ay Trendi" : "6-Month Trend"}</div>
          <TrendChart transactions={transactions} lang={lang} t={t} />

          <div className="section-title">{lang === "tr" ? "Bütçe Hedefleri" : "Budget Goals"}</div>
          <BudgetGoals transactions={filtered} lang={lang} t={t} />

          <div className="section-title">{lang === "tr" ? "Tekrarlayan İşlemler" : "Recurring Transactions"}</div>
          <RecurringManager lang={lang} t={t} />

          <div className="section-title">{t("recentTx", lang)}</div>
          <TransactionList
            transactions={filtered}
            onDelete={handleDelete}
            lang={lang}
            t={t}
          />
        </section>

        <section className="right-panel">
          <div className="section-title">{t("addTx", lang)}</div>
          <TransactionForm onAdd={handleAdd} lang={lang} t={t} />
        </section>
      </main>
    </div>
  );
}
