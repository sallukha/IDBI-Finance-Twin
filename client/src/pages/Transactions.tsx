import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext.js";
import { Plus, Trash, Search, ArrowDownCircle, ArrowUpCircle, Filter, FileSpreadsheet } from "lucide-react";

interface TxItem {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: "income" | "expense";
}

export const Transactions: React.FC = () => {
  const { token, refreshOverview, addToast } = useApp();
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const expensesRes = await fetch("/api/finance/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incomesRes = await fetch("/api/finance/incomes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (expensesRes.ok && incomesRes.ok) {
        const expenses = await expensesRes.json();
        const incomes = await incomesRes.json();

        const formattedExpenses = expenses.map((e: any) => ({ ...e, type: "expense" }));
        const formattedIncomes = incomes.map((i: any) => ({ ...i, type: "income" }));

        const combined = [...formattedExpenses, ...formattedIncomes].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setTransactions(combined);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const handleDelete = async (id: string, itemType: "income" | "expense") => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const endpoint = itemType === "income" ? `/api/finance/incomes/${id}` : `/api/finance/expenses/${id}`;
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        addToast("Transaction deleted successfully", "success");
        fetchTransactions();
        refreshOverview();
      } else {
        addToast("Failed to delete", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = type === "income" ? "/api/finance/incomes" : "/api/finance/expenses";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          category,
          date,
          description,
        }),
      });

      if (res.ok) {
        addToast(`${type === "income" ? "Income" : "Expense"} added successfully`, "success");
        setAmount("");
        setDescription("");
        setShowAddForm(false);
        fetchTransactions();
        refreshOverview();
      } else {
        addToast("Failed to save transaction", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-align default categories when switching type
  useEffect(() => {
    if (type === "income") {
      setCategory("Salary");
    } else {
      setCategory("Food");
    }
  }, [type]);

  // Apply filters
  const filteredTransactions = transactions.filter((tx) => {
    const matchesTab = activeTab === "all" || tx.type === activeTab;
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tx.category === selectedCategory;

    return matchesTab && matchesSearch && matchesCategory;
  });

  const categories =
    type === "income"
      ? ["Salary", "Business", "Freelance", "Other"]
      : ["Food", "Travel", "Shopping", "Bills", "Rent", "Education", "Medical", "Entertainment"];

  const allCategories = [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Rent",
    "Education",
    "Medical",
    "Entertainment",
    "Salary",
    "Business",
    "Freelance",
    "Other",
  ];

  // CSV Exporter
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      addToast("No data to export", "info");
      return;
    }
    const headers = "Date,Type,Category,Amount(₹),Description\n";
    const rows = filteredTransactions
      .map(
        (tx) =>
          `"${tx.date}","${tx.type.toUpperCase()}","${tx.category}",${tx.amount},"${tx.description.replace(
            /"/g,
            '""'
          )}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `FinBuddy_Wealth_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("CSV Wealth Report downloaded!", "success");
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-900 dark:text-white">Financial Logs</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Detailed cash flow registries & reporting center</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md shadow-blue-600/15 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          {/* Main type tabs */}
          <div className="flex bg-gray-50 dark:bg-gray-900/60 p-1 rounded-xl">
            {(["all", "income", "expense"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-4 py-1.5 font-semibold rounded-lg transition uppercase ${
                  activeTab === tab
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 dark:text-gray-300"
            >
              <option value="All">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by description or category details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100 transition"
          />
        </div>
      </div>

      {/* LOGS TABLE LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading database logs...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-16 text-center text-xs text-gray-400">
            No matching transactions found. Click "Add Transaction" to create logs!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/60 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition">
                    <td className="py-3.5 px-4 font-mono">{tx.date}</td>
                    <td className="py-3.5 px-4 font-semibold">{tx.category}</td>
                    <td className="py-3.5 px-4 italic max-w-[200px] truncate">{tx.description || "—"}</td>
                    <td className="py-3.5 px-4">
                      {tx.type === "income" ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold bg-green-500/10 py-0.5 px-2 rounded-full">
                          <ArrowUpCircle className="w-3.5 h-3.5" /> Income
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-semibold bg-red-500/10 py-0.5 px-2 rounded-full">
                          <ArrowDownCircle className="w-3.5 h-3.5" /> Expense
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold font-mono text-sm ${
                        tx.type === "income" ? "text-green-600" : "text-gray-900 dark:text-white"
                      }`}
                    >
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(tx.id, tx.type)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TRANSADD MODAL FORM */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4">
              Add Transaction Record
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Transaction Type</label>
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`flex-1 text-center text-xs py-2 font-semibold rounded-lg transition ${
                      type === "expense" ? "bg-red-500 text-white shadow-sm" : "text-gray-500"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`flex-1 text-center text-xs py-2 font-semibold rounded-lg transition ${
                      type === "income" ? "bg-green-600 text-white shadow-sm" : "text-gray-500"
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Description</label>
                <input
                  type="text"
                  placeholder="Rent, utilities, shopping description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs transition dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs transition shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
