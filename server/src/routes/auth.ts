import { randomInt, randomUUID } from "node:crypto";
import { Router, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "../db.js";
import { authenticateJWT, type AuthenticatedRequest } from "../middleware/auth.js";
import { env } from "../config/env.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  isDuplicateEmailError,
  updateUser,
} from "../repositories/userRepository.js";

const router = Router();
const riskLevels = new Set<User["riskLevel"]>(["Low", "Medium", "High"]);

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, isAdmin: !!user.isAdmin },
    env.jwtSecret,
    { expiresIn: "7d" },
  );
}

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    age: user.age,
    salary: user.salary,
    riskLevel: user.riskLevel,
    isAdmin: !!user.isAdmin,
    createdAt: user.createdAt,
  };
}

router.post("/signup", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const fullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : "";

    if (!email || !email.includes("@") || !fullName) {
      res.status(400).json({ error: "A valid email and name are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters long" });
      return;
    }
    if (await findUserByEmail(email)) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const requestedRisk = req.body.riskLevel as User["riskLevel"];
    const otp = generateOtp();
    const user: User = {
      id: `u_${randomUUID()}`,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      fullName,
      age: Number(req.body.age) || 25,
      salary: Number(req.body.salary) || 50000,
      riskLevel: riskLevels.has(requestedRisk) ? requestedRisk : "Medium",
      verified: false,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
      createdAt: new Date().toISOString(),
      isAdmin: false,
    };

    await createUser(user);

    res.status(201).json({
      message: "Registration successful. Please verify OTP.",
      userId: user.id,
      email: user.email,
      ...(!env.isProduction ? { otp } : {}),
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    console.error("Signup failed:", error);
    res.status(500).json({ error: "Internal server error during signup" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.verified) {
      const otp = generateOtp();
      await updateUser(user.id, {
        otp,
        otpExpiry: Date.now() + 10 * 60 * 1000,
      });
      res.status(202).json({
        message: "OTP verification required",
        userId: user.id,
        email: user.email,
        verified: false,
        ...(!env.isProduction ? { otp } : {}),
      });
      return;
    }

    res.json({ token: generateToken(user), user: publicUser(user) });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";
    if (!email || !otp) {
      res.status(400).json({ error: "Email and OTP code are required" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.otp !== otp || !user.otpExpiry || Date.now() > user.otpExpiry) {
      res.status(400).json({ error: "Invalid or expired OTP code" });
      return;
    }

    const verifiedUser = await updateUser(user.id, { verified: true }, ["otp", "otpExpiry"]);
    if (!verifiedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      message: "Email verified successfully!",
      token: generateToken(verifiedUser),
      user: publicUser(verifiedUser),
    });
  } catch (error) {
    console.error("OTP verification failed:", error);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: "Email not found" });
      return;
    }

    const otp = generateOtp();
    await updateUser(user.id, {
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
    });

    res.json({
      message: "Reset OTP generated successfully",
      email: user.email,
      ...(!env.isProduction ? { otp } : {}),
    });
  } catch (error) {
    console.error("Forgot password failed:", error);
    res.status(500).json({ error: "Forgot password operation failed" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";
    const newPassword =
      typeof req.body.newPassword === "string" ? req.body.newPassword : "";

    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: "Email, OTP, and new password are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters long" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.otp !== otp || !user.otpExpiry || Date.now() > user.otpExpiry) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    await updateUser(
      user.id,
      {
        passwordHash: await bcrypt.hash(newPassword, 12),
        verified: true,
      },
      ["otp", "otpExpiry"],
    );
    res.json({ message: "Password reset successful! You can now log in." });
  } catch (error) {
    console.error("Password reset failed:", error);
    res.status(500).json({ error: "Password reset failed" });
  }
});

router.get("/profile", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }
    res.json(publicUser(user));
  } catch (error) {
    console.error("Profile lookup failed:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/profile", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const values: Partial<User> = {};
    if (typeof req.body.fullName === "string" && req.body.fullName.trim()) {
      values.fullName = req.body.fullName.trim();
    }
    if (req.body.age !== undefined) values.age = Number(req.body.age);
    if (req.body.salary !== undefined) values.salary = Number(req.body.salary);
    if (riskLevels.has(req.body.riskLevel)) values.riskLevel = req.body.riskLevel;

    const user = await updateUser(req.user!.id, values);
    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    res.json({
      message: "Profile updated successfully!",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
