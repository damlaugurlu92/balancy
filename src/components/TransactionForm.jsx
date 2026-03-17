import { useState } from "react";

const INCOME_CATS = [
  { key: "Salary",        icon: "💼" },
  { key: "Freelance",     icon: "💻" },
  { key: "Investment",    icon: "📈" },
  { key: "Rental Income", icon: "🏠" },
  { key: "Gift",          icon: "🎁" },
  { key: "Other Income",  icon: "➕" },
];

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

const today = () => new Date().toISOString().split("T")[0];

export default function TransactionForm({ onAdd, lang, t }) {
  const [type, setType]        = useState("expense");
  const [description, setDesc] = useState("");
  const [amount, setAmount]    = useState("");
  const [category, setCat]     = useState("");
  const [txDate, setDate]      = useState(today());

  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || !category) return;
    onAdd({ type, description: description.trim(), amount: parseFloat(amount), category, txDate });
    setDesc("");
    setAmount("");
    setCat("");
    setDate(today());
  };

  return (
    <form className="tx-form" onSubmit={handleSubmit}>
      {/* Type toggle */}
      <div className="type-toggle">
        <button
          type="button"
          className={`toggle-btn ${type === "income" ? "active active--income" : ""}`}
          onClick={() => { setType("income"); setCat(""); }}
        >
          {t("income", lang)}
        </button>
        <button
          type="button"
          className={`toggle-btn ${type === "expense" ? "active active--expense" : ""}`}
          onClick={() => { setType("expense"); setCat(""); }}
        >
          {t("expense", lang)}
        </button>
      </div>

      {/* Description */}
      <input
        className="tx-input"
        type="text"
        placeholder={t("description", lang)}
        value={description}
        onChange={(e) => setDesc(e.target.value)}
        required
      />

      {/* Amount */}
      <input
        className="tx-input"
        type="number"
        placeholder={`${t("amount", lang)} (₺)`}
        value={amount}
        min="0.01"
        step="0.01"
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      {/* Date */}
      <input
        className="tx-input"
        type="date"
        value={txDate}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      {/* Quick category buttons */}
      <div className="quick-cats">
        {cats.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`cat-btn ${category === c.key ? "cat-btn--active" : ""}`}
            onClick={() => setCat(c.key)}
          >
            {c.icon} {t(`categories.${c.key}`, lang)}
          </button>
        ))}
      </div>

      <button
        type="submit"
        className={`submit-btn ${type === "income" ? "submit-btn--income" : "submit-btn--expense"}`}
        disabled={!description.trim() || !amount || !category}
      >
        {t("addTx", lang)}
      </button>
    </form>
  );
}
