import asyncHandler from "express-async-handler";
import Result from "../models/resultModel.js";
import Question from "../models/quesModel.js";
import CodingQuestion from "../models/codingQuestionModel.js";
import SubjectiveResponse from "../models/subjectiveResponseModel.js";
import { gradeSubjectiveAnswer } from "../utils/groqGrader.js";
import { sendResultEmail } from "../utils/emailService.js";
import Exam from "../models/examModel.js";

// @desc    Save exam result
// @route   POST /api/results
// @access  Private
const saveResult = asyncHandler(async (req, res) => {
  const { examId, answers, subjectiveAnswers } = req.body;

  console.log('=== SAVE RESULT REQUEST ===');
  console.log('🔥 EMAIL FEATURE LOADED - Server restarted successfully! 🔥');
  console.log('ExamId:', examId);
  console.log('MCQ Answers:', answers);
  console.log('Subjective Answers:', subjectiveAnswers);

  if (!examId || !answers) {
    res.status(400);
    throw new Error("Please provide examId and answers");
  }
  // Check if result already exists for this user and exam
  const existingResult = await Result.findOne({
    examId,
    userId: req.user._id,
  });

  if (existingResult) {
    console.log('Result already exists for this user and exam');
    res.status(400);
    throw new Error("You have already submitted this exam");
  }

  // Get all questions for this exam
  const questions = await Question.find({ examId });
  console.log(`Found ${questions.length} questions for exam ${examId}`);
  console.log('Question types:', questions.map(q => ({ id: q._id, type: q.questionType, marks: q.ansmarks })));

  // Calculate MCQ marks
  let mcqScore = 0;
  let correctAnswers = 0;
  let mcqQuestions = questions.filter(q => !q.questionType || q.questionType === "mcq");

  console.log(`Total MCQ questions: ${mcqQuestions.length}`);

  for (const question of mcqQuestions) {
    const userAnswer = answers[question._id.toString()];
    if (userAnswer) {
      const correctOption = question.options.find((opt) => opt.isCorrect);
      if (correctOption && correctOption._id.toString() === userAnswer) {
        const marks = question.ansmarks !== undefined ? question.ansmarks : 1;
        mcqScore += marks;
        correctAnswers++;
        console.log(`MCQ ${question._id}: Correct! +${marks} marks (Total MCQ: ${mcqScore})`);
      } else {
        console.log(`MCQ ${question._id}: Wrong`);
      }
    } else {
      console.log(`MCQ ${question._id}: Not answered`);
    }
  }

  console.log(`Final MCQ Score: ${mcqScore} (${correctAnswers}/${mcqQuestions.length} correct)`);

  // Grade subjective answers
  let subjectiveScore = 0;
  const subjectiveResults = [];

  if (subjectiveAnswers) {
    console.log('Grading subjective answers...');
    for (const [questionId, studentAnswer] of Object.entries(subjectiveAnswers)) {
      const question = questions.find((q) => q._id.toString() === questionId);
      
      if (question && question.questionType === "subjective") {
        console.log(`Grading subjective question ${questionId}...`);
        const { score, feedback } = await gradeSubjectiveAnswer(
          question.question,
          question.modelAnswer,
          studentAnswer,
          question.ansmarks
        );

        console.log(`Subjective ${questionId}: Score ${score}/${question.ansmarks}, Feedback: ${feedback}`);
        subjectiveScore += score;

        // Save subjective response
        const subjectiveResponse = await SubjectiveResponse.create({
          studentEmail: req.user.email,
          questionId: question._id,
          examId,
          studentAnswer,
          aiScore: score,
          aiFeedback: feedback,
          maxMarks: question.ansmarks,
        });

        subjectiveResults.push({
          questionId,
          score,
          feedback,
          maxMarks: question.ansmarks,
        });
      }
    }
  }

  console.log(`Subjective Score: ${subjectiveScore}`);

  // Calculate total
  const totalScore = mcqScore + subjectiveScore;
  const maxPossible = questions.reduce((sum, q) => sum + (q.ansmarks || 0), 0);
  
  console.log(`MCQ Score: ${mcqScore}`);
  console.log(`Subjective Score: ${subjectiveScore}`);
  console.log(`Total Score: ${totalScore}`);
  console.log(`Max Possible: ${maxPossible}`);
  console.log(`Raw Percentage: ${maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0}`);
  
  let percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
  
  // Cap percentage at 100% (shouldn't exceed but just in case)
  percentage = Math.min(percentage, 100);

  console.log(`Final Percentage (capped): ${percentage.toFixed(2)}%`);

  const result = await Result.create({
    examId,
    userId: req.user._id,
    answers: new Map(Object.entries(answers)),
    totalMarks: totalScore,
    percentage,
    showToStudent: true, // Auto-show results to students
  });

  console.log('Result saved:', result._id);
  
  // Send email with results to the student
  try {
    // Get exam details for email (examId is UUID, not ObjectId)
    const exam = await Exam.findOne({ examId });
    
    const resultData = {
      totalScore,
      percentage,
      mcqScore,
      subjectiveScore,
      maxPossible,
    };

    const emailResult = await sendResultEmail(
      req.user.email,
      req.user.name,
      { title: exam?.examName || 'Exam' },
      resultData
    );

    if (emailResult.success) {
      console.log('✅ Result email sent successfully to:', req.user.email);
    } else {
      console.error('❌ Failed to send result email:', emailResult.error);
    }
  } catch (emailError) {
    console.error('❌ Error sending result email:', emailError);
    // Don't fail the request if email fails
  }

  console.log('=== END SAVE RESULT ===');

  res.status(201).json({
    success: true,
    data: {
      result,
      mcqScore,
      subjectiveScore,
      totalScore,
      percentage,
      subjectiveResults,
    },
  });
});

// @desc    Get results for a specific exam (for teachers)
// @route   GET /api/results/exam/:examId
// @access  Private
const getResultsByExamId = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  // Get MCQ results
  const results = await Result.find({ examId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  const codingQuestions = await CodingQuestion.find({ examId }).populate("submittedAnswer");

  const combinedResults = await Promise.all(
    results.map(async (result) => {
      const studentCodingSubmissions = codingQuestions
        .filter(
          (q) =>
            q.submittedAnswer &&
            q.submittedAnswer.userId?.toString() === result.userId._id.toString()
        )
        .map((q) => ({
          question: q.question,
          code: q.submittedAnswer.code,
          language: q.submittedAnswer.language,
          status: q.submittedAnswer.status,
          executionTime: q.submittedAnswer.executionTime,
        }));

      // Get subjective responses
      const subjectiveResponses = await SubjectiveResponse.find({
        examId,
        studentEmail: result.userId.email,
      }).populate("questionId", "question ansmarks");

      return {
        ...result.toObject(),
        codingSubmissions: studentCodingSubmissions,
        subjectiveResponses: subjectiveResponses.map((sr) => ({
          question: sr.questionId?.question,
          studentAnswer: sr.studentAnswer,
          aiScore: sr.aiScore,
          aiFeedback: sr.aiFeedback,
          maxMarks: sr.maxMarks,
          gradedAt: sr.gradedAt,
        })),
      };
    })
  );

  res.status(200).json({
    success: true,
    data: combinedResults,
  });
});

// @desc    Get results for current user
// @route   GET /api/results/user
// @access  Private
const getUserResults = asyncHandler(async (req, res) => {
  const results = await Result.find({
    userId: req.user._id,
    showToStudent: true,
  }).sort({
    createdAt: -1,
  });

  const resultsWithDetails = await Promise.all(
    results.map(async (result) => {
      // Get coding submissions
      const codingQuestions = await CodingQuestion.find({
        examId: result.examId,
        "submittedAnswer.userId": req.user._id,
      }).select("question submittedAnswer");

      // Get subjective responses
      const subjectiveResponses = await SubjectiveResponse.find({
        examId: result.examId,
        studentEmail: req.user.email,
      }).populate("questionId", "question ansmarks");

      return {
        ...result.toObject(),
        codingSubmissions: codingQuestions.map((q) => ({
          question: q.question,
          code: q.submittedAnswer.code,
          language: q.submittedAnswer.language,
          status: q.submittedAnswer.status,
        })),
        subjectiveResponses: subjectiveResponses.map((sr) => ({
          question: sr.questionId?.question,
          studentAnswer: sr.studentAnswer,
          aiScore: sr.aiScore,
          aiFeedback: sr.aiFeedback,
          maxMarks: sr.maxMarks,
          gradedAt: sr.gradedAt,
        })),
      };
    })
  );

  res.status(200).json({
    success: true,
    data: resultsWithDetails,
  });
});

// @desc    Toggle showToStudent for a result
// @route   PUT /api/results/:resultId/toggle-visibility
// @access  Private (Teacher only)
const toggleResultVisibility = asyncHandler(async (req, res) => {
  const { resultId } = req.params;

  const result = await Result.findById(resultId);
  if (!result) {
    res.status(404);
    throw new Error("Result not found");
  }

  result.showToStudent = !result.showToStudent;
  await result.save();

  res.status(200).json({
    success: true,
    data: result,
  });
});

// @desc    Get all results (for teachers)
// @route   GET /api/results/all
// @access  Private (Teacher only)
const getAllResults = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher") {
    res.status(403);
    throw new Error("Not authorized to view all results");
  }

  const results = await Result.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  const codingQuestions = await CodingQuestion.find().populate("submittedAnswer");

  const combinedResults = await Promise.all(
    results.map(async (result) => {
      const studentCodingSubmissions = codingQuestions
        .filter(
          (q) =>
            q.submittedAnswer &&
            q.submittedAnswer.userId?.toString() === result.userId._id.toString()
        )
        .map((q) => ({
          question: q.question,
          code: q.submittedAnswer.code,
          language: q.submittedAnswer.language,
          status: q.submittedAnswer.status,
          executionTime: q.submittedAnswer.executionTime,
        }));

      // Get subjective responses
      const subjectiveResponses = await SubjectiveResponse.find({
        examId: result.examId,
        studentEmail: result.userId.email,
      }).populate("questionId", "question ansmarks");

      return {
        ...result.toObject(),
        codingSubmissions: studentCodingSubmissions,
        subjectiveResponses: subjectiveResponses.map((sr) => ({
          question: sr.questionId?.question,
          studentAnswer: sr.studentAnswer,
          aiScore: sr.aiScore,
          aiFeedback: sr.aiFeedback,
          maxMarks: sr.maxMarks,
          gradedAt: sr.gradedAt,
        })),
      };
    })
  );

  res.status(200).json({
    success: true,
    data: combinedResults,
  });
});

// @desc    Get exam analytics (students get anonymized stats, teachers get full details)
// @route   GET /api/results/analytics/:examId
// @access  Private
const getExamAnalytics = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  // Get all results for this exam
  const results = await Result.find({ examId });
  
  if (!results || results.length === 0) {
    res.status(404);
    throw new Error("No results found for this exam");
  }
  
  // Get current user's result
  const myResult = results.find(r => r.userId.toString() === req.user._id.toString());
  
  if (!myResult) {
    res.status(404);
    throw new Error("You have not taken this exam yet");
  }
  
  // Calculate statistics
  const scores = results.map(r => r.percentage || 0).sort((a, b) => b - a);
  const myScore = myResult.percentage || 0;
  
  // Calculate rank
  const rank = scores.findIndex(s => s === myScore) + 1;
  
  // Calculate percentile
  const belowMe = scores.filter(s => s < myScore).length;
  const percentile = scores.length > 1 ? ((belowMe / scores.length) * 100).toFixed(1) : 100;
  
  // Calculate average
  const average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  
  // Score distribution
  const distribution = [
    { range: '0-20%', count: scores.filter(s => s >= 0 && s < 20).length },
    { range: '20-40%', count: scores.filter(s => s >= 20 && s < 40).length },
    { range: '40-60%', count: scores.filter(s => s >= 40 && s < 60).length },
    { range: '60-80%', count: scores.filter(s => s >= 60 && s < 80).length },
    { range: '80-100%', count: scores.filter(s => s >= 80 && s <= 100).length },
  ];
  
  // Return analytics
  res.status(200).json({
    success: true,
    data: {
      myScore,
      rank,
      totalStudents: scores.length,
      percentile,
      average,
      highest: scores[0],
      lowest: scores[scores.length - 1],
      distribution,
      // Only include student details for teachers
      ...(req.user.role === 'teacher' && {
        allResults: results.map(r => ({
          userId: r.userId,
          score: r.percentage,
          totalMarks: r.totalMarks,
        }))
      })
    }
  });
});

export {
  saveResult,
  getResultsByExamId,
  getUserResults,
  toggleResultVisibility,
  getAllResults,
  getExamAnalytics,
};
