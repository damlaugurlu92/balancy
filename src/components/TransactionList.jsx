const TYPE_ICON = { income: "↑", expense: "↓" };

export default function TransactionList({ transactions, onDelete, lang, t }) {
  if (transactions.length === 0) {
    return <p className="no-tx">{t("noTx", lang)}</p>;
  }

  return (
    <ul className="tx-list">
      {transactions.slice(0, 20).map((tx) => (
        <li key={tx.id} className={`tx-item tx-item--${tx.type}`}>
          <span className="tx-icon">{TYPE_ICON[tx.type]}</span>
          <div className="tx-info">
            <span className="tx-desc">{tx.description}</span>
            <span className="tx-meta">
              {t(`categories.${tx.category}`, lang)} · {tx.txDate}
            </span>
          </div>
          <span className={`tx-amount tx-amount--${tx.type}`}>
            {tx.type === "income" ? "+" : "-"}₺{tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </span>
          <button
            className="tx-delete"
            onClick={() => onDelete(tx.id)}
            title="Sil"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
