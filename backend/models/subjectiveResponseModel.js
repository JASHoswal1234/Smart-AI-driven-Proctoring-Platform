import mongoose from "mongoose";

const subjectiveResponseSchema = mongoose.Schema(
  {
    studentEmail: {
      type: String,
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    examId: {
      type: String,
      required: true,
    },
    studentAnswer: {
      type: String,
      required: true,
    },
    aiScore: {
      type: Number,
      required: true,
      default: 0,
    },
    aiFeedback: {
      type: String,
      default: "",
    },
    maxMarks: {
      type: Number,
      required: true,
    },
    gradedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const SubjectiveResponse = mongoose.model("SubjectiveResponse", subjectiveResponseSchema);

export default SubjectiveResponse;
