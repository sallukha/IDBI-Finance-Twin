import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext.js";
import { Users, FileText, Settings, Shield, Award, DollarSign, Edit, Trash2, TrendingUp, TrendingDown, Eye } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalExpensesCount: number;
  totalIncomesCount: number;
  totalGoalsCount: number;
  totalIncomesValue: number;
  totalExpensesValue: number;
  averageSalary: number;
  signupsByDate: { [key: string]: number };
}

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  age: number;
  salary: number;
  riskLevel: string;
  verified: boolean;
  createdAt: string;
  isAdmin: boolean;
}

export const Admin: React.FC = () => {
  const { token, addToast } = useApp();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit form states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState<number>(26);
  const [editSalary, setEditSalary] = useState<number>(85000);
  const [editRisk, setEditRisk] = useState<"Low" | "Medium" | "High">("Medium");
  const [editAdmin, setEditAdmin] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txRes = await fetch("/api/admin/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsRes.ok && usersRes.ok && txRes.ok) {
        setStats(await statsRes.json());
        setUsers(await usersRes.json());
        setTransactions(await txRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleEditClick = (user: UserItem) => {
    setEditingUserId(user.id);
    setEditName(user.fullName);
    setEditAge(user.age);
    setEditSalary(user.salary);
    setEditRisk(user.riskLevel as any);
    setEditAdmin(user.isAdmin);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    try {
      const res = await fetch(`/api/admin/users/${editingUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editName,
          age: editAge,
          salary: editSalary,
          riskLevel: editRisk,
          isAdmin: editAdmin,
        }),
      });

      if (res.ok) {
        addToast("User parameters modified by Admin successfully!", "success");
        setEditingUserId(null);
        fetchAdminData();
      } else {
        addToast("Modification failed", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Cascade delete this user and all associated financial, chatbot, and target records? This action is irreversible!")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        addToast("User and records cascade deleted successfully", "success");
        fetchAdminData();
      } else {
        const err = await res.json();
        addToast(err.error || "Cascade delete failed", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 bg-gray-100 dark:bg-gray-900 rounded-xl" />
          <div className="h-24 bg-gray-100 dark:bg-gray-900 rounded-xl" />
          <div className="h-24 bg-gray-100 dark:bg-gray-900 rounded-xl" />
          <div className="h-24 bg-gray-100 dark:bg-gray-900 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-900 dark:text-white">Admin Operations Suite</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">System analytics, cascade operations, and user records</p>
        </div>
      </div>

      {/* CORE SYSTEM STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users counter */}
        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gray-400 font-bold uppercase font-mono">Total Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{stats.totalUsers}</p>
          <span className="text-[10px] text-gray-400">Registered Accounts</span>
        </div>

        {/* Global Average Salary */}
        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gray-400 font-bold uppercase font-mono">Avg Salary</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
            ₹{stats.averageSalary.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-gray-400">Monthly Avg per client</span>
        </div>

        {/* Cumulative Incomes Value */}
        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gray-400 font-bold uppercase font-mono">Cumulative Incomes</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
            ₹{stats.totalIncomesValue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-gray-400">System Flow: Incomes</span>
        </div>

        {/* Cumulative Expenses Value */}
        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gray-400 font-bold uppercase font-mono">Cumulative Expenses</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
            ₹{stats.totalExpensesValue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-gray-400">System Flow: Expenses</span>
        </div>
      </div>

      {/* DETAILED USER DIRECTORY */}
      <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4">User Directory & Control Panel</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/60 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">Salary (p.m.)</th>
                <th className="py-3 px-4">Risk Tolerance</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition">
                  <td className="py-3 px-4 font-bold">{u.fullName}</td>
                  <td className="py-3 px-4 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-4">{u.age} yrs</td>
                  <td className="py-3 px-4 font-mono">₹{u.salary.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold py-0.5 px-2 rounded-full text-[10px] ${
                        u.riskLevel === "Low"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                          : u.riskLevel === "Medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                      }`}
                    >
                      {u.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {u.isAdmin ? (
                      <span className="text-[10px] text-red-600 bg-red-100 dark:bg-red-950/40 dark:text-red-400 py-0.5 px-2 rounded font-bold">
                        Administrator
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500">Standard</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right flex justify-end gap-1">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition"
                      title="Edit Parameters"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                      title="Cascade Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SYSTEM TRANSACTION AUDIT LOGS */}
      <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Cross-Account Cashflow Audit Log</h3>

        <div className="overflow-y-auto max-h-64 divide-y divide-gray-100 dark:divide-gray-800 text-xs">
          {transactions.map((tx) => (
            <div key={tx.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-display ${
                    tx.type === "income"
                      ? "bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400"
                      : "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                  }`}
                >
                  {tx.category.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200">
                    {tx.description || tx.category}
                  </h4>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-mono">
                    Client: {tx.userName} • Category: {tx.category} • {tx.date}
                  </span>
                </div>
              </div>

              <span
                className={`font-mono text-sm font-bold ${
                  tx.type === "income" ? "text-green-600" : "text-gray-900 dark:text-white"
                }`}
              >
                {tx.type === "income" ? "+" : "-"} ₹{tx.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT USER PARAMETERS MODAL FORM */}
      {editingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4">
              Modify User Parameters
            </h3>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Age</label>
                  <input
                    type="number"
                    required
                    value={editAge}
                    onChange={(e) => setEditAge(Number(e.target.value))}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Salary</label>
                  <input
                    type="number"
                    required
                    value={editSalary}
                    onChange={(e) => setEditSalary(Number(e.target.value))}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Risk Profile</label>
                <select
                  value={editRisk}
                  onChange={(e) => setEditRisk(e.target.value as any)}
                  className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAdminCheckbox"
                  checked={editAdmin}
                  onChange={(e) => setEditAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isAdminCheckbox" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Assign Administrative Privileges
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs transition dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs transition shadow-md shadow-blue-600/10"
                >
                  Apply Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
