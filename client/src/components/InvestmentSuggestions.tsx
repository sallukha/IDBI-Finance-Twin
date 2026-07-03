import React, { useState } from "react";
import { TrendingUp, Award, Activity, Percent, ArrowUpRight, ShieldCheck, RefreshCw } from "lucide-react";
import { useApp } from "../contexts/AppContext.js";

interface InvestmentOption {
  name: string;
  category: "FD" | "Mutual Fund" | "SIP" | "PPF" | "Gold" | "Stocks";
  risk: "Low" | "Medium" | "High";
  returns: string;
  tenure: string;
  description: string;
  highlights: string[];
}

export const InvestmentSuggestions: React.FC = () => {
  const { user, t } = useApp();
  const [filterRisk, setFilterRisk] = useState<"All" | "Low" | "Medium" | "High">("All");

  const investments: InvestmentOption[] = [
    {
      name: "IDBI Green Fixed Deposit",
      category: "FD",
      risk: "Low",
      returns: "7.2% p.a.",
      tenure: "1 - 5 Years",
      description: "Secure guaranteed returns while funding environmentally friendly green projects.",
      highlights: ["100% Capital Protection", "Extra 0.5% for Senior Citizens", "Guaranteed interest payout"],
    },
    {
      name: "Government PPF (Public Provident Fund)",
      category: "PPF",
      risk: "Low",
      returns: "7.1% p.a. (Tax-Free)",
      tenure: "15 Years",
      description: "Backed fully by the Central Government, providing EEE category tax exemptions under Sec 80C.",
      highlights: ["EEE Sovereign Guarantee", "15 year compound lockin", "Absolute zero market risk"],
    },
    {
      name: "IDBI Gold Sovereign Bond",
      category: "Gold",
      risk: "Low",
      returns: "2.5% p.a. Interest + Gold Growth",
      tenure: "8 Years",
      description: "Own physical gold value in digital secure format. Pays 2.5% bonus interest annually.",
      highlights: ["No storage risk or GST", "Sovereign backing", "Capital Gains tax exempt on maturity"],
    },
    {
      name: "IDBI Hybrid Balanced Advantage Fund",
      category: "Mutual Fund",
      risk: "Medium",
      returns: "11.5% - 13.2% p.a.",
      tenure: "3 - 5 Years",
      description: "Diversified mutual fund balancing high equity growth with defensive debt allocation.",
      highlights: ["Auto rebalancing asset allocation", "Managed by expert fund managers", "Less volatile than pure equity"],
    },
    {
      name: "Nifty 50 Large Cap SIP",
      category: "SIP",
      risk: "Medium",
      returns: "12.8% - 14.5% p.a.",
      tenure: "5+ Years",
      description: "Direct SIP investing into India's top 50 blue-chip companies, tracking nationwide GDP growth.",
      highlights: ["Rupee cost averaging benefit", "Highly liquid & transparent", "Perfect for long-term compounding"],
    },
    {
      name: "IDBI Nifty Next 50 Index Fund",
      category: "SIP",
      risk: "High",
      returns: "15.2% - 17.5% p.a.",
      tenure: "7+ Years",
      description: "Targeted mutual fund investing in India's next 50 emerging mid-to-large-cap corporations.",
      highlights: ["Aggressive compounding growth", "Index-based low expense ratio", "No fund-manager bias"],
    },
    {
      name: "Direct Bluechip Equity Basket",
      category: "Stocks",
      risk: "High",
      returns: "18.0%+ p.a. (Variable)",
      tenure: "5+ Years",
      description: "Direct equity allocation into banking, IT, and infra giants. Best suited for seasoned wealth seekers.",
      highlights: ["High growth & direct dividends", "Full custom portfolio control", "Exposure to high growth sectors"],
    }
  ];

  const filteredInvestments = filterRisk === "All"
    ? investments
    : investments.filter((inv) => inv.risk === filterRisk);

  const getRiskColor = (risk: "Low" | "Medium" | "High") => {
    switch (risk) {
      case "Low":
        return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400";
      case "Medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
      case "High":
        return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Smart Wealth Recommendations</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Curated Financial Products</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-900/60 p-1 rounded-xl">
          {(["All", "Low", "Medium", "High"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className={`text-[10px] sm:text-xs px-3 py-1 font-semibold rounded-lg transition ${
                filterRisk === r
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* PORTFOLIO RECOMMENDATION BOX */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-4 mb-6 shadow-md glow-blue flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-blue-100 text-[10px] uppercase font-bold tracking-widest mb-1">
            <Award className="w-4 h-4" />
            Your Tailored Wealth Model
          </div>
          <h4 className="text-base sm:text-lg font-bold font-display">
            Recommended Portfolio for {user?.fullName || "Valued Customer"}
          </h4>
          <p className="text-xs text-blue-100 max-w-xl mt-1 leading-relaxed">
            Based on your age of **{user?.age || 26}** and **{user?.riskLevel || "Medium"}** risk profile, we suggest a balanced asset allocation prioritizing wealth generation with built-in emergency coverage.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl py-3 px-4 min-w-[200px] border border-white/15">
          <div className="flex-1">
            <span className="text-[9px] text-blue-100 uppercase tracking-wider block">Risk Meter Status</span>
            <span className="text-sm font-bold font-display block mt-0.5">{user?.riskLevel} Risk Guard</span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin flex items-center justify-center">
            <span className="text-[10px] font-bold font-mono animate-pulse">
              {user?.riskLevel === "Low" ? "1/3" : user?.riskLevel === "Medium" ? "2/3" : "3/3"}
            </span>
          </div>
        </div>
      </div>

      {/* OPTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvestments.map((inv, index) => (
          <div
            key={index}
            className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500/40 transition duration-200 shadow-2xs group"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 py-0.5 px-2 rounded-md uppercase font-bold tracking-wider">
                  {inv.category}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getRiskColor(inv.risk)}`}>
                  {inv.risk} Risk
                </span>
              </div>

              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mt-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {inv.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {inv.description}
              </p>

              {/* Highlights */}
              <ul className="mt-3 space-y-1">
                {inv.highlights.map((h, i) => (
                  <li key={i} className="text-[10px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 mt-4 pt-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Est. Return</span>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 font-mono flex items-center gap-0.5">
                  <Percent className="w-3.5 h-3.5" />
                  {inv.returns}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Lock-in</span>
                <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                  {inv.tenure}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
