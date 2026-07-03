import React, { useState, useEffect } from "react";
import { Calculator, Percent, Calendar, DollarSign, Wallet, ArrowUpRight } from "lucide-react";

type LoanType = "Personal" | "Home" | "Car" | "Education";

export const LoanCalculator: React.FC = () => {
  const [loanType, setLoanType] = useState<LoanType>("Personal");
  const [principal, setPrincipal] = useState(500000); // ₹5 Lakhs
  const [rate, setRate] = useState(10.5); // Interest rate in %
  const [tenure, setTenure] = useState(5); // Tenure in years

  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Auto-set standard rate averages based on loan type
  useEffect(() => {
    switch (loanType) {
      case "Personal":
        setRate(12.5);
        setTenure(3);
        break;
      case "Home":
        setRate(8.4);
        setTenure(20);
        break;
      case "Car":
        setRate(9.8);
        setTenure(5);
        break;
      case "Education":
        setRate(9.2);
        setTenure(7);
        break;
    }
  }, [loanType]);

  // Recalculate values whenever parameters change
  useEffect(() => {
    const P = principal;
    const r = rate / 12 / 100; // monthly rate
    const n = tenure * 12; // monthly tenure

    if (P <= 0 || r < 0 || n <= 0) return;

    // EMI formula: [P x r x (1+r)^n] / [(1+r)^n - 1]
    let calculatedEmi = 0;
    if (r === 0) {
      calculatedEmi = P / n;
    } else {
      calculatedEmi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const calculatedTotalAmount = calculatedEmi * n;
    const calculatedTotalInterest = calculatedTotalAmount - P;

    setEmi(Math.round(calculatedEmi));
    setTotalAmount(Math.round(calculatedTotalAmount));
    setTotalInterest(Math.round(calculatedTotalInterest));
  }, [principal, rate, tenure]);

  const loanTypes: LoanType[] = ["Personal", "Home", "Car", "Education"];

  const interestPercentage = totalAmount > 0 ? (totalInterest / totalAmount) * 100 : 0;
  const principalPercentage = 100 - interestPercentage;

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Calculator className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Smart Loan Calculator</h3>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">EMI & Interest Breakdown</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-50 dark:bg-gray-900/60 p-1 rounded-xl mb-6">
        {loanTypes.map((type) => (
          <button
            key={type}
            onClick={() => setLoanType(type)}
            className={`flex-1 text-center text-xs py-1.5 font-medium rounded-lg transition-all ${
              loanType === type
                ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Calculator Sliders */}
      <div className="space-y-4 mb-6">
        {/* Principal Slider */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            <span>Loan Amount</span>
            <span className="text-blue-600 dark:text-blue-400">₹{principal.toLocaleString("en-IN")}</span>
          </div>
          <input
            type="range"
            min={50000}
            max={10000000}
            step={50000}
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
            <span>₹50K</span>
            <span>₹1 Crore</span>
          </div>
        </div>

        {/* Interest Slider */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            <span>Interest Rate (p.a.)</span>
            <span className="text-blue-600 dark:text-blue-400">{rate}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={20}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
            <span>5%</span>
            <span>20%</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            <span>Loan Tenure</span>
            <span className="text-blue-600 dark:text-blue-400">{tenure} Years</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
            <span>1 Year</span>
            <span>30 Years</span>
          </div>
        </div>
      </div>

      {/* CALCULATED RESULTS */}
      <div className="grid grid-cols-3 gap-3 bg-gray-50/50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100/50 dark:border-gray-800/40 mb-4">
        <div className="text-center">
          <span className="text-[10px] text-gray-400 block mb-1">Monthly EMI</span>
          <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono">
            ₹{emi.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="text-center border-x border-gray-200/50 dark:border-gray-800/50">
          <span className="text-[10px] text-gray-400 block mb-1">Total Interest</span>
          <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono">
            ₹{totalInterest.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-gray-400 block mb-1">Total Amount</span>
          <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 font-mono">
            ₹{totalAmount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* VISUAL RATIO BAR */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
          <span>Principal ({Math.round(principalPercentage)}%)</span>
          <span>Interest ({Math.round(interestPercentage)}%)</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
          <div className="h-full bg-blue-600" style={{ width: `${principalPercentage}%` }} />
          <div className="h-full bg-amber-500" style={{ width: `${interestPercentage}%` }} />
        </div>
      </div>
    </div>
  );
};
