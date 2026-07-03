import type { WithId } from "mongodb";
import { getCollection } from "./database/mongodb.js";

export interface DashboardMetrics {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  financialHealthScore: number;
  creditScore: number;
  emergencyFundMonths: number;
  investmentValue: number;
  netWorth: number;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  age: number;
  salary: number;
  riskLevel: "Low" | "Medium" | "High";
  verified: boolean;
  otp?: string;
  otpExpiry?: number;
  createdAt: string;
  isAdmin?: boolean;
  dashboardMetrics?: DashboardMetrics;
  aiRecommendation?: {
    financialHealthScore: number;
    summary: string;
    recommendation: string;
  };
  fraudAlerts?: Array<{
    title: string;
    amount: number;
    status: string;
    risk: "Low" | "Medium" | "High";
  }>;
  loanPrediction?: {
    eligible: boolean;
    loanAmount: number;
    emi: number;
    affordability: string;
    confidence: number;
  };
  investments?: Array<{
    type: string;
    amount: number;
    returns: string;
  }>;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: "Food" | "Travel" | "Transport" | "Shopping" | "Bills" | "Rent" | "Education" | "Medical" | "Entertainment";
  date: string;
  description: string;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  category: "Salary" | "Business" | "Freelance" | "Freelancing" | "Other";
  date: string;
  description: string;
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

export interface DatabaseSchema {
  users: User[];
  expenses: Expense[];
  incomes: Income[];
  goals: SavingsGoal[];
  notifications: Notification[];
  chats: ChatMessage[];
}

interface AppStateDocument extends DatabaseSchema {
  key: "primary";
}

const rahulId = "user-rahul";

function rahulDemoData(): Omit<DatabaseSchema, "users"> {
  return {
    incomes: [
      { id: "rahul-income-salary", userId: rahulId, amount: 85000, category: "Salary", date: "2026-06-01", description: "Salary" },
      { id: "rahul-income-freelance", userId: rahulId, amount: 18000, category: "Freelancing", date: "2026-06-15", description: "Freelance Project" },
    ],
    expenses: [
      { id: "rahul-exp-rent", userId: rahulId, amount: 18000, category: "Rent", date: "2026-06-02", description: "House Rent" },
      { id: "rahul-exp-groceries", userId: rahulId, amount: 6500, category: "Food", date: "2026-06-04", description: "Groceries" },
      { id: "rahul-exp-electricity", userId: rahulId, amount: 2400, category: "Bills", date: "2026-06-05", description: "Electricity Bill" },
      { id: "rahul-exp-internet", userId: rahulId, amount: 999, category: "Bills", date: "2026-06-06", description: "Internet" },
      { id: "rahul-exp-petrol", userId: rahulId, amount: 4500, category: "Transport", date: "2026-06-08", description: "Petrol" },
      { id: "rahul-exp-movie", userId: rahulId, amount: 800, category: "Entertainment", date: "2026-06-10", description: "Movie" },
      { id: "rahul-exp-shopping", userId: rahulId, amount: 6500, category: "Shopping", date: "2026-06-12", description: "Shopping" },
      { id: "rahul-exp-restaurant", userId: rahulId, amount: 2300, category: "Food", date: "2026-06-18", description: "Restaurant" },
    ],
    goals: [
      { id: "rahul-goal-emergency", userId: rahulId, title: "Emergency Fund", targetAmount: 500000, currentAmount: 320000, category: "Emergency Fund", deadline: "2026-12-31" },
      { id: "rahul-goal-goa", userId: rahulId, title: "Goa Trip", targetAmount: 80000, currentAmount: 45000, category: "Trip", deadline: "2027-03-31" },
      { id: "rahul-goal-laptop", userId: rahulId, title: "New Laptop", targetAmount: 120000, currentAmount: 90000, category: "Laptop", deadline: "2026-11-30" },
    ],
    notifications: [
      { id: "rahul-alert-fraud", userId: rahulId, message: "Suspicious transaction of ₹48,000 was blocked.", type: "warning", date: "2026-06-20T10:00:00.000Z", read: false },
      { id: "rahul-alert-health", userId: rahulId, message: "Excellent Financial Health — your score is 88/100.", type: "success", date: "2026-06-19T10:00:00.000Z", read: false },
    ],
    chats: [
      { id: "rahul-chat-question", userId: rahulId, message: "Can I buy a car worth ₹8 lakh next year?", sender: "user", timestamp: "2026-06-21T10:00:00.000Z" },
      { id: "rahul-chat-answer", userId: rahulId, message: "Yes. Based on your monthly income of ₹1,03,000, expenses of ₹42,000 and savings of ₹61,000, you can comfortably afford a car loan. Your debt-to-income ratio remains healthy.", sender: "ai", timestamp: "2026-06-21T10:00:01.000Z" },
    ],
  };
}

function emptyState(): DatabaseSchema {
  return { users: [], expenses: [], incomes: [], goals: [], notifications: [], chats: [] };
}

function replaceRahulData(state: DatabaseSchema): DatabaseSchema {
  const demo = rahulDemoData();
  return {
    ...state,
    expenses: [...state.expenses.filter((item) => item.userId !== rahulId), ...demo.expenses],
    incomes: [...state.incomes.filter((item) => item.userId !== rahulId), ...demo.incomes],
    goals: [...state.goals.filter((item) => item.userId !== rahulId), ...demo.goals],
    notifications: [...state.notifications.filter((item) => item.userId !== rahulId), ...demo.notifications],
    chats: [...state.chats.filter((item) => item.userId !== rahulId), ...demo.chats],
  };
}

export class DB {
  private static state: DatabaseSchema | null = null;

  static async initialize(): Promise<void> {
    const collection = getCollection<AppStateDocument>("app_state");
    const stored = await collection.findOne({ key: "primary" }, { projection: { _id: 0 } });
    const state = stored ?? emptyState();
    const hasRahulSeed = state.incomes.some((item) => item.userId === rahulId);
    DB.state = hasRahulSeed ? state : replaceRahulData(state);
    await DB.save(DB.state);
  }

  static get data(): DatabaseSchema {
    if (!DB.state) throw new Error("Application data has not been initialized.");
    return DB.state;
  }

  static async save(newData: DatabaseSchema): Promise<void> {
    DB.state = newData;
    const document: AppStateDocument = { key: "primary", ...newData };
    await getCollection<AppStateDocument>("app_state").replaceOne(
      { key: "primary" },
      document as WithId<AppStateDocument>,
      { upsert: true },
    );
  }
}
