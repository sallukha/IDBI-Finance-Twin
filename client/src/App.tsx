import React, { useState } from "react";
import { AppProvider, useApp } from "./contexts/AppContext.js";
import { Navigation } from "./components/Navigation.js";
import { Auth } from "./pages/Auth.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Transactions } from "./pages/Transactions.js";
import { SavingsGoals } from "./pages/SavingsGoals.js";
import { AIFinance } from "./pages/AIFinance.js";
import { Admin } from "./pages/Admin.js";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, ShieldCheck } from "lucide-react";

const AppContent: React.FC = () => {
  const { user, toasts, removeToast } = useApp();
  const [activeTab, setActiveTab] = useState("dashboard");

  // If user is not logged in, force the Auth experience (Login/Signup/OTP)
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 font-sans transition-colors duration-200 flex flex-col justify-between">
      <div className="w-full flex-1">
        {/* 1. TOP NAVBAR HEADER */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* 2. BODY LAYOUT CONTEXT */}
        <div className="flex">
          {/* Sidebar offset padding for desktop */}
          <div className="hidden md:block w-64 flex-shrink-0" />

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} />}
                {activeTab === "transactions" && <Transactions />}
                {activeTab === "goals" && <SavingsGoals />}
                {activeTab === "ai" && <AIFinance />}
                {activeTab === "admin" && user.isAdmin && <Admin />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* 4. STATUS BAR FOOTER */}
      <footer className="h-8 bg-white dark:bg-gray-950 border-t border-slate-200 dark:border-slate-800 px-6 md:pl-[280px] flex items-center justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
        <div className="flex gap-4">
          <span>PWA: Ready</span>
          <span>Secure: 256-bit SSL</span>
          <span>Last Sync: 1 min ago</span>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 normal-case hidden sm:block">
          IDBI Innovate 2026 • Digital Wealth Management Track
        </div>
      </footer>

      {/* 3. SYSTEM FLOATING TOAST NOTIFICATION CONTAINER */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={`p-4 rounded-2xl shadow-xl flex items-start gap-3 border pointer-events-auto backdrop-blur-md ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300"
                  : toast.type === "error"
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300"
                  : "bg-blue-500/10 border-blue-500/25 text-blue-800 dark:text-blue-300"
              }`}
            >
              <div className="flex-1 text-xs font-semibold">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
