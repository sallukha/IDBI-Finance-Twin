import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Notification, DashboardOverview } from "../types.js";

// Multi-language translation database (English & Hindi)
export const translations = {
  en: {
    brand: "FinBuddy AI",
    tagline: "AI-Powered Wealth Advisor",
    dashboard: "Dashboard",
    transactions: "Transactions",
    savingsGoals: "Savings Goals",
    aiTools: "AI Wealth Space",
    adminPanel: "Admin Suite",
    welcome: "Welcome back",
    balance: "Current Balance",
    monthlyIncome: "Monthly Income",
    monthlySpending: "Monthly Spending",
    savings: "Savings Progress",
    investmentValue: "Investment Value",
    healthScore: "Financial Health",
    recentTransactions: "Recent Transactions",
    addExpense: "Add Expense",
    addIncome: "Add Income",
    createGoal: "Create Savings Goal",
    language: "Language",
    theme: "Theme",
    login: "Log In",
    signup: "Sign Up",
    logout: "Log Out",
    profile: "Profile",
    fraudRisk: "AI Fraud Risk",
    allCaughtUp: "All caught up!",
    notifications: "Notifications",
    voiceCoach: "Voice Assistant",
    hindi: "हिन्दी",
    english: "English",
  },
  hi: {
    brand: "फिनबडी AI",
    tagline: "एआई-संचालित वेल्थ एडवाइजर",
    dashboard: "डैशबोर्ड",
    transactions: "लेन-देन",
    savingsGoals: "बचत लक्ष्य",
    aiTools: "एआई वेल्थ स्पेस",
    adminPanel: "एडमिन सूट",
    welcome: "स्वागत है",
    balance: "कुल जमा राशि",
    monthlyIncome: "मासिक आय",
    monthlySpending: "मासिक खर्च",
    savings: "बचत प्रगति",
    investmentValue: "निवेश मूल्य",
    healthScore: "वित्तीय स्वास्थ्य",
    recentTransactions: "हाल के लेन-देन",
    addExpense: "खर्च जोड़ें",
    addIncome: "आय जोड़ें",
    createGoal: "बचत लक्ष्य बनाएं",
    language: "भाषा",
    theme: "थीम",
    login: "लॉग इन करें",
    signup: "साइन अप करें",
    logout: "लॉग आउट",
    profile: "प्रोफ़ाइल",
    fraudRisk: "एआई धोखाधड़ी जोखिम",
    allCaughtUp: "सब ठीक है!",
    notifications: "सूचनाएं",
    voiceCoach: "वॉयस असिस्टेंट",
    hindi: "हिन्दी",
    english: "English",
  },
};

interface AppContextType {
  user: User | null;
  token: string | null;
  language: "en" | "hi";
  theme: "light" | "dark";
  notifications: Notification[];
  unreadCount: number;
  overview: DashboardOverview | null;
  loadingOverview: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setLanguage: (lang: "en" | "hi") => void;
  toggleTheme: () => void;
  t: (key: keyof typeof translations.en) => string;
  refreshOverview: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  toasts: Array<{ id: string; message: string; type: "success" | "error" | "info" }>;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [language, setLanguageState] = useState<"en" | "hi">("en");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  // Toast notifications management
  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize from LocalStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("finbuddy_token");
    const storedUser = localStorage.getItem("finbuddy_user");
    const storedTheme = localStorage.getItem("finbuddy_theme") as "light" | "dark";
    const storedLang = localStorage.getItem("finbuddy_lang") as "en" | "hi";

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    if (storedTheme) {
      setTheme(storedTheme);
    }
    if (storedLang) {
      setLanguageState(storedLang);
    }
  }, []);

  // Update HTML theme class when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("finbuddy_theme", theme);
  }, [theme]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("finbuddy_token", newToken);
    localStorage.setItem("finbuddy_user", JSON.stringify(newUser));
    addToast(`Welcome back, ${newUser.fullName}!`, "success");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOverview(null);
    setNotifications([]);
    localStorage.removeItem("finbuddy_token");
    localStorage.removeItem("finbuddy_user");
    addToast("Logged out successfully.", "info");
  };

  const setLanguage = (lang: "en" | "hi") => {
    setLanguageState(lang);
    localStorage.setItem("finbuddy_lang", lang);
    addToast(lang === "en" ? "Language changed to English" : "भाषा बदलकर हिन्दी कर दी गई है।", "info");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations["en"][key] || String(key);
  };

  // Fetch Dashboard Analytics
  const refreshOverview = async () => {
    if (!token) return;
    setLoadingOverview(true);
    try {
      const res = await fetch("/api/finance/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (e) {
      console.error("Failed to load overview analytics", e);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/finance/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  // Mark all notifications read
  const markNotificationsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/finance/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch fresh data when user logs in
  useEffect(() => {
    if (token) {
      refreshOverview();
      fetchNotifications();

      // Setup polling for dynamic notifications
      const interval = setInterval(() => {
        fetchNotifications();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        language,
        theme,
        notifications,
        unreadCount,
        overview,
        loadingOverview,
        login,
        logout,
        setLanguage,
        toggleTheme,
        t,
        refreshOverview,
        fetchNotifications,
        markNotificationsRead,
        addToast,
        toasts,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
