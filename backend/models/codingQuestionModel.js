import mongoose from "mongoose";

const codingSchema = new mongoose.Schema(
  {
    examId: {
      type: String,
      required: [true, "Exam ID is required"],
    },
    question: {
      type: String,
      required: [true, "Question title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Question description is required"],
      trim: true,
    },
    ansmarks: {
      type: Number,
      default: 10,
    },
    sampleInput: {
      type: String,
      trim: true,
      default: "",
    },
    sampleOutput: {
      type: String,
      trim: true,
      default: "",
    },
    allowedLanguages: {
      type: [String],
      default: ["JavaScript", "Python"],
    },
    submittedAnswer: {
      code: {
        type: String,
        trim: true,
      },
      language: {
        type: String,
        enum: ["javascript", "python", "java", "cpp", "c"],
      },
      status: {
        type: String,
        enum: ["pending", "passed", "failed", "error"],
        default: "pending",
      },
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Add any necessary indexes
codingSchema.index({ examId: 1 });

const CodingQuestion = mongoose.model("CodingQuestion", codingSchema);

export default CodingQuestion;
