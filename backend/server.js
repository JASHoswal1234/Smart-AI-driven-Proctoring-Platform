import express from "express";
import dotenv from "dotenv";
dotenv.config(); // must be first before any other imports that read env vars
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import examRoutes from "./routes/examRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import codingQuestionRoutes from "./routes/codingQuestionRoutes.js";
import { exec } from "child_process";
import { writeFileSync } from "fs";
import cors from "cors";
import { uploadScreenshot } from "./utils/cloudinaryUpload.js";
console.log("MONGO URI =", process.env.MONGO_URI);
connectDB();
const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS must be FIRST - before any other middleware
const allowedOrigins = [
  "https://ai-proctored-system.vercel.app",
  "https://proctaii.vercel.app",
  "http://localhost:3000",
  "http://localhost:5000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or curl requests)
      if (!origin) return callback(null, true);
      
      // Remove trailing slash for comparison
      const cleanOrigin = origin.replace(/\/$/, '');
      
      // Check if origin matches allowed origins or is a Vercel preview URL
      if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.includes('.vercel.app')) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked origin:", origin);
        callback(null, true); // Temporarily allow all origins for debugging
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Handle preflight requests for all routes
app.options("*", cors());

// Then other middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.post("/run-python", (req, res) => {
  const { code } = req.body; // Get Python code from request body
  writeFileSync("script.py", code); // Write code to script.py file

  exec("python script.py", (error, stdout, stderr) => {
    if (error) {
      res.send(`Error is: ${stderr}`); // Send error message if any
    } else {
      res.send(stdout); // Send output of the Python script
    }
  });
});

app.post("/run-javascript", (req, res) => {
  const { code } = req.body; // Get JavaScript code from request body
  writeFileSync("script.js", code); // Write code to script.js file

  exec("node script.js", (error, stdout, stderr) => {
    if (error) {
      res.send(`Error: ${stderr}`); // Send error message if any
    } else {
      res.send(stdout); // Send output of the JavaScript code
    }
  });
});

app.post("/run-java", (req, res) => {
  const { code } = req.body; // Get Java code from request body
  writeFileSync("Main.java", code); // Write code to Main.java file

  exec("javac Main.java && java Main", (error, stdout, stderr) => {
    if (error) {
      res.send(`Error: ${stderr}`); // Send error message if any
    } else {
      res.send(stdout); // Send output of the Java program
    }
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/users", examRoutes);
app.use("/api/users", resultRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/coding-questions", codingQuestionRoutes);

// Screenshot upload route
app.post("/api/upload/screenshot", async (req, res) => {
  try {
    const { dataUrl, examId, type } = req.body;
    if (!dataUrl || !examId || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const url = await uploadScreenshot(dataUrl, examId, type);
    res.json({ secure_url: url });
  } catch (err) {
    console.error("Screenshot upload error:", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
});

// Health check endpoint for all environments
app.get("/", (req, res) => {
  res.send("<h1>ProctAI Backend Server is Running ✅</h1>");
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is healthy" });
});

// Error handling middleware - must be after all routes
app.use(notFound);
app.use(errorHandler);

// Server
app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`);
});

// Todos:
// -**POST /api/users**- Register a users
// -**POST /api/users/auth**- Authenticate a user and get token
// -**POST /api/users/logout**- logou user and clear cookie
// -**GET /api/users/profile**- Get user Profile
// -**PUT /api/users/profile**- Update user Profile
