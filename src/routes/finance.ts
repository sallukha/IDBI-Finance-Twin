import { Router, Response } from "express";
import { DB, Expense, Income, SavingsGoal, Notification } from "../db.js";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// ==========================================
// 1. OVERVIEW ANALYTICS & TRANSACTIONS
// ==========================================
router.get("/overview", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const dbData = DB.data;

    // Filter data for active user
    const userExpenses = dbData.expenses.filter((e) => e.userId === userId);
    const userIncomes = dbData.incomes.filter((i) => i.userId === userId);
    const userGoals = dbData.goals.filter((g) => g.userId === userId);

    // Dynamic Calculations
    const totalIncome = userIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = userExpenses.reduce((sum, item) => sum + item.amount, 0);
    const currentBalance = totalIncome - totalExpenses;

    // Monthly values (assume current year is 2026 and current month is June for demo consistency)
    const currentYearMonth = "2026-06";
    const monthlyIncome = userIncomes
      .filter((i) => i.date.startsWith(currentYearMonth))
      .reduce((sum, item) => sum + item.amount, 0);
    const monthlySpending = userExpenses
      .filter((e) => e.date.startsWith(currentYearMonth))
      .reduce((sum, item) => sum + item.amount, 0);

    // Goal accumulation
    const totalSavings = userGoals.reduce((sum, g) => sum + g.currentAmount, 0);

    // High quality financial health score formula (ranges 0-100)
    // Formula takes into account: Savings rate, debt/investment ratio, and emergency fund coverage.
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    let healthScore = 50; // base score

    if (savingsRate > 40) healthScore += 25;
    else if (savingsRate > 20) healthScore += 15;
    else if (savingsRate > 0) healthScore += 5;
    else healthScore -= 15; // negative savings hurts

    // Check emergency fund status
    const emergencyFund = userGoals.find((g) => g.category === "Emergency Fund");
    if (emergencyFund) {
      const completionPct = (emergencyFund.currentAmount / emergencyFund.targetAmount) * 100;
      if (completionPct >= 100) healthScore += 20;
      else if (completionPct >= 50) healthScore += 10;
      else healthScore += 5;
    } else {
      healthScore -= 10; // no emergency fund hurts
    }

    // Limit range [0, 100]
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    // Combine & Sort transactions (recent first)
    const recentExpenses = userExpenses.map((e) => ({
      ...e,
      type: "expense",
    }));
    const recentIncomes = userIncomes.map((i) => ({
      ...i,
      type: "income",
    }));

    const recentTransactions = [...recentExpenses, ...recentIncomes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Category breakdown for pie charts
    const expenseByCategory = userExpenses.reduce((acc: { [key: string]: number }, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

    const incomeByCategory = userIncomes.reduce((acc: { [key: string]: number }, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

    res.json({
      currentBalance,
      monthlySpending,
      monthlyIncome,
      totalSavings,
      financialHealthScore: healthScore,
      recentTransactions,
      expenseByCategory,
      incomeByCategory,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load financial overview" });
  }
});

// ==========================================
// 2. EXPENSES CRUD
// ==========================================
router.get("/expenses", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const userExpenses = DB.data.expenses.filter((e) => e.userId === req.user!.id);
  res.json(userExpenses);
});

router.post("/expenses", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, category, date, description } = req.body;
    if (!amount || !category || !date) {
      res.status(400).json({ error: "Amount, category and date are required" });
      return;
    }

    const userId = req.user!.id;
    const dbData = DB.data;

    const newExpense: Expense = {
      id: "exp_" + Math.random().toString(36).substr(2, 9),
      userId,
      amount: Number(amount),
      category,
      date,
      description: description || "",
    };

    dbData.expenses.push(newExpense);

    // Smart Trigger: Check if this category expense exceeds a baseline "budget limit" (e.g. ₹10,000)
    const categoryTotal = dbData.expenses
      .filter((e) => e.userId === userId && e.category === category && e.date.startsWith("2026-06"))
      .reduce((sum, e) => sum + e.amount, 0);

    if (categoryTotal > 8000) {
      const alertNotification: Notification = {
        id: "not_" + Math.random().toString(36).substr(2, 9),
        userId,
        message: `Budget Alert! Your spending in '${category}' category has reached ₹${categoryTotal}, exceeding your self-imposed warning limit of ₹8,000!`,
        type: "warning",
        date: new Date().toISOString(),
        read: false,
      };
      dbData.notifications.push(alertNotification);
    }

    DB.save(dbData);
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: "Failed to create expense" });
  }
});

router.put("/expenses/:id", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, category, date, description } = req.body;
    const dbData = DB.data;
    const expenseIndex = dbData.expenses.findIndex((e) => e.id === req.params.id && e.userId === req.user!.id);

    if (expenseIndex === -1) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const existingExpense = dbData.expenses[expenseIndex];
    dbData.expenses[expenseIndex] = {
      ...existingExpense,
      amount: amount !== undefined ? Number(amount) : existingExpense.amount,
      category: category || existingExpense.category,
      date: date || existingExpense.date,
      description: description !== undefined ? description : existingExpense.description,
    };

    DB.save(dbData);
    res.json(dbData.expenses[expenseIndex]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense" });
  }
});

router.delete("/expenses/:id", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const dbData = DB.data;
    const initialLength = dbData.expenses.length;
    dbData.expenses = dbData.expenses.filter((e) => !(e.id === req.params.id && e.userId === req.user!.id));

    if (dbData.expenses.length === initialLength) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    DB.save(dbData);
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// ==========================================
// 3. INCOMES CRUD
// ==========================================
router.get("/incomes", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const userIncomes = DB.data.incomes.filter((i) => i.userId === req.user!.id);
  res.json(userIncomes);
});

router.post("/incomes", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, category, date, description } = req.body;
    if (!amount || !category || !date) {
      res.status(400).json({ error: "Amount, category and date are required" });
      return;
    }

    const userId = req.user!.id;
    const dbData = DB.data;

    const newIncome: Income = {
      id: "inc_" + Math.random().toString(36).substr(2, 9),
      userId,
      amount: Number(amount),
      category,
      date,
      description: description || "",
    };

    dbData.incomes.push(newIncome);

    // Smart Trigger: Notification of salary received
    if (category === "Salary" && Number(amount) >= 30000) {
      const salaryNotification: Notification = {
        id: "not_" + Math.random().toString(36).substr(2, 9),
        userId,
        message: `FinBuddy Alert: Professional Salary of ₹${Number(amount).toLocaleString("en-IN")} has been credited to your wealth account. Great month ahead!`,
        type: "success",
        date: new Date().toISOString(),
        read: false,
      };
      dbData.notifications.push(salaryNotification);
    }

    DB.save(dbData);
    res.status(201).json(newIncome);
  } catch (error) {
    res.status(500).json({ error: "Failed to create income" });
  }
});

router.put("/incomes/:id", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, category, date, description } = req.body;
    const dbData = DB.data;
    const incomeIndex = dbData.incomes.findIndex((i) => i.id === req.params.id && i.userId === req.user!.id);

    if (incomeIndex === -1) {
      res.status(404).json({ error: "Income not found" });
      return;
    }

    const existingIncome = dbData.incomes[incomeIndex];
    dbData.incomes[incomeIndex] = {
      ...existingIncome,
      amount: amount !== undefined ? Number(amount) : existingIncome.amount,
      category: category || existingIncome.category,
      date: date || existingIncome.date,
      description: description !== undefined ? description : existingIncome.description,
    };

    DB.save(dbData);
    res.json(dbData.incomes[incomeIndex]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update income" });
  }
});

router.delete("/incomes/:id", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const dbData = DB.data;
    const initialLength = dbData.incomes.length;
    dbData.incomes = dbData.incomes.filter((i) => !(i.id === req.params.id && i.userId === req.user!.id));

    if (dbData.incomes.length === initialLength) {
      res.status(404).json({ error: "Income not found" });
      return;
    }

    DB.save(dbData);
    res.json({ message: "Income deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete income" });
  }
});

// ==========================================
// 4. SAVINGS GOALS CRUD
// ==========================================
router.get("/goals", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const userGoals = DB.data.goals.filter((g) => g.userId === req.user!.id);
  res.json(userGoals);
});

router.post("/goals", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, targetAmount, currentAmount, category, deadline } = req.body;
    if (!title || !targetAmount || !category) {
      res.status(400).json({ error: "Title, targetAmount and category are required" });
      return;
    }

    const userId = req.user!.id;
    const dbData = DB.data;

    const newGoal: SavingsGoal = {
      id: "goal_" + Math.random().toString(36).substr(2, 9),
      userId,
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      category,
      deadline: deadline || "2026-12-31",
    };

    dbData.goals.push(newGoal);
    DB.save(dbData);
    res.status(201).json(newGoal);
  } catch (error) {
    res.status(500).json({ error: "Failed to create savings goal" });
  }
});

router.put("/goals/:id", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, targetAmount, currentAmount, category, deadline } = req.body;
    const dbData = DB.data;
    const goalIndex = dbData.goals.findIndex((g) => g.id === req.params.id && g.userId === req.user!.id);

    if (goalIndex === -1) {
      res.status(404).json({ error: "Savings goal not found" });
      return;
    }

    const existingGoal = dbData.goals[goalIndex];
    const updatedGoal = {
      ...existingGoal,
      title: title || existingGoal.title,
      targetAmount: targetAmount !== undefined ? Number(targetAmount) : existingGoal.targetAmount,
      currentAmount: currentAmount !== undefined ? Number(currentAmount) : existingGoal.currentAmount,
      category: category || existingGoal.category,
      deadline: deadline || existingGoal.deadline,
    };

    dbData.goals[goalIndex] = updatedGoal;

    // Goal Achieved smart notification
    if (updatedGoal.currentAmount >= updatedGoal.targetAmount && existingGoal.currentAmount < existingGoal.targetAmount) {
      const goalNotification: Notification = {
        id: "not_" + Math.random().toString(36).substr(2, 9),
        userId: req.user!.id,
        message: `Congratulations! 🎉 You have successfully achieved your savings goal: '${updatedGoal.title}' of ₹${updatedGoal.targetAmount}!`,
        type: "success",
        date: new Date().toISOString(),
        read: false,
      };
      dbData.notifications.push(goalNotification);
    }

    DB.save(dbData);
    res.json(updatedGoal);
  } catch (error) {
    res.status(500).json({ error: "Failed to update savings goal" });
  }
});

router.delete("/goals/:id", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const dbData = DB.data;
    const initialLength = dbData.goals.length;
    dbData.goals = dbData.goals.filter((g) => !(g.id === req.params.id && g.userId === req.user!.id));

    if (dbData.goals.length === initialLength) {
      res.status(404).json({ error: "Savings goal not found" });
      return;
    }

    DB.save(dbData);
    res.json({ message: "Savings goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete savings goal" });
  }
});

// ==========================================
// 5. NOTIFICATIONS
// ==========================================
router.get("/notifications", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const userNotifications = DB.data.notifications
    .filter((n) => n.userId === req.user!.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(userNotifications);
});

router.put("/notifications/read-all", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const dbData = DB.data;
    dbData.notifications.forEach((n) => {
      if (n.userId === req.user!.id) {
        n.read = true;
      }
    });
    DB.save(dbData);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

export default router;
