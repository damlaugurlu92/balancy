import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp({
  credential: cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db  = getFirestore();
const COL = "transactions";

const server = new Server(
  { name: "davidata-finance", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── TOOLS LIST ──────────────────────────────────────────────
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "add_transaction",
      description: "Adds a new income or expense transaction to Firestore",
      inputSchema: {
        type: "object",
        required: ["type", "description", "amount", "category"],
        properties: {
          type:        { type: "string", enum: ["income", "expense"] },
          description: { type: "string" },
          amount:      { type: "number", minimum: 0.01 },
          category:    { type: "string" },
          txDate:      { type: "string", format: "date" },
          userId:      { type: "string" },
        },
      },
    },
    {
      name: "list_transactions",
      description: "Lists transactions with optional filters",
      inputSchema: {
        type: "object",
        properties: {
          type:      { type: "string", enum: ["income", "expense", "all"] },
          category:  { type: "string" },
          startDate: { type: "string", format: "date" },
          endDate:   { type: "string", format: "date" },
          limit:     { type: "integer", default: 50, maximum: 200 },
          userId:    { type: "string" },
        },
      },
    },
    {
      name: "get_summary",
      description: "Returns income/expense totals and net balance",
      inputSchema: {
        type: "object",
        properties: {
          startDate: { type: "string", format: "date" },
          endDate:   { type: "string", format: "date" },
          userId:    { type: "string" },
        },
      },
    },
    {
      name: "get_category_breakdown",
      description: "Returns per-category totals for income or expense",
      inputSchema: {
        type: "object",
        required: ["type"],
        properties: {
          type:      { type: "string", enum: ["income", "expense"] },
          startDate: { type: "string", format: "date" },
          endDate:   { type: "string", format: "date" },
          userId:    { type: "string" },
        },
      },
    },
    {
      name: "delete_transaction",
      description: "Deletes a transaction by its Firestore document ID",
      inputSchema: {
        type: "object",
        required: ["id"],
        properties: {
          id:     { type: "string" },
          userId: { type: "string" },
        },
      },
    },
  ],
}));

// ── TOOL HANDLER ─────────────────────────────────────────────
server.setRequestHandler("tools/call", async (req) => {
  const { name, arguments: a } = req.params;
  const col = db.collection(COL);

  const applyFilters = (q) => {
    if (a.userId)                       q = q.where("userId",   "==", a.userId);
    if (a.type && a.type !== "all")     q = q.where("type",     "==", a.type);
    if (a.category)                     q = q.where("category", "==", a.category);
    if (a.startDate)                    q = q.where("txDate",   ">=", a.startDate);
    if (a.endDate)                      q = q.where("txDate",   "<=", a.endDate);
    return q;
  };

  // add_transaction
  if (name === "add_transaction") {
    const docData = {
      userId:      a.userId || "default",
      type:        a.type,
      description: a.description,
      amount:      Number(a.amount),
      category:    a.category,
      txDate:      a.txDate || new Date().toISOString().split("T")[0],
      createdAt:   Timestamp.now(),
    };
    const ref = await col.add(docData);
    return { content: [{ type: "text", text: JSON.stringify({ id: ref.id, ...docData }) }] };
  }

  // list_transactions
  if (name === "list_transactions") {
    const q = applyFilters(col.orderBy("txDate", "desc")).limit(a.limit || 50);
    const snap = await q.get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }

  // get_summary
  if (name === "get_summary") {
    const snap = await applyFilters(col).get();
    const rows = snap.docs.map((d) => d.data());
    const income  = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
    const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ income, expense, net: income - expense, txCount: rows.length }),
      }],
    };
  }

  // get_category_breakdown
  if (name === "get_category_breakdown") {
    const snap = await applyFilters(col.where("type", "==", a.type)).get();
    const rows  = snap.docs.map((d) => d.data());
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const map   = {};
    rows.forEach((r) => { map[r.category] = (map[r.category] || 0) + r.amount; });
    const result = Object.entries(map)
      .map(([category, t]) => ({
        category,
        total: t,
        percentage: total > 0 ? Math.round((t / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }

  // delete_transaction
  if (name === "delete_transaction") {
    await col.doc(a.id).delete();
    return { content: [{ type: "text", text: `Deleted: ${a.id}` }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
