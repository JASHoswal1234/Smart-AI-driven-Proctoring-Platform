import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const examSchema = mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    liveDate: {
      type: Date,
      required: true,
    },
    deadDate: {
      type: Date,
      required: true,
    },
    // Define examId field with UUID generation
    examId: {
      type: String,
      default: uuidv4, // Generate a new UUID for each document
      unique: true, // Ensure uniqueness of UUIDs
    },
    // Exam access control
    allowedDepartments: {
      type: [String],
      enum: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'All'],
      default: ['All'],
    },
    allowedClasses: {
      type: [String],
      enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate', 'All'],
      default: ['All'],
    },
    // Coding round enabled/disabled
    hasCodingRound: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model("Exam", examSchema);

export default Exam;
