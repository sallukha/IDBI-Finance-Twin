import { Router, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { DB, ChatMessage } from "../db.js";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth.js";
import { env } from "../config/env.js";
const router = Router();
// Securely initialize Gemini API (server-side only)
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = env.geminiApiKey;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// ==========================================
// 1. AI FINANCIAL COACH (CHAT)
// ==========================================
router.get(["/chats", "/coach"], authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userChats = DB.data.chats.filter((c) => c.userId === userId);
  res.json(userChats);
});

router.delete("/coach/clear", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const dbData = DB.data;
    dbData.chats = dbData.chats.filter((c) => c.userId !== userId);
    DB.save(dbData);
    res.json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

router.post(["/chat", "/coach"], authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const userId = req.user!.id;
    const dbData = DB.data;

    // Load active user's context for hyper-personalized coaching
    const user = dbData.users.find((u) => u.id === userId);
    const userIncomes = dbData.incomes.filter((i) => i.userId === userId);
    const userExpenses = dbData.expenses.filter((e) => e.userId === userId);
    const userGoals = dbData.goals.filter((g) => g.userId === userId);

    const totalIncome = userIncomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = userExpenses.reduce((s, e) => s + e.amount, 0);

    // Save user message to database
    const userMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      userId,
      message,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    dbData.chats.push(userMsg);

    // Formulate prompt for Gemini
    const systemPrompt = `You are "FinBuddy AI Coach", a brilliant, friendly, and elite Digital Wealth Management Advisor at IDBI Innovate 2026.
    Your goal is to provide elite wealth advice, savings strategies, and clear financial education (such as explaining loans, SIP, FD, mutual funds, gold).
    You speak clearly and support both Hindi, English, and Hinglish. Detect if the user asks in Hindi and respond warmly in Hindi or Hinglish!
    
    Here is the live real-time financial context of the active user:
    - Name: ${user?.fullName || "Valued User"}
    - Age: ${user?.age || 26} years old
    - Monthly Base Salary: ₹${user?.salary || 50000}
    - Custom Risk Preference: ${user?.riskLevel || "Medium"}
    - Active Total Income: ₹${totalIncome}
    - Active Total Expenses: ₹${totalExpense}
    - Current Monthly Net Surplus: ₹${totalIncome - totalExpense}
    - Savings Goals: ${userGoals.map((g) => `${g.title} (Target: ₹${g.targetAmount}, Current: ₹${g.currentAmount})`).join(", ") || "No savings goals created yet."}

    Be realistic, practical, and highly encouraging. Use beautiful markdown bullet points for layout.`;

    const chatHistory = dbData.chats
      .filter((c) => c.userId === userId)
      .slice(-6) // Include last 6 messages for context
      .map((c) => `${c.sender === "user" ? "User" : "FinBuddy AI"}: ${c.message}`)
      .join("\n");

    let aiAnswer = "";
    const client = getGeminiClient();

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `${systemPrompt}\n\nRecent Chat History:\n${chatHistory}\n\nUser's New Message: ${message}\nFinBuddy AI:`,
        });
        aiAnswer = response.text || "I apologize, I could not formulate an answer right now.";
      } catch (geminiError) {
        console.error("Gemini API call failed, using high-quality local fallback", geminiError);
        aiAnswer = getLocalCoachFallback(message, user?.fullName, user?.age, user?.salary, totalIncome, totalExpense);
      }
    } else {
      // Offline/Local high quality fallback
      aiAnswer = getLocalCoachFallback(message, user?.fullName, user?.age, user?.salary, totalIncome, totalExpense);
    }

    // Save AI message to database
    const aiMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      userId,
      message: aiAnswer,
      sender: "ai",
      timestamp: new Date().toISOString(),
    };
    dbData.chats.push(aiMsg);
    DB.save(dbData);

    res.json({ userMessage: userMsg, aiMessage: aiMsg });
  } catch (error) {
    res.status(500).json({ error: "Failed to process chat response" });
  }
});

// ==========================================
// 2. AI BUDGET PLANNER
// ==========================================
router.get("/budget-planner", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const dbData = DB.data;
    const user = dbData.users.find((u) => u.id === userId);
    const userIncomes = dbData.incomes.filter((i) => i.userId === userId);
    const userExpenses = dbData.expenses.filter((e) => e.userId === userId);

    const totalIncome = userIncomes.reduce((s, i) => s + i.amount, 0) || user?.salary || 50000;
    const totalExpense = userExpenses.reduce((s, e) => s + e.amount, 0);

    const client = getGeminiClient();
    let budgetPlan: any = null;

    if (client) {
      try {
        const prompt = `Analyze this user's profile and generate an automatic monthly budget plan following the 50/30/20 rule:
        - Monthly Income: ₹${totalIncome}
        - Current Expenses: ₹${totalExpense}
        - Age: ${user?.age || 26}
        - Risk Level: ${user?.riskLevel || "Medium"}

        Output must be in JSON format matching this exact schema:
        {
          "essentialExpenses": number (amount allocated for rent, bills, food, medical - approx 50%),
          "optionalExpenses": number (amount allocated for shopping, entertainment, travel - approx 30%),
          "suggestedSavings": number (amount allocated for investments, goal saving - approx 20%),
          "riskLevel": "Low" | "Medium" | "High",
          "actionableTips": [string] (provide 4 smart, high-impact bullet points customized for this user)
        }`;

        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const jsonText = response.text?.trim() || "";
        budgetPlan = JSON.parse(jsonText);
      } catch (e) {
        console.error("Failed to fetch AI budget planner, utilizing local model");
      }
    }

    if (!budgetPlan) {
      // Local highly-crafted budget model fallback
      const essential = Math.round(totalIncome * 0.50);
      const optional = Math.round(totalIncome * 0.30);
      const savings = Math.round(totalIncome * 0.20);
      budgetPlan = {
        essentialExpenses: essential,
        optionalExpenses: optional,
        suggestedSavings: savings,
        riskLevel: user?.riskLevel || "Medium",
        actionableTips: [
          `Allocate ₹${essential.toLocaleString("en-IN")} (50%) to your absolute essentials (rent, bills, utilities, groceries). Currently, your actual expenses are ₹${totalExpense.toLocaleString("en-IN")}.`,
          `Set aside a maximum of ₹${optional.toLocaleString("en-IN")} (30%) for lifestyle and optional expenses (shopping, travel, dine-outs). Keep track of subscriptions!`,
          `Directly route ₹${savings.toLocaleString("en-IN")} (20%) into wealth building channels (FD, SIP Mutual funds, Gold) on the 1st of every month.`,
          `Since your risk profile is ${user?.riskLevel || "Medium"}, consider starting an index fund SIP of ₹5,000 and matching it with an IDBI tax-saver FD.`
        ],
      };
    }

    res.json(budgetPlan);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI budget plan" });
  }
});

// ==========================================
// 3. AI FRAUD DETECTION
// ==========================================
router.get(["/fraud-detection", "/fraud-detector"], authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const dbData = DB.data;
    const userExpenses = dbData.expenses.filter((e) => e.userId === userId);

    let fraudReport: any = null;
    const client = getGeminiClient();

    if (client && userExpenses.length > 0) {
      try {
        const txList = userExpenses.map((e) => `ID: ${e.id}, Date: ${e.date}, Amount: ₹${e.amount}, Category: ${e.category}, Description: ${e.description}`).join("\n");
        const prompt = `Analyze these expense transactions for potential fraud, unusual behavior, or security risks. 
        Detect things like duplicate transactions on the same day, abnormally large values, or unexpected spending spikes.
        
        Transactions:\n${txList}

        Output must be in JSON format matching this exact schema:
        {
          "fraudRiskScore": number (0 to 100, where 0 is secure and 100 is high risk),
          "anomaliesFound": number (count),
          "alerts": [
            {
              "transactionId": string,
              "severity": "Low" | "Medium" | "High",
              "reason": string (why this transaction is flagged)
            }
          ],
          "securityAdvice": string (general security guideline to protect user's banking credentials)
        }`;

        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        fraudReport = JSON.parse(response.text?.trim() || "{}");
      } catch (e) {
        console.error("Failed to run AI fraud detection, using dynamic engine fallback");
      }
    }

    if (!fraudReport) {
      // Dynamic local fraud analysis engine
      let score = 12; // base healthy score
      const alerts: any[] = [];

      // Check for transactions above ₹5,000 (abnormally high for general consumer)
      userExpenses.forEach((exp) => {
        if (exp.amount > 5000) {
          alerts.push({
            transactionId: exp.id,
            severity: "Medium",
            reason: `High transaction amount of ₹${exp.amount} flagged under '${exp.category}'. Confirm if this was authorized.`,
          });
          score += 18;
        }
      });

      // Check for duplicates (same category, same amount, same day)
      const dayAmountMap: { [key: string]: string[] } = {};
      userExpenses.forEach((exp) => {
        const key = `${exp.date}_${exp.amount}_${exp.category}`;
        if (dayAmountMap[key]) {
          dayAmountMap[key].push(exp.id);
        } else {
          dayAmountMap[key] = [exp.id];
        }
      });

      Object.values(dayAmountMap).forEach((ids) => {
        if (ids.length > 1) {
          alerts.push({
            transactionId: ids[1],
            severity: "High",
            reason: `Potential double charge or accidental duplicate transaction found in database. Amount is identical.`,
          });
          score += 25;
        }
      });

      score = Math.min(100, score);

      fraudReport = {
        fraudRiskScore: score,
        anomaliesFound: alerts.length,
        alerts,
        securityAdvice: "FinBuddy Security Team recommends enabling Multi-Factor Authentication (MFA) and never sharing your online IDBI banking OTP or login passwords with anyone.",
      };
    }

    res.json(fraudReport);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI fraud report" });
  }
});

// ==========================================
// LOCAL INTELLIGENCE FALLBACK GENERATORS
// ==========================================
function getLocalCoachFallback(msg: string, name = "User", age = 26, salary = 50000, income = 0, expense = 0): string {
  const query = msg.toLowerCase();

  if (query.includes("sip") || query.includes("systematic investment")) {
    return `### 📊 FinBuddy AI SIP Guide (सिस्टेमैटिक इन्वेस्टमेंट प्लान)
    
    A **Systematic Investment Plan (SIP)** is a wealth-building method where you invest a fixed amount regularly (monthly/quarterly) in mutual funds.
    
    **Why SIP is perfect for you:**
    - **Rupee Cost Averaging**: You buy more units when prices are low and fewer when high.
    - **Power of Compounding**: Regular investing yields explosive compounding interest over 5, 10, or 20 years.
    - **Disciplined Savings**: Direct auto-debit on salary day keeps your savings on track.
    
    **🎯 Personalized Recommendation for ${name}:**
    - Since your risk level is configured as moderate/high, putting **₹5,000 - ₹10,000 per month** in an IDBI Equity Nifty 50 Index Fund SIP can potentially yield **12-15% expected annual returns** over the next 5 years!
    - *Hindi Tip*: SIP के माध्यम से आप अनुशासन के साथ छोटा-छोटा निवेश कर सकते हैं जो आगे चलकर बड़ी संपत्ति (Wealth) में बदल जाएगा।`;
  }

  if (query.includes("mutual fund") || query.includes("mutual")) {
    return `### 📈 Mutual Funds Guide (म्यूचुअल फंड)
    
    A **Mutual Fund** pools money from thousands of retail investors to buy a diversified portfolio of stocks, bonds, or security assets managed by expert Fund Managers.
    
    **Types of Mutual Funds:**
    1. **Equity Funds**: High risk, high returns (long term stock market wealth).
    2. **Debt Funds**: Low risk, stable returns (fixed income securities).
    3. **Hybrid Funds**: Dynamic balance of Equity & Debt.
    
    **FinBuddy Premium Suggestion:**
    - For your profile, we recommend a **70:30 allocation**: 70% in Equity Mutual Funds (for capital growth) and 30% in Debt Funds/PPF (for capital protection).`;
  }

  if (query.includes("loan") || query.includes("emi")) {
    return `### 🏦 FinBuddy Loan & EMI Education
    
    Loans are powerful tools to acquire assets (Home, Education, Car) but must be managed with absolute discipline.
    
    **Important Tips to Minimize EMI Burden:**
    - **Keep EMIs under 35%**: Your total monthly EMI obligations should never exceed 35% of your take-home salary.
    - **Pre-pay whenever possible**: Making just one extra EMI payment every year can slash your loan tenure by up to 3 years.
    - **Compare interest rates**: IDBI Bank offers competitive floating and fixed interest rates on Home & Car Loans. Always check for low processing fees.`;
  }

  if (query.includes("fd") || query.includes("fixed deposit")) {
    return `### 🔒 Fixed Deposits (फिक्स्ड डिपॉजिट - FD)
    
    A **Fixed Deposit** is a guaranteed, zero-market-risk investment where you deposit money with a bank for a fixed tenure at an agreed interest rate.
    
    **Key Highlights:**
    - **Safety First**: Your capital is 100% secure.
    - **Stable Returns**: Pays a guaranteed 6.5% to 7.8% interest (with extra premium interest for senior citizens).
    - **Liquidity**: You can take an instant overdraft loan up to 90% of your FD value without breaking the deposit.
    
    *Advice*: Put at least 3 to 6 months of your expenses (₹${(expense * 3 || 50000).toLocaleString("en-IN")}) into a liquid FD as an Emergency Fund!`;
  }

  if (query.includes("hindi") || query.includes("नमस्ते") || query.includes("मदद")) {
    return `### 🇮🇳 नमस्ते ${name}! मैं हूँ आपका FinBuddy AI Financial Coach।
    
    मैं आपकी डिजिटल वेल्थ मैनेजमेंट और बजट प्लानिंग में पूरी मदद कर सकता हूँ।
    
    **मैं आपके लिए ये सब कर सकता हूँ:**
    1. **म्यूचुअल फंड और SIP** के फायदों को समझाना।
    2. आपके **खर्चों का विश्लेषण (Spending Analysis)** करना।
    3. आपकी उम्र और वेतन के हिसाब से **सही निवेश (Investment Recommendations)** बताना।
    4. **लोन और ईएमआई (EMI)** का गणित समझाना।
    
    आप मुझसे कोई भी वित्तीय (Financial) प्रश्न पूछ सकते हैं। आप क्या जानना चाहते हैं?`;
  }

  // General Financial analysis based on user state
  return `### 🌟 FinBuddy AI Spending Analysis & Tips
  
  Hello **${name}**, let's analyze your digital wealth status:
  - Your configured monthly salary is **₹${salary.toLocaleString("en-IN")}**.
  - This month, you logged **₹${expense.toLocaleString("en-IN")}** in expenses.
  - Your net savings potential is **₹${(salary - expense).toLocaleString("en-IN")}**!
  
  **🎯 Top Saving Actions for ${name}:**
  1. **Leverage the 50/30/20 Rule**: Keep essential costs below ₹${Math.round(salary * 0.5).toLocaleString("en-IN")} and direct ₹${Math.round(salary * 0.2).toLocaleString("en-IN")} straight to savings.
  2. **Automate Wealth SIP**: Setup a direct-debit SIP in a diversified index fund on the 1st of every month to eliminate spending impulses.
  3. **Build your Security Net**: It looks like you've got ₹35,000 saved towards your Emergency Fund. Boost this to ₹50,000 to fully cover unexpected events.
  
  *Ask me about:* **"What is SIP?"**, **"How do Mutual Funds work?"**, or **"Explain FD benefits"** in English or Hindi!`;
}

export default router;
