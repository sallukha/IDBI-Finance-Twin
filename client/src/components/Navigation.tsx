import React, { useState } from "react";
import { useApp } from "../contexts/AppContext.js";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Bot,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Globe,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const {
    user,
    logout,
    theme,
    toggleTheme,
    language,
    setLanguage,
    notifications,
    unreadCount,
    markNotificationsRead,
    t,
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { id: "transactions", label: t("transactions"), icon: ArrowLeftRight },
    { id: "goals", label: t("savingsGoals"), icon: Target },
    { id: "ai", label: t("aiTools"), icon: Bot, highlight: true },
  ];

  // Add Admin tab if user is administrator
  if (user?.isAdmin) {
    menuItems.push({ id: "admin", label: t("adminPanel"), icon: ShieldCheck });
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* HEADER / NAVBAR */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 md:px-8 flex items-center justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold font-display shadow-md glow-blue">
              FB
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-blue-600 dark:text-blue-400 flex items-center gap-1">
                {t("brand")}
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest hidden sm:block">
                {t("tagline")}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Selector */}
          <button
            onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1 text-xs font-medium"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="w-4 h-4" />
            <span>{language === "en" ? "HI" : "EN"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setBellOpen(!bellOpen);
                if (!bellOpen) markNotificationsRead();
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-20 max-h-96 flex flex-col"
                  >
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {t("notifications")}
                      </h3>
                      <button
                        onClick={() => markNotificationsRead()}
                        className="text-[10px] text-blue-500 font-medium hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-400">
                          {t("allCaughtUp")}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition duration-200 ${
                              !n.read ? "bg-blue-50/35 dark:bg-blue-950/10 font-medium" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={`w-2 h-2 mt-1.5 rounded-full ${
                                  n.type === "success"
                                    ? "bg-green-500"
                                    : n.type === "warning"
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <div className="flex-1">
                                <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                                  {n.message}
                                </p>
                                <span className="text-[9px] text-gray-400 mt-1 block">
                                  {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Summary */}
          <div className="hidden sm:flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 pl-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              {user?.fullName.charAt(0) || "U"}
            </div>
            <div className="text-left text-xs">
              <p className="font-semibold text-gray-800 dark:text-gray-200 leading-none">
                {user?.fullName || "Valued Customer"}
              </p>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-mono">
                {user?.isAdmin ? "Admin User" : "Wealth Account"}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition ml-1"
              title={t("logout")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* PERSISTENT SIDEBAR FOR DESKTOP */}
      <aside className="fixed left-0 top-[65px] h-[calc(100vh-65px)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col justify-between py-6 z-30 transition-colors">
        <div className="px-3 flex-1 flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                  isSelected
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="sidebar-accent"
                    className="absolute left-0 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full"
                  />
                )}
                <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600 dark:text-blue-400" : ""}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full animate-pulse border border-amber-500/30">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Profile Card & Logout bottom */}
        <div className="px-4 border-t border-gray-100 dark:border-gray-800 pt-4 mt-auto">
          <div className="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-xl flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              {user?.fullName.charAt(0)}
            </div>
            <div className="text-xs truncate max-w-[130px]">
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200/50 dark:border-red-950/40 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* MOBILE COLLAPSIBLE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col py-6 px-4 z-51 md:hidden transition-colors"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold font-display shadow">
                    FB
                  </div>
                  <h1 className="text-lg font-bold font-display text-blue-600 dark:text-blue-400">
                    {t("brand")}
                  </h1>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isSelected
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/20"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {item.highlight && (
                        <span className="ml-auto bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                          AI
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    {user?.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                      {user?.fullName}
                    </p>
                    <p className="text-[10px] text-gray-400 max-w-[150px] truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200/50 dark:border-red-950/40 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t("logout")}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
