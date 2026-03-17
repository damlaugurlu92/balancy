const fmt = (n) => "₺" + n.toLocaleString("tr-TR", { minimumFractionDigits: 2 });

export default function Dashboard({ income, expense, net, txCount, avgIncome, avgExpense, avgNet, monthCount, lang, t }) {
  const isPositive = net >= 0;
  const showAvg = monthCount > 1;

  const avgLabel = lang === "tr" ? "aylık ort." : "monthly avg.";

  return (
    <div className="dashboard-wrap">
      {/* Toplam kartlar */}
      <div className="dashboard-cards">
        <div className="card card--income">
          <span className="card-label">{t("income", lang)}</span>
          <span className="card-amount">{fmt(income)}</span>
          {showAvg && <span className="card-avg">{fmt(avgIncome)} {avgLabel}</span>}
        </div>
        <div className="card card--expense">
          <span className="card-label">{t("expense", lang)}</span>
          <span className="card-amount">{fmt(expense)}</span>
          {showAvg && <span className="card-avg">{fmt(avgExpense)} {avgLabel}</span>}
        </div>
        <div className={`card card--net ${isPositive ? "card--positive" : "card--negative"}`}>
          <span className="card-label">{t("net", lang)}</span>
          <span className="card-amount">{fmt(net)}</span>
          {showAvg && <span className="card-avg">{fmt(avgNet)} {avgLabel}</span>}
          <span className="card-sub">
            {isPositive ? t("surplus", lang) : t("deficit", lang)} · {txCount} {t("txCount", lang)}
          </span>
        </div>
      </div>
    </div>
  );
}
