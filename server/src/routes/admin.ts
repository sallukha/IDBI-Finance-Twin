import { Router, Response } from "express";
import { DB } from "../db.js";
import { authenticateJWT, requireAdmin, AuthenticatedRequest } from "../middleware/auth.js";
import {
  deleteUser,
  listUsers,
  updateUser,
} from "../repositories/userRepository.js";

const router = Router();

// Securely enforce JWT and Admin privileges across all admin routes
router.use(authenticateJWT);
router.use(requireAdmin);

// 1. ADMIN ANALYTICS DASHBOARD
router.get("/dashboard", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const dbData = DB.data;
    const users = await listUsers();

    const totalUsers = users.length;
    const totalExpensesCount = dbData.expenses.length;
    const totalIncomesCount = dbData.incomes.length;
    const totalGoalsCount = dbData.goals.length;

    const aggregateSalary = users.reduce((sum, user) => sum + (user.salary || 0), 0);
    const averageSalary = totalUsers > 0 ? Math.round(aggregateSalary / totalUsers) : 0;

    const totalIncomesValue = dbData.incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpensesValue = dbData.expenses.reduce((sum, e) => sum + e.amount, 0);

    // Get active user signups by date
    const signupsByDate = users.reduce((acc: { [key: string]: number }, user) => {
      const date = user.createdAt ? user.createdAt.split("T")[0] : "2026-06-01";
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalUsers,
      totalExpensesCount,
      totalIncomesCount,
      totalGoalsCount,
      totalIncomesValue,
      totalExpensesValue,
      averageSalary,
      signupsByDate,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate administrative analytics" });
  }
});

// 2. VIEW ALL USERS
router.get("/users", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = (await listUsers()).map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      age: u.age,
      salary: u.salary,
      riskLevel: u.riskLevel,
      verified: u.verified,
      createdAt: u.createdAt,
      isAdmin: !!u.isAdmin,
    }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to load users list" });
  }
});

// 3. MANAGE/UPDATE USER DETAILS
router.put("/users/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fullName, age, salary, riskLevel, verified, isAdmin } = req.body;
    const values: Parameters<typeof updateUser>[1] = {};

    if (fullName !== undefined) values.fullName = fullName;
    if (age !== undefined) values.age = Number(age);
    if (salary !== undefined) values.salary = Number(salary);
    if (riskLevel !== undefined) values.riskLevel = riskLevel;
    if (verified !== undefined) values.verified = !!verified;
    if (isAdmin !== undefined) values.isAdmin = !!isAdmin;

    const user = await updateUser(req.params.id, values);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ message: "User parameters updated by Admin successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to modify user" });
  }
});

// 4. DELETE USER & ALL RELATED DATA
router.delete("/users/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.id;

    if (userId === "admin-1" || userId === req.user!.id) {
      res.status(400).json({ error: "Protected Admin account cannot be deleted" });
      return;
    }

    const dbData = DB.data;
    if (!(await deleteUser(userId))) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Cascade delete user data
    dbData.users = dbData.users.filter((u) => u.id !== userId);
    dbData.expenses = dbData.expenses.filter((e) => e.userId !== userId);
    dbData.incomes = dbData.incomes.filter((i) => i.userId !== userId);
    dbData.goals = dbData.goals.filter((g) => g.userId !== userId);
    dbData.chats = dbData.chats.filter((c) => c.userId !== userId);
    dbData.notifications = dbData.notifications.filter((n) => n.userId !== userId);

    DB.save(dbData);
    res.json({ message: "User and all associated financial records cascade deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// 5. VIEW GLOBAL RECENT TRANSACTIONS
router.get("/transactions", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const dbData = DB.data;
    const users = await listUsers();
    const allExpenses = dbData.expenses.map((e) => {
      const user = users.find((u) => u.id === e.userId);
      return { ...e, type: "expense", userName: user ? user.fullName : "Unknown User" };
    });
    const allIncomes = dbData.incomes.map((i) => {
      const user = users.find((u) => u.id === i.userId);
      return { ...i, type: "income", userName: user ? user.fullName : "Unknown User" };
    });

    const combined = [...allExpenses, ...allIncomes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json(combined);
  } catch (error) {
    res.status(500).json({ error: "Failed to load recent transactions" });
  }
});

export default router;
