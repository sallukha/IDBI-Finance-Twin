import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DB, User } from "../db.js";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth.js";
import { env } from "../config/env.js";

const router = Router();

// Helper to generate JWT
function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, isAdmin: !!user.isAdmin },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

// 1. SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { email, password, fullName, age, salary, riskLevel } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: "Email, password and name are required" });
      return;
    }

    const dbData = DB.data;
    const existingUser = dbData.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    const newUser: User = {
      id: "u_" + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      age: Number(age) || 25,
      salary: Number(salary) || 50000,
      riskLevel: riskLevel || "Medium",
      verified: false, // OTP required
      otp,
      otpExpiry,
      createdAt: new Date().toISOString(),
    };

    dbData.users.push(newUser);
    DB.save(dbData);

    res.status(201).json({
      message: "Registration successful. Please verify OTP.",
      userId: newUser.id,
      email: newUser.email,
      otp, // Sending OTP back directly so the user can test easily without real email server!
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error during signup" });
  }
});

// 2. LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const dbData = DB.data;
    const user = dbData.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // If verified, generate token and return
    if (!user.verified) {
      // Re-trigger OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpiry = Date.now() + 10 * 60 * 1000;
      DB.save(dbData);

      res.status(202).json({
        message: "OTP verification required",
        userId: user.id,
        email: user.email,
        otp, // sent back for test ease
        verified: false,
      });
      return;
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        salary: user.salary,
        riskLevel: user.riskLevel,
        isAdmin: !!user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// 3. VERIFY OTP
router.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: "Email and OTP code are required" });
      return;
    }

    const dbData = DB.data;
    const user = dbData.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.otp !== otp || (user.otpExpiry && Date.now() > user.otpExpiry)) {
      res.status(400).json({ error: "Invalid or expired OTP code" });
      return;
    }

    // Mark as verified
    user.verified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    DB.save(dbData);

    const token = generateToken(user);
    res.json({
      message: "Email verified successfully!",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        salary: user.salary,
        riskLevel: user.riskLevel,
        isAdmin: !!user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// 4. FORGOT PASSWORD
router.post("/forgot-password", (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const dbData = DB.data;
    const user = dbData.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(404).json({ error: "Email not found" });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    DB.save(dbData);

    res.json({
      message: "Reset OTP generated successfully",
      email: user.email,
      otp, // return OTP directly for testing
    });
  } catch (error) {
    res.status(500).json({ error: "Forgot password operation failed" });
  }
});

// 5. RESET PASSWORD (using OTP)
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: "Email, OTP, and new password are required" });
      return;
    }

    const dbData = DB.data;
    const user = dbData.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.otp !== otp || (user.otpExpiry && Date.now() > user.otpExpiry)) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    // Reset Password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.verified = true; // Auto-verify on password reset if they had the OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    DB.save(dbData);

    res.json({ message: "Password reset successful! You can now log in." });
  } catch (error) {
    res.status(500).json({ error: "Password reset failed" });
  }
});

// 6. GET CURRENT USER PROFILE
router.get("/profile", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const dbData = DB.data;
    const user = dbData.users.find((u) => u.id === req.user?.id);

    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      age: user.age,
      salary: user.salary,
      riskLevel: user.riskLevel,
      isAdmin: !!user.isAdmin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// 7. UPDATE PROFILE
router.put("/profile", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fullName, age, salary, riskLevel } = req.body;
    const dbData = DB.data;
    const user = dbData.users.find((u) => u.id === req.user?.id);

    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    if (fullName) user.fullName = fullName;
    if (age) user.age = Number(age);
    if (salary) user.salary = Number(salary);
    if (riskLevel) user.riskLevel = riskLevel;

    DB.save(dbData);

    res.json({
      message: "Profile updated successfully!",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        salary: user.salary,
        riskLevel: user.riskLevel,
        isAdmin: !!user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
