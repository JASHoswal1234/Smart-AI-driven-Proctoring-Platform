import asyncHandler from "express-async-handler";
import Question from "../models/quesModel.js";

const getQuestionsByExamId = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  console.log("Fetching questions for exam id:", examId);

  if (!examId) {
    return res.status(400).json({ error: "examId is missing or invalid" });
  }

  const questions = await Question.find({ examId }).sort({ sequenceNo: 1, createdAt: 1 });
  console.log(`Found ${questions.length} questions:`, questions.map(q => ({ 
    id: q._id, 
    type: q.questionType, 
    question: q.question.substring(0, 50) 
  })));

  res.status(200).json(questions);
});

const createQuestion = asyncHandler(async (req, res) => {
  const { question, options, examId, questionType, modelAnswer, ansmarks, sequenceNo, imageUrl, audioUrl } = req.body;

  if (!examId) {
    return res.status(400).json({ error: "examId is missing or invalid" });
  }

  const newQuestion = new Question({
    question,
    questionType: questionType || "mcq",
    options: questionType === "mcq" ? options : [],
    modelAnswer: questionType === "subjective" ? modelAnswer : undefined,
    ansmarks: ansmarks || 0,
    examId,
    sequenceNo: sequenceNo ?? 0,
    imageUrl: imageUrl || null,
    audioUrl: audioUrl || null,
  });

  const createdQuestion = await newQuestion.save();

  if (createdQuestion) {
    res.status(201).json(createdQuestion);
  } else {
    res.status(400);
    throw new Error("Invalid Question Data");
  }
});

const bulkCreateQuestions = asyncHandler(async (req, res) => {
  const { examId, questions } = req.body;

  if (!examId) {
    return res.status(400).json({ error: 'examId is required' });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'questions array is required and must not be empty' });
  }

  const docs = questions.map((q) => ({
    question: q.question,
    questionType: q.questionType || 'mcq',
    options: q.questionType === 'subjective' ? [] : (q.options || []),
    modelAnswer: q.questionType === 'subjective' ? (q.modelAnswer || '') : undefined,
    ansmarks: q.ansmarks || 1,
    examId,
  }));

  const created = await Question.insertMany(docs);
  res.status(201).json({ count: created.length, questions: created });
});

export { getQuestionsByExamId, createQuestion, bulkCreateQuestions };
