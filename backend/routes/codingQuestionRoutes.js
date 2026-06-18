import express from "express";
import { 
  createCodingQuestion, 
  getCodingQuestions, 
  deleteCodingQuestion 
} from "../controllers/codingQuestionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new coding question (protected route)
router.post("/", protect, createCodingQuestion);

// Get all coding questions for an exam (public route)
router.get("/:examId", getCodingQuestions);

// Delete a coding question (protected route)
router.delete("/:id", protect, deleteCodingQuestion);

export default router;
