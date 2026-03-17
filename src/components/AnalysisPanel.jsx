import { useState } from "react";

export default function AnalysisPanel({ transactions, period, lang }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);

  const analyze = async () => {
    setLoading(true);
    setOpen(true);
    setAnalysis("");
    try {
      const endpoint = import.meta.env.DEV ? "http://localhost:3001/analyze" : "/api/analyze";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions, period, lang }),
      });
      const data = await res.json();
      setAnalysis(data.analysis || data.error || "Hata oluştu.");
    } catch {
      setAnalysis(lang === "tr" ? "Sunucuya bağlanılamadı. Analiz sunucusunun çalıştığından emin ol." : "Could not connect to analysis server.");
    }
    setLoading(false);
  };

  return (
    <div className="analysis-wrap">
      <button className="analysis-btn" onClick={analyze}>
        {lang === "tr" ? "Aylık Analiz Al" : "Get Monthly Analysis"}
      </button>

      {open && (
        <div className="analysis-panel">
          <div className="analysis-header">
            <span>{lang === "tr" ? "Finansal Analiz" : "Financial Analysis"}</span>
            <button className="analysis-close" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="analysis-body">
            {loading
              ? <span className="analysis-loading">{lang === "tr" ? "Analiz hazırlanıyor..." : "Preparing analysis..."}</span>
              : <p>{analysis}</p>
            }
          </div>
        </div>
      )}
    </div>
  );
}
