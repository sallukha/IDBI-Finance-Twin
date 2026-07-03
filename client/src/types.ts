export type RiskLevel = "Low" | "Medium" | "High";

export interface User {
  id: string;
  email: string;
  fullName: string;
  age: number;
  salary: number;
  riskLevel: RiskLevel;
  isAdmin: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: "Food" | "Travel" | "Shopping" | "Bills" | "Rent" | "Education" | "Medical" | "Entertainment";
  date: string;
  description: string;
  type?: "expense";
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  category: "Salary" | "Business" | "Freelance" | "Other";
  date: string;
  description: string;
  type?: "income";
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: "Buy Car" | "Emergency Fund" | "Trip" | "House" | "Laptop" | "Other";
  deadline: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "info" | "warning" | "success";
  date: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  sender: "user" | "ai";
  timestamp: string;
}

export interface DashboardOverview {
  currentBalance: number;
  monthlySpending: number;
  monthlyIncome: number;
  totalSavings: number;
  financialHealthScore: number;
  recentTransactions: Array<(Expense & { type: "expense" }) | (Income & { type: "income" })>;
  expenseByCategory: { [key: string]: number };
  incomeByCategory: { [key: string]: number };
}

export interface AIBudgetPlan {
  essentialExpenses: number;
  optionalExpenses: number;
  suggestedSavings: number;
  riskLevel: RiskLevel;
  actionableTips: string[];
}

export interface AIFraudReport {
  fraudRiskScore: number;
  anomaliesFound: number;
  alerts: Array<{
    transactionId: string;
    severity: "Low" | "Medium" | "High";
    reason: string;
  }>;
  securityAdvice: string;
}
