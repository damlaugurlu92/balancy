import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { transactions, period, lang } = req.body;

  if (!transactions || transactions.length === 0) {
    return res.json({ analysis: lang === "tr" ? "Bu dönem için işlem bulunamadı." : "No transactions found for this period." });
  }

  const income  = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net     = income - expense;

  const catMap = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const prompt = lang === "tr"
    ? `Sen bir kişisel finans danışmanısın. Kullanıcının ${period} dönemine ait harcama verileri:

Toplam Gelir: ₺${income.toFixed(2)}
Toplam Gider: ₺${expense.toFixed(2)}
Net Durum: ₺${net.toFixed(2)}
İşlem Sayısı: ${transactions.length}

En Yüksek Gider Kategorileri:
${topCats.map(([cat, amt]) => `- ${cat}: ₺${amt.toFixed(2)}`).join("\n")}

Lütfen şunları yap:
1. Genel finansal durumu değerlendir (2-3 cümle)
2. Gereksiz veya dikkat gerektiren harcamaları belirt
3. 2-3 somut tasarruf önerisi sun
4. Olumlu bir kapanış yap

Samimi, anlaşılır ve motive edici bir dil kullan. Markdown kullanma, düz metin yaz.`
    : `You are a personal finance advisor. Here is the user's data for ${period}:

Total Income: ₺${income.toFixed(2)}
Total Expense: ₺${expense.toFixed(2)}
Net Balance: ₺${net.toFixed(2)}
Transaction Count: ${transactions.length}

Top Expense Categories:
${topCats.map(([cat, amt]) => `- ${cat}: ₺${amt.toFixed(2)}`).join("\n")}

Please:
1. Evaluate the overall financial situation (2-3 sentences)
2. Point out unnecessary or concerning expenses
3. Give 2-3 concrete saving suggestions
4. End on a positive note

Use a friendly, clear and motivating tone. No markdown, plain text only.`;

  try {
    const client  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ analysis: message.content[0].text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analiz alınamadı." });
  }
}
