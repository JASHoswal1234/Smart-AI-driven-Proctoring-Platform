import asyncHandler from "express-async-handler";
import Exam from "./../models/examModel.js";
import Question from "./../models/quesModel.js";
import Result from "./../models/resultModel.js";
import CheatingLog from "./../models/cheatingLogModel.js";
import SubjectiveResponse from "./../models/subjectiveResponseModel.js";
import CodingQuestion from "./../models/codingQuestionModel.js";

// @desc Get all exams (filtered by student's department and class)
// @route GET /api/exams
// @access Public
const getExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find();
  const now = new Date();
  // Add 2-minute grace so exams set to "start now" are immediately active
  const nowWithGrace = new Date(now.getTime() + 2 * 60 * 1000);
  
  console.log(`Total exams in DB: ${exams.length}`);
  console.log(`Current time: ${now}`);
  
  // If user is logged in and is a student, filter by department/class but show ALL exams (active, upcoming, expired)
  if (req.user && req.user.role === 'student') {
    const studentDept = req.user.department || 'Computer Science';
    const studentClass = req.user.class || 'First Year';
    
    console.log(`Student: ${req.user.name}, Dept: ${studentDept}, Class: ${studentClass}`);
    
    const filteredExams = exams.filter(exam => {
      const deptMatch = exam.allowedDepartments.includes('All') || exam.allowedDepartments.includes(studentDept);
      const classMatch = exam.allowedClasses.includes('All') || exam.allowedClasses.includes(studentClass);
      
      console.log(`Exam: ${exam.examName}`);
      console.log(`  - Allowed Depts: ${exam.allowedDepartments.join(', ')}`);
      console.log(`  - Allowed Classes: ${exam.allowedClasses.join(', ')}`);
      console.log(`  - Dept Match: ${deptMatch}, Class Match: ${classMatch}`);
      
      return deptMatch && classMatch;
    }).map(exam => {
      // Add status to each exam
      // Use nowWithGrace so exams set to "start now" aren't shown as upcoming
      const liveDate = new Date(exam.liveDate);
      const deadDate = new Date(exam.deadDate);
      
      let status = 'active';
      if (nowWithGrace < liveDate) {
        status = 'upcoming';
      } else if (now > deadDate) {
        status = 'expired';
      }
      
      return {
        ...exam.toObject(),
        status
      };
    });
    
    console.log(`Filtered ${filteredExams.length} exams for student`);
    res.status(200).json(filteredExams);
  } else {
    // Teachers see all exams with status
    const examsWithStatus = exams.map(exam => {
      const liveDate = new Date(exam.liveDate);
      const deadDate = new Date(exam.deadDate);
      
      let status = 'active';
      if (nowWithGrace < liveDate) {
        status = 'upcoming';
      } else if (now > deadDate) {
        status = 'expired';
      }
      
      return {
        ...exam.toObject(),
        status
      };
    });
    
    console.log(`Teacher viewing all ${examsWithStatus.length} exams`);
    res.status(200).json(examsWithStatus);
  }
});

// @desc Create a new exam
// @route POST /api/exams
// @access Private (admin)
const createExam = asyncHandler(async (req, res) => {
  const { examName, totalQuestions, duration, liveDate, deadDate, allowedDepartments, allowedClasses, hasCodingRound } = req.body;

  if (!examName || !totalQuestions || !duration || !liveDate || !deadDate) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  if (new Date(liveDate) >= new Date(deadDate)) {
    res.status(400);
    throw new Error("Live date must be before deadline date");
  }

  const exam = new Exam({
    examName,
    totalQuestions,
    duration,
    liveDate,
    deadDate,
    allowedDepartments: allowedDepartments || ['All'],
    allowedClasses: allowedClasses || ['All'],
    hasCodingRound: hasCodingRound || false,
  });

  const createdExam = await exam.save();

  if (createdExam) {
    res.status(201).json(createdExam);
  } else {
    res.status(400);
    throw new Error("Invalid Exam Data");
  }
});

const DeleteExamById = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const exam = await Exam.findOneAndDelete({ examId });
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  // Cascade delete all related data
  await Promise.all([
    Question.deleteMany({ examId }),
    Result.deleteMany({ examId }),
    CheatingLog.deleteMany({ examId }),
    SubjectiveResponse.deleteMany({ examId }),
    CodingQuestion.deleteMany({ examId }),
  ]);

  console.log(`Deleted exam ${examId} and all related data`);
  res.status(200).json({ message: "Exam and all related data deleted successfully" });
});

export { getExams, createExam, DeleteExamById };
