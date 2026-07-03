import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext.js";
import { apiFetch } from "../lib/api.js";
import { Plus, Target, Calendar, Sparkles, DollarSign, ArrowUpRight, TrendingUp, CheckCircle, Trash } from "lucide-react";

interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline: string;
}

export const SavingsGoals: React.FC = () => {
  const { token, refreshOverview, addToast } = useApp();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [category, setCategory] = useState("Emergency Fund");
  const [deadline, setDeadline] = useState("");

  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/finance/goals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/finance/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          targetAmount: Number(targetAmount),
          currentAmount: Number(currentAmount),
          category,
          deadline,
        }),
      });

      if (res.ok) {
        addToast("Savings goal set successfully!", "success");
        setTitle("");
        setTargetAmount("");
        setCurrentAmount("0");
        setDeadline("");
        setShowAddForm(false);
        fetchGoals();
        refreshOverview();
      } else {
        addToast("Failed to create goal", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;

    try {
      const goal = goals.find((g) => g.id === depositGoalId);
      if (!goal) return;

      const newAmount = goal.currentAmount + Number(depositAmount);
      const res = await apiFetch(`/api/finance/goals/${depositGoalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentAmount: newAmount,
        }),
      });

      if (res.ok) {
        addToast(`₹${depositAmount} added to your ${goal.title} fund!`, "success");
        setDepositAmount("");
        setDepositGoalId(null);
        fetchGoals();
        refreshOverview();
      } else {
        addToast("Deposit failed", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm("Delete this savings goal?")) return;

    try {
      const res = await apiFetch(`/api/finance/goals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        addToast("Goal removed", "success");
        fetchGoals();
        refreshOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-900 dark:text-white">Savings Goals</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Set, prioritize, and track your financial milestones</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-600/15 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* AI SAVINGS ENCOURAGEMENT */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-6 -mt-6" />
        <div>
          <div className="flex items-center gap-1.5 text-purple-100 text-[10px] uppercase font-bold tracking-widest mb-1">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            AI Wealth Accelerator
          </div>
          <h3 className="font-bold text-base sm:text-lg font-display">Accelerate Your Compound Growth</h3>
          <p className="text-xs text-purple-100 max-w-xl mt-1 leading-relaxed">
            By funding your goals directly, FinBuddy calculates compounding parameters and auto-syncs micro-interest alerts. Reach your targets up to **3.2 months faster** by depositing surplus weekly funds.
          </p>
        </div>
      </div>

      {/* GOALS GRID */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading milestones...</span>
        </div>
      ) : goals.length === 0 ? (
        <div className="p-16 text-center text-xs text-gray-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          No savings goals set. Click "New Savings Goal" to plan your next milestone!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const ratio = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const percentage = Math.min(Math.round(ratio), 100);
            const isCompleted = percentage >= 100;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs relative flex flex-col justify-between group overflow-hidden"
              >
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition"
                  title="Remove Goal"
                >
                  <Trash className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center font-bold shadow-2xs">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block font-mono">
                        {goal.category}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                        {goal.title}
                      </h4>
                    </div>
                  </div>

                  {/* Pricing Values */}
                  <div className="flex justify-between items-baseline mb-3">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Saved</span>
                      <span className="text-base font-bold text-gray-950 dark:text-white font-mono">
                        ₹{goal.currentAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase">Target</span>
                      <span className="text-sm font-semibold text-gray-500 font-mono">
                        ₹{goal.targetAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>Progress</span>
                      <span className={isCompleted ? "text-green-600 font-bold" : "text-blue-500 font-semibold"}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-green-500" : "bg-purple-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-4 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {goal.deadline || "No deadline"}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 py-1 px-2.5 rounded-full border border-green-200/50">
                      <CheckCircle className="w-3.5 h-3.5" /> Done
                    </span>
                  ) : (
                    <button
                      onClick={() => setDepositGoalId(goal.id)}
                      className="text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 dark:border-blue-900 dark:hover:bg-blue-600 py-1 px-3 rounded-lg transition"
                    >
                      Deposit Funds
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW SAVINGS GOAL FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4">
              Create Savings Goal
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Reserve Fund"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Target (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 150000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Initial Deposit (₹)</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                >
                  {["Buy Car", "Emergency Fund", "Trip", "House", "Laptop", "Other"].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Target Deadline</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs transition dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs transition shadow-md shadow-blue-600/10"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT FUNDS FORM MODAL */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-full max-w-sm p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-2">
              Deposit surplus capital
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Add funds directly to your savings target milestone.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Surplus Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 5000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-3 text-sm text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs transition dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs transition shadow-md shadow-blue-600/10"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
