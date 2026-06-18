import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Select,
  MenuItem,
} from '@mui/material';
import swal from 'sweetalert';
import { useCreateQuestionMutation, useGetExamsQuery } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';

const AddQuestionForm = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [questionType, setQuestionType] = useState('mcq');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctOptions, setCorrectOptions] = useState([false, false, false, false]);
  const [modelAnswer, setModelAnswer] = useState('');
  const [marks, setMarks] = useState(1);
  const [selectedExamId, setSelectedExamId] = useState('');

  const handleOptionChange = (index) => {
    const updatedCorrectOptions = [...correctOptions];
    updatedCorrectOptions[index] = !correctOptions[index];
    setCorrectOptions(updatedCorrectOptions);
  };

  const [createQuestion] = useCreateQuestionMutation();
  const { data: examsData } = useGetExamsQuery();

  useEffect(() => {
    if (examsData && examsData.length > 0) {
      setSelectedExamId(examsData[0].examId);
      console.log(examsData[0].examId, 'examsData[0].examId');
    }
  }, [examsData]);

  const handleAddQuestion = async () => {
    if (newQuestion.trim() === '') {
      swal('', 'Please fill out the question.', 'error');
      return;
    }

    if (questionType === 'mcq' && newOptions.some((option) => option.trim() === '')) {
      swal('', 'Please fill out all options for MCQ.', 'error');
      return;
    }

    if (questionType === 'subjective' && modelAnswer.trim() === '') {
      swal('', 'Please provide a model answer for subjective question.', 'error');
      return;
    }

    const newQuestionObj = {
      question: newQuestion,
      questionType,
      examId: selectedExamId,
      ansmarks: marks,
    };

    if (questionType === 'mcq') {
      newQuestionObj.options = newOptions.map((option, index) => ({
        optionText: option,
        isCorrect: correctOptions[index],
      }));
    } else {
      newQuestionObj.modelAnswer = modelAnswer;
    }

    try {
      const res = await createQuestion(newQuestionObj).unwrap();
      if (res) {
        toast.success('Question added successfully!!!');
      }
      setQuestions([...questions, res]);
      setNewQuestion('');
      setQuestionType('mcq');
      setNewOptions(['', '', '', '']);
      setCorrectOptions([false, false, false, false]);
      setModelAnswer('');
      setMarks(1);
    } catch (err) {
      swal('', 'Failed to create question. Please try again.', 'error');
    }
  };

  const handleSubmitQuestions = () => {
    setQuestions([]);
    setNewQuestion('');
    setQuestionType('mcq');
    setNewOptions(['', '', '', '']);
    setCorrectOptions([false, false, false, false]);
    setModelAnswer('');
    setMarks(1);
  };

  return (
    <div>
      <Select
        label="Select Exam"
        value={selectedExamId}
        onChange={(e) => {
          console.log(e.target.value, 'option ID');
          setSelectedExamId(e.target.value);
        }}
        fullWidth
        sx={{ mb: 2 }}
      >
        {examsData &&
          examsData.map((exam) => (
            <MenuItem key={exam.examId} value={exam.examId}>
              {exam.examName}
            </MenuItem>
          ))}
      </Select>

      <Select
        label="Question Type"
        value={questionType}
        onChange={(e) => setQuestionType(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      >
        <MenuItem value="mcq">Multiple Choice (MCQ)</MenuItem>
        <MenuItem value="subjective">Subjective (Free Text)</MenuItem>
      </Select>

      <TextField
        label="Marks"
        type="number"
        value={marks}
        onChange={(e) => setMarks(Number(e.target.value))}
        fullWidth
        sx={{ mb: 2 }}
      />

      {questions.map((questionObj, questionIndex) => (
        <Box key={questionIndex} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <TextField
            label={`Question ${questionIndex + 1}`}
            value={questionObj.question}
            fullWidth
            multiline
            InputProps={{
              readOnly: true,
            }}
            sx={{ mb: 2 }}
          />
          {questionObj.questionType === 'mcq' ? (
            questionObj.options?.map((option, optionIndex) => (
              <Box key={optionIndex} sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label={`Option ${optionIndex + 1}`}
                    value={option.optionText}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                    size="small"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={option.isCorrect} disabled />}
                    label="Correct"
                  />
                </Stack>
              </Box>
            ))
          ) : (
            <TextField
              label="Model Answer"
              value={questionObj.modelAnswer}
              fullWidth
              multiline
              rows={2}
              InputProps={{
                readOnly: true,
              }}
            />
          )}
        </Box>
      ))}

      <TextField
        label="New Question"
        value={newQuestion}
        onChange={(e) => setNewQuestion(e.target.value)}
        fullWidth
        multiline
        rows={3}
        sx={{ mb: 2 }}
      />

      {questionType === 'mcq' ? (
        <>
          {newOptions.map((option, index) => (
            <Stack
              key={index}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
              mb={1}
            >
              <TextField
                label={`Option ${index + 1}`}
                value={newOptions[index]}
                onChange={(e) => {
                  const updatedOptions = [...newOptions];
                  updatedOptions[index] = e.target.value;
                  setNewOptions(updatedOptions);
                }}
                fullWidth
                sx={{ flex: '80%' }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={correctOptions[index]}
                    onChange={() => handleOptionChange(index)}
                  />
                }
                label={`Correct Option ${index + 1}`}
              />
            </Stack>
          ))}
        </>
      ) : (
        <TextField
          label="Model Answer (for AI grading)"
          value={modelAnswer}
          onChange={(e) => setModelAnswer(e.target.value)}
          fullWidth
          multiline
          rows={4}
          sx={{ mb: 2 }}
        />
      )}

      <Stack mt={2} direction="row" spacing={2}>
        <Button variant="outlined" onClick={handleAddQuestion}>
          Add Question
        </Button>
        <Button variant="outlined" onClick={handleSubmitQuestions}>
          Submit Questions
        </Button>
      </Stack>
    </div>
  );
};

export default AddQuestionForm;
