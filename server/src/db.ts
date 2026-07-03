import fs from "fs";
import path from "path";
import { env } from "./config/env.js";

// Define the absolute structure for our database
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
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: "Food" | "Travel" | "Shopping" | "Bills" | "Rent" | "Education" | "Medical" | "Entertainment";
  date: string;
  description: string;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  category: "Salary" | "Business" | "Freelance" | "Other";
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

interface DatabaseSchema {
  users: User[];
  expenses: Expense[];
  incomes: Income[];
  goals: SavingsGoal[];
  notifications: Notification[];
  chats: ChatMessage[];
}

const DB_DIR = env.dataDir;
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure data folder and file exists
function initDB(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [
        {
          id: "admin-1",
          email: "admin@finbuddy.ai",
          // password: "adminpassword"
          passwordHash: "$2a$10$9vP8uOAnbVfA5U9eM4E7e.E9f.QGvIUn3/P8IuOAnbVfA5U9eM4E7e", // hashed
          fullName: "FinBuddy Administrator",
          age: 35,
          salary: 150000,
          riskLevel: "Medium",
          verified: true,
          createdAt: new Date().toISOString(),
          isAdmin: true,
        },
        {
          id: "user-demo",
          email: "demo@finbuddy.ai",
          // password: "demopassword"
          passwordHash: "$2a$10$8L/5f6AHeKfeR/8gKeV.euUjMInpIuOAnbVfA5U9eM4E7e.G9f.QGv", // hashed
          fullName: "Sallu Khan",
          age: 26,
          salary: 85000,
          riskLevel: "High",
          verified: true,
          createdAt: new Date().toISOString(),
          isAdmin: false,
        }
      ],
      expenses: [
        { id: "e1", userId: "user-demo", amount: 1200, category: "Food", date: "2026-06-25", description: "Weekly Grocery at Metro" },
        { id: "e2", userId: "user-demo", amount: 4500, category: "Rent", date: "2026-06-01", description: "June Rent Payment" },
        { id: "e3", userId: "user-demo", amount: 1500, category: "Bills", date: "2026-06-10", description: "Electricity & Wi-Fi" },
        { id: "e4", userId: "user-demo", amount: 2000, category: "Shopping", date: "2026-06-18", description: "Zara Brand Clothing" },
        { id: "e5", userId: "user-demo", amount: 800, category: "Travel", date: "2026-06-20", description: "Uber Rides" },
        { id: "e6", userId: "user-demo", amount: 3500, category: "Entertainment", date: "2026-06-22", description: "Premium Concert Ticket" },
        { id: "e7", userId: "user-demo", amount: 6000, category: "Medical", date: "2026-06-28", description: "Dental Checkup & Medicines" },
      ],
      incomes: [
        { id: "i1", userId: "user-demo", amount: 85000, category: "Salary", date: "2026-06-01", description: "Monthly Corporate Salary" },
        { id: "i2", userId: "user-demo", amount: 12000, category: "Freelance", date: "2026-06-15", description: "UI Design Project Deliverable" },
      ],
      goals: [
        { id: "g1", userId: "user-demo", title: "Emergency Fund", targetAmount: 50000, currentAmount: 35000, category: "Emergency Fund", deadline: "2026-12-31" },
        { id: "g2", userId: "user-demo", title: "New Laptop", targetAmount: 120000, currentAmount: 45000, category: "Laptop", deadline: "2026-10-15" },
      ],
      notifications: [
        { id: "n1", userId: "user-demo", message: "Salary of ₹85,000 received successfully!", type: "success", date: "2026-06-01T10:00:00Z", read: false },
        { id: "n2", userId: "user-demo", message: "Monthly budget alert: You spent 85% of your food budget.", type: "warning", date: "2026-06-25T15:30:00Z", read: false },
        { id: "n3", userId: "user-demo", message: "Emergency Fund Goal is now 70% completed! Keep it up.", type: "info", date: "2026-06-28T09:00:00Z", read: true },
      ],
      chats: [
        { id: "c1", userId: "user-demo", message: "Hi FinBuddy! Can you help me plan my savings?", sender: "user", timestamp: new Date().toISOString() },
        { id: "c2", userId: "user-demo", message: "Hello Sallu! I'm your FinBuddy AI Coach. Based on your current income of ₹97,000 and expenses of ₹19,500, you have a solid savings rate of nearly 80%! I would suggest putting ₹30,000 of your surplus into a Mutual Fund SIP. Would you like to see a custom SIP recommendation?", sender: "ai", timestamp: new Date().toISOString() }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read JSON DB, resetting to defaults", e);
    const empty: DatabaseSchema = { users: [], expenses: [], incomes: [], goals: [], notifications: [], chats: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

export class DB {
  static get data(): DatabaseSchema {
    return initDB();
  }

  static save(newData: DatabaseSchema) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2), "utf8");
  }
}
