import mongoose from "mongoose";

const questionSchema = mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: ["mcq", "subjective"],
      default: "mcq",
    },
    options: [
      {
        optionText: {
          type: String,
          required: false,
        },
        isCorrect: {
          type: Boolean,
          required: false,
        },
      },
    ],
    modelAnswer: {
      type: String,
      required: false,
    },
    ansmarks: {
      type: Number,
      required: false,
      default: 0,
    },
    examId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model("Question", questionSchema);
//83309
export default Question;
