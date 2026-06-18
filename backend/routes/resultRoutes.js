import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  saveResult,
  getResultsByExamId,
  getUserResults,
  toggleResultVisibility,
  getAllResults,
  getExamAnalytics,
} from "../controllers/resultController.js";

const resultRoutes = express.Router();

// All routes are protected
resultRoutes.use(protect);

// Save result
resultRoutes.post("/results", saveResult);

// Get all results (for teachers)
resultRoutes.get("/results/all", getAllResults);

// Get results for a specific exam (teachers only)
resultRoutes.get("/results/exam/:examId", (req, res, next) => {
  if (req.user.role !== 'teacher') {
    res.status(403);
    throw new Error('Not authorized');
  }
  next();
}, getResultsByExamId);

// Get results for current user
resultRoutes.get("/results/user", getUserResults);

// Get exam analytics (students can see anonymized stats)
resultRoutes.get("/results/analytics/:examId", getExamAnalytics);

// Toggle result visibility
resultRoutes.put(
  "/results/:resultId/toggle-visibility",
  toggleResultVisibility
);

export default resultRoutes;
