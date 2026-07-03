import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../contexts/AppContext.js";
import { apiFetch } from "../lib/api.js";
import {
  Bot,
  Sparkles,
  Calendar,
  AlertTriangle,
  Send,
  Trash2,
  TrendingUp,
  Percent,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { VoiceAssistant } from "../components/VoiceAssistant.js";
import { LoanCalculator } from "../components/LoanCalculator.js";
import { InvestmentSuggestions } from "../components/InvestmentSuggestions.js";
import { AIBudgetPlan, AIFraudReport } from "../types.js";

type AITab = "coach" | "budget" | "fraud" | "loans" | "investments";

export const AIFinance: React.FC = () => {
  const { token, addToast, user } = useApp();
  const [activeTab, setActiveTab] = useState<AITab>("coach");

  // 1. CHAT COACH STATES
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [aiLastMsg, setAiLastMsg] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 2. BUDGET PLANNER STATES
  const [budgetPlan, setBudgetPlan] = useState<AIBudgetPlan | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);

  // 3. FRAUD DETECTION STATES
  const [fraudReport, setFraudReport] = useState<AIFraudReport | null>(null);
  const [loadingFraud, setLoadingFraud] = useState(false);

  // Load chat history on mount
  useEffect(() => {
    if (token && activeTab === "coach") {
      fetchChatHistory();
    }
  }, [token, activeTab]);

  const fetchChatHistory = async () => {
    try {
      const res = await apiFetch("/api/ai/coach", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loadingChat) return;

    // optimist add user message to list
    const tempUserMsg = { id: Date.now().toString(), sender: "user", message: textToSend };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMsg("");
    setLoadingChat(true);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const res = await apiFetch("/api/ai/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        // Append AI response
        setMessages((prev) => [...prev, data.aiMessage]);
        setAiLastMsg(data.aiMessage.message);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        addToast("AI Coach failed to respond.", "error");
      }
    } catch (e) {
      console.error(e);
      addToast("Network failure", "error");
    } finally {
      setLoadingChat(false);
    }
  };

  const clearChatHistory = async () => {
    if (!window.confirm("Do you want to clear your conversation history?")) return;
    try {
      const res = await apiFetch("/api/ai/coach/clear", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages([]);
        setAiLastMsg(null);
        addToast("Chat history cleared.", "info");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // GENERATE AI BUDGET PLAN
  const generateBudgetPlan = async () => {
    setLoadingBudget(true);
    try {
      const res = await apiFetch("/api/ai/budget-planner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBudgetPlan(data);
        addToast("AI Budget Plan generated successfully", "success");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBudget(false);
    }
  };

  // GENERATE AI FRAUD REPORT
  const scanForFraud = async () => {
    setLoadingFraud(true);
    try {
      const res = await apiFetch("/api/ai/fraud-detector", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFraudReport(data);
        addToast("AI Fraud Scanning Complete!", "success");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFraud(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-900 dark:text-white">AI Wealth Space</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          State-of-the-art Generative AI support, budget planners, fraud scanning, and smart portfolios
        </p>
      </div>

      {/* AI SUB-TABS NAVIGATION */}
      <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-3xs">
        {[
          { id: "coach", label: "AI Coach & Voice Desk", icon: Bot },
          { id: "budget", label: "AI Budget Planner", icon: TrendingUp },
          { id: "fraud", label: "Fraud Security Center", icon: ShieldAlert },
          { id: "loans", label: "EMI Loan Desk", icon: Calendar },
          { id: "investments", label: "Wealth Model", icon: Percent },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AITab)}
              className={`flex items-center gap-2 text-xs font-semibold py-2 px-4 rounded-xl transition ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="space-y-6">
        {/* ==========================================
            TAB 1: AI COACH & VOICE DESK
           ========================================== */}
        {activeTab === "coach" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation Window */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col h-[520px]">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">FinBuddy AI Coach</h3>
                    <p className="text-[10px] text-green-600 font-semibold animate-pulse">● Online & Guarded</p>
                  </div>
                </div>

                <button
                  onClick={clearChatHistory}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                  title="Clear Chat Logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-2 mb-4 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Bot className="w-12 h-12 text-blue-300 dark:text-blue-700 animate-bounce mb-3" />
                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Start your Wealth consultation</h4>
                    <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                      "Ask me about your budget, savings targets, loan advice, or tax savings under Section 80C!"
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isUser = m.sender === "user";
                    return (
                      <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                            isUser
                              ? "bg-blue-600 text-white font-semibold rounded-tr-none"
                              : "bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-800/40"
                          }`}
                        >
                          <p className="whitespace-pre-line">{m.message}</p>
                          <span
                            className={`text-[8px] mt-1 block text-right ${isUser ? "text-blue-200" : "text-gray-400"}`}
                          >
                            {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just Now"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1 border border-gray-100 dark:border-gray-800/40">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputMsg);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Type your financial query..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                />
                <button
                  type="submit"
                  disabled={loadingChat || !inputMsg.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400 text-white font-semibold px-4 rounded-xl shadow-md transition flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Voice Control Assistant & FAQ */}
            <div className="space-y-6">
              <VoiceAssistant onSendMessage={handleSendMessage} aiLastMessage={aiLastMsg} />

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Frequently Asked Questions</h4>
                <div className="space-y-2">
                  {[
                    "How is my financial health calculated?",
                    "Can you generate a 50/30/20 budget plan?",
                    "What investments suit my risk profile?",
                    "Analyze my expenses for fraud risks",
                  ].map((faq) => (
                    <button
                      key={faq}
                      onClick={() => handleSendMessage(faq)}
                      className="w-full text-left p-2 rounded-xl text-[11px] text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50/30 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-white transition font-medium border border-transparent hover:border-blue-100 dark:hover:border-blue-900/40"
                    >
                      {faq}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: AI BUDGET PLANNER
           ========================================== */}
        {activeTab === "budget" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs max-w-4xl mx-auto">
            <div className="text-center max-w-lg mx-auto mb-8">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">AI 50/30/20 Budget Modeler</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Generate an optimized monthly allocation model based on your income, categorizing cash flow into essentials (50%), lifestyle wants (30%), and robust long-term compounding reserves (20%).
              </p>

              <button
                onClick={generateBudgetPlan}
                disabled={loadingBudget}
                className="mt-5 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-6 rounded-xl shadow-md shadow-blue-600/15 transition"
              >
                {loadingBudget ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate My Budget Plan</span>
                  </>
                )}
              </button>
            </div>

            {/* BUDGET RESULTS */}
            {budgetPlan && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-900">
                {/* 50% Essentials */}
                <div className="border border-slate-200/80 dark:border-slate-800/80 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 py-0.5 px-2 rounded font-bold">50% ESSENTIALS</span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-3">Needs & Utilities</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Rent, bills, food, medical, and insurance essentials.</p>
                  </div>
                  <div className="mt-6 font-mono text-lg font-bold text-gray-950 dark:text-white">
                    ₹{budgetPlan.essentialExpenses.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* 30% Lifestyle */}
                <div className="border border-slate-200/80 dark:border-slate-800/80 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 py-0.5 px-2 rounded font-bold">30% LIFESTYLE</span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-3">Wants & Discretionary</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Shopping, entertainment, luxury trips, dining out.</p>
                  </div>
                  <div className="mt-6 font-mono text-lg font-bold text-gray-950 dark:text-white">
                    ₹{budgetPlan.optionalExpenses.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* 20% Compound Reserves */}
                <div className="border border-blue-100 dark:border-blue-950/40 bg-blue-50/15 dark:bg-blue-950/5 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400 py-0.5 px-2 rounded font-bold">20% RESERVES</span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-3">Savings & Investment</h4>
                    <p className="text-[11px] text-gray-500 mt-1">SIP, fixed deposits, gold, and mutual fund compounds.</p>
                  </div>
                  <div className="mt-6 font-mono text-lg font-bold text-green-600 dark:text-green-400">
                    ₹{budgetPlan.suggestedSavings.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* ACTIONABLE ADVICE */}
                <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-blue-50/50 to-white dark:from-blue-950/15 dark:to-gray-950 border border-blue-100 dark:border-blue-900/40 p-5 rounded-2xl">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Actionable Tips from FinBuddy Coach
                  </h4>
                  <ul className="space-y-2">
                    {budgetPlan.actionableTips.map((tip, i) => (
                      <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 3: AI FRAUD SECURITY CENTER
           ========================================== */}
        {activeTab === "fraud" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs max-w-4xl mx-auto">
            <div className="text-center max-w-lg mx-auto mb-8">
              <div className="w-12 h-12 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">AI Fraud Security Console</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Scan your recent expenses for unusual transactions, structural deviations, and anomalous velocity parameters to keep your wealth fully shielded.
              </p>

              <button
                onClick={scanForFraud}
                disabled={loadingFraud}
                className="mt-5 inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2.5 px-6 rounded-xl shadow-md transition"
              >
                {loadingFraud ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Run Fraud Security Scan</span>
                  </>
                )}
              </button>
            </div>

            {/* FRAUD SCANNER RESULTS */}
            {fraudReport && (
              <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-900">
                {/* Risk Score Panel */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50/50 dark:bg-gray-900/30 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    {fraudReport.fraudRiskScore < 30 ? (
                      <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 animate-bounce" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Calculated Risk Index</span>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white">
                        {fraudReport.fraudRiskScore < 30 ? "Secured Account Profile" : "Elevated Activity Detected"}
                      </h4>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-3xl font-extrabold font-mono text-gray-950 dark:text-white">{fraudReport.fraudRiskScore}</span>
                    <span className="text-xs text-gray-400 font-mono"> / 100 Risk</span>
                  </div>
                </div>

                {/* Anomalies and Alerts */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 font-mono">
                    Flagged Anomalies ({fraudReport.anomaliesFound})
                  </h4>
                  {fraudReport.alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-green-600 bg-green-500/5 rounded-2xl border border-green-500/10">
                      Perfect scan! No transactions flagged as anomalous or high-velocity.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fraudReport.alerts.map((al, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-red-400 transition"
                        >
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 py-0.5 px-2 rounded uppercase">
                              {al.severity} SEVERITY
                            </span>
                            <p className="text-xs text-gray-800 dark:text-gray-200 mt-1">{al.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Protection Advisory */}
                <div className="bg-gradient-to-r from-blue-50/50 to-white dark:from-blue-950/15 dark:to-gray-950 border border-blue-100 dark:border-blue-900/40 p-5 rounded-2xl">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    Advisory: Shield Your Account
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {fraudReport.securityAdvice}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 4: EMI LOAN DESK
           ========================================== */}
        {activeTab === "loans" && <LoanCalculator />}

        {/* ==========================================
            TAB 5: WEALTH PORTFOLIO OPTIONS
           ========================================== */}
        {activeTab === "investments" && <InvestmentSuggestions />}
      </div>
    </div>
  );
};
