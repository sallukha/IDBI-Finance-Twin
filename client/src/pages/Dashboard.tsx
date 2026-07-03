import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext.js";
import { apiFetch } from "../lib/api.js";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Activity,
  Award,
  Bell,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Calendar,
  Layers,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export const Dashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { user, token, overview, loadingOverview, refreshOverview, t } = useApp();

  // Quick form modal states
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);

  // Form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("Salary");
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split("T")[0]);
  const [incomeDescription, setIncomeDescription] = useState("");

  useEffect(() => {
    refreshOverview();
  }, [token]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/finance/expenses", {
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
        setAmount("");
        setDescription("");
        setShowAddExpense(false);
        refreshOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/finance/incomes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(incomeAmount),
          category: incomeCategory,
          date: incomeDate,
          description: incomeDescription,
        }),
      });

      if (res.ok) {
        setIncomeAmount("");
        setIncomeDescription("");
        setShowAddIncome(false);
        refreshOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loadingOverview || !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-gray-100 dark:bg-gray-900 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
          <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
          <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
          <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-gray-100 dark:bg-gray-900 rounded-3xl lg:col-span-2" />
          <div className="h-80 bg-gray-100 dark:bg-gray-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Formatting categories for the PieChart
  const pieData = Object.entries(overview.expenseByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1"];

  // Mock trend data for line/area chart (recharts)
  const areaChartData = [
    { name: "Jan", Income: 75000, Expenses: 15000 },
    { name: "Feb", Income: 85000, Expenses: 18000 },
    { name: "Mar", Income: 85000, Expenses: 22000 },
    { name: "Apr", Income: 95000, Expenses: 19000 },
    { name: "May", Income: 95000, Expenses: 26000 },
    { name: "Jun", Income: overview.monthlyIncome || 97000, Expenses: overview.monthlySpending || 19500 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. WELCOME BANNER */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-md glow-blue relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
        
        <div>
          <span className="bg-white/10 text-white border border-white/15 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-mono">
            Premium Client Desk
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display mt-2">
            {t("welcome")}, {user?.fullName}!
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mt-1 leading-relaxed">
            Welcome back to IDBI FinBuddy Wealth. Your wealth scorecard is performing strongly this month, with a savings rate of **{Math.round(((overview.monthlyIncome - overview.monthlySpending) / (overview.monthlyIncome || 1)) * 100)}%**.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAddIncome(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold py-2 px-4 rounded-xl shadow-xs transition transform hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4 text-green-600" />
            <span>{t("addIncome")}</span>
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-500/30 text-white hover:bg-blue-500/40 border border-white/15 text-xs font-semibold py-2 px-4 rounded-xl transition transform hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4 text-red-400" />
            <span>{t("addExpense")}</span>
          </button>
        </div>
      </div>

      {/* 2. CORE FINANCIAL COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {t("balance")}
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white font-mono mt-1">
            ₹{overview.currentBalance.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-green-600 font-bold bg-green-500/10 py-0.5 px-1.5 rounded-full mt-2 inline-block">
            Liquid Capital
          </span>
        </div>

        {/* Monthly Income Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-xl group-hover:bg-green-500/10 transition" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {t("monthlyIncome")}
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white font-mono mt-1">
            ₹{overview.monthlyIncome.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-2 font-mono">
            Current Month (June 2026)
          </span>
        </div>

        {/* Monthly Spending Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {t("monthlySpending")}
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white font-mono mt-1">
            ₹{overview.monthlySpending.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-2 font-mono">
            Auto Calculated
          </span>
        </div>

        {/* Savings Goal Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {t("savings")}
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white font-mono mt-1">
            ₹{overview.totalSavings.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-purple-600 font-bold bg-purple-500/10 py-0.5 px-1.5 rounded-full mt-2 inline-block">
            Wealth Core Active
          </span>
        </div>
      </div>

      {/* 3. CORE ANALYTICS GRAPH (RECHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income/Expense Trends Line Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Annual Wealth Flow</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Monthly comparisons</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1 text-green-600"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Income</span>
              <span className="flex items-center gap-1 text-blue-600"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full" /> Expenses</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} fontStyle="italic" />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                <Area type="monotone" dataKey="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="Expenses" stroke="#2563eb" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Expense Distribution</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">By Category</p>
          </div>

          {pieData.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 flex-1 flex items-center justify-center">
              No expenses recorded. Click "Add Expense" to get started!
            </div>
          ) : (
            <>
              <div className="h-44 w-full flex items-center justify-center mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie legend */}
              <div className="grid grid-cols-2 gap-2 mt-4 max-h-24 overflow-y-auto">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate font-semibold">{entry.name}</span>
                    <span className="font-mono ml-auto">₹{Number(entry.value).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. AI SUGGESTIONS & HEALTH SCORE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Health Score Dial */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{t("healthScore")}</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Calculated Analytics</p>
          </div>

          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Outer ring */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="rgba(229, 231, 235, 0.3)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={326.7}
                  strokeDashoffset={326.7 - (326.7 * (overview.financialHealthScore || 75)) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
                  {overview.financialHealthScore}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">/ 100</span>
              </div>
            </div>

            <p className="text-xs font-semibold mt-4 text-center text-gray-700 dark:text-gray-300">
              {overview.financialHealthScore >= 80
                ? "Excellent Financial Health! 🌟"
                : overview.financialHealthScore >= 60
                ? "Good Health. Optimize savings."
                : "Attention required to bolster reserves."}
            </p>
          </div>
        </div>

        {/* AI Financial Coach Suggestions Panel */}
        <div className="bg-gradient-to-br from-blue-50/50 via-white to-blue-50/20 dark:from-blue-950/10 dark:via-gray-950 dark:to-gray-950 border border-blue-100 dark:border-blue-950/40 rounded-3xl p-5 shadow-xs md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-spin" />
              <span>FinBuddy AI Suggestions</span>
            </div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white font-display">
              Smart Saving Tip of the Day
            </h4>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              Based on your age of **{user?.age}** and salary of **₹{user?.salary.toLocaleString("en-IN")}**, you can optimize your taxes up to ₹46,800 under Section 80C by shifting ₹15,000 into a liquid Systematic Investment Plan (SIP) rather than holding redundant funds in standard savings accounts.
            </p>
          </div>

          <button
            onClick={() => setActiveTab("ai")}
            className="mt-4 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition"
          >
            <span>Consult AI Financial Coach</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. RECENT TRANSACTIONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{t("recentTransactions")}</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Recent Cashflow Activity</p>
          </div>
          <button
            onClick={() => setActiveTab("transactions")}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {overview.recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No transactions found. Add incomes/expenses to see logs.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
            {overview.recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      tx.type === "income"
                        ? "bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400"
                        : "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                    }`}
                  >
                    {tx.category.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {tx.description || tx.category}
                    </h4>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-mono">
                      {tx.category} • {tx.date}
                    </span>
                  </div>
                </div>

                <span
                  className={`font-bold font-mono text-sm ${
                    tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-500"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"} ₹{tx.amount.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          MODALS / FORMS FOR QUICK TRANSADDING
         ========================================== */}
      {/* ADD EXPENSE MODAL */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4">
              Add Personal Expense
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Expense Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
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
                  {["Food", "Travel", "Shopping", "Bills", "Rent", "Education", "Medical", "Entertainment"].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Transaction Date</label>
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
                  placeholder="e.g. Grocery buy Metro"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs transition dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs transition shadow-md shadow-blue-600/10"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD INCOME MODAL */}
      {showAddIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4">
              Add Income Record
            </h3>

            <form onSubmit={handleAddIncome} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 85000"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Source</label>
                <select
                  value={incomeCategory}
                  onChange={(e) => setIncomeCategory(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                >
                  {["Salary", "Business", "Freelance", "Other"].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Date Received</label>
                <input
                  type="date"
                  required
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Tech corporate payroll"
                  value={incomeDescription}
                  onChange={(e) => setIncomeDescription(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddIncome(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs transition dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs transition shadow-md shadow-blue-600/10"
                >
                  Add Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
