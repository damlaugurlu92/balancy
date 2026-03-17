import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TR_MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function TrendChart({ transactions, lang, t }) {
  const months = lang === "tr" ? TR_MONTHS : EN_MONTHS;

  const data = useMemo(() => {
    const now  = new Date();
    const slots = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      slots.push({
        label: `${months[d.getMonth()]} ${d.getFullYear()}`,
        year:  d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expense: 0,
      });
    }

    transactions.forEach(tx => {
      if (!tx.txDate) return;
      const [y, m] = tx.txDate.split("-").map(Number);
      const slot = slots.find(s => s.year === y && s.month === m - 1);
      if (!slot) return;
      if (tx.type === "income")  slot.income  += tx.amount;
      if (tx.type === "expense") slot.expense += tx.amount;
    });

    return slots;
  }, [transactions, lang]);

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: t("income", lang),
        data: data.map(d => d.income),
        backgroundColor: "rgba(61,186,140,0.7)",
        borderRadius: 6,
      },
      {
        label: t("expense", lang),
        data: data.map(d => d.expense),
        backgroundColor: "rgba(224,100,92,0.7)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#9097a8", font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ₺${ctx.raw.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: "#9097a8", font: { size: 11 } }, grid: { color: "rgba(255,255,255,0.04)" } },
      y: { ticks: { color: "#9097a8", font: { size: 11 }, callback: v => `₺${v.toLocaleString("tr-TR")}` }, grid: { color: "rgba(255,255,255,0.04)" } },
    },
  };

  return (
    <div className="trend-section">
      <Bar data={chartData} options={options} />
    </div>
  );
}
