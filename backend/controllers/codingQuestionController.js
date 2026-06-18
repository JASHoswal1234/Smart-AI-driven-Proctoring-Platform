import asyncHandler from "express-async-handler";
import CodingQuestion from "../models/codingQuestionModel.js";

// @desc Create a new coding question
// @route POST /api/coding-questions
// @access Private (teacher)
const createCodingQuestion = asyncHandler(async (req, res) => {
  const { examId, question, description, ansmarks, sampleInput, sampleOutput, allowedLanguages } = req.body;

  if (!examId || !question || !description) {
    res.status(400);
    throw new Error("Exam ID, question, and description are required");
  }

  const codingQuestion = new CodingQuestion({
    examId,
    question,
    description,
    ansmarks: ansmarks || 10,
    sampleInput: sampleInput || "",
    sampleOutput: sampleOutput || "",
    allowedLanguages: allowedLanguages || ["JavaScript", "Python"],
    teacher: req.user._id,
  });

  const createdQuestion = await codingQuestion.save();

  if (createdQuestion) {
    res.status(201).json(createdQuestion);
  } else {
    res.status(400);
    throw new Error("Invalid coding question data");
  }
});

// @desc Get all coding questions for an exam
// @route GET /api/coding-questions/:examId
// @access Public
const getCodingQuestions = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  const codingQuestions = await CodingQuestion.find({ examId });
  
  res.status(200).json(codingQuestions);
});

// @desc Delete a coding question
// @route DELETE /api/coding-questions/:id
// @access Private (teacher)
const deleteCodingQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const codingQuestion = await CodingQuestion.findByIdAndDelete(id);
  
  if (!codingQuestion) {
    res.status(404);
    throw new Error("Coding question not found");
  }
  
  res.status(200).json({ message: "Coding question deleted successfully" });
});

export { createCodingQuestion, getCodingQuestions, deleteCodingQuestion };
