import React, { useEffect, useState } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { Container, Select, MenuItem, InputLabel } from '@mui/material';
import { useGetQuestionsQuery } from 'src/slices/examApiSlice';
import { useNavigate, useParams } from 'react-router';
import axiosInstance from '../../../axios';
import { toast } from 'react-toastify';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';

export default function MultipleChoiceQuestion({ questions, saveUserTestScore, submitTest, answersRef }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('');
  const [codingAnswer, setCodingAnswer] = useState('');
  const [codingLanguage, setCodingLanguage] = useState('javascript');
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState(new Map());
  const [subjectiveAnswers, setSubjectiveAnswers] = useState({});
  const [codingAnswers, setCodingAnswers] = useState({});
  const navigate = useNavigate();
  const { examId } = useParams();
  const { cheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const [isLastQuestion, setIsLastQuestion] = useState(false);

  useEffect(() => {
    console.log('Current question index:', currentQuestion);
    console.log('Total questions:', questions?.length);
    console.log('Current question data:', questions?.[currentQuestion]);
    setIsLastQuestion(currentQuestion === questions.length - 1);
  }, [currentQuestion, questions]);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  // Keep answersRef in sync so force-submit can access current answers
  useEffect(() => {
    if (answersRef) {
      answersRef.current = Object.fromEntries(answers);
    }
  }, [answers, answersRef]);

  const handleNextQuestion = async () => {
    const currentQuestionData = questions[currentQuestion];
    
    // Handle MCQ (default if questionType is not set or is 'mcq')
    if (!currentQuestionData.questionType || currentQuestionData.questionType === 'mcq') {
      let isCorrect = false;
      if (currentQuestionData && currentQuestionData.options) {
        const correctOption = currentQuestionData.options.find((option) => option.isCorrect);
        if (correctOption && selectedOption) {
          isCorrect = correctOption._id === selectedOption;
        }
      }

      setAnswers((prev) => {
        const newAnswers = new Map(prev);
        newAnswers.set(currentQuestionData._id, selectedOption);
        return newAnswers;
      });

      if (isCorrect) {
        setScore(score + 1);
        saveUserTestScore();
      }
    } 
    // Handle Subjective
    else if (currentQuestionData.questionType === 'subjective') {
      setSubjectiveAnswers((prev) => ({
        ...prev,
        [currentQuestionData._id]: subjectiveAnswer,
      }));
    }
    // Handle Coding
    else if (currentQuestionData.questionType === 'coding') {
      setCodingAnswers((prev) => ({
        ...prev,
        [currentQuestionData._id]: {
          code: codingAnswer,
          language: codingLanguage,
        },
      }));
    }

    if (isLastQuestion) {
      // Save cheating log FIRST before anything else
      try {
        const updatedLog = {
          ...cheatingLog,
          username: userInfo.name,
          email: userInfo.email,
          examId: examId,
          noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
          multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
          cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
          prohibitedObjectCount: parseInt(cheatingLog.prohibitedObjectCount) || 0,
          tabSwitchCount: parseInt(cheatingLog.tabSwitchCount) || 0,
        };
        
        console.log('[MCQ] === SAVING CHEATING LOG ===');
        console.log('[MCQ] Data to save:', updatedLog);
        const result = await saveCheatingLogMutation(updatedLog).unwrap();
        console.log('[MCQ] ✓ Cheating log saved successfully. Response:', result);
        console.log('[MCQ] Saved log ID:', result._id);
      } catch (logError) {
        console.error('[MCQ] ✗ Failed to save cheating log');
        console.error('[MCQ] Error:', logError);
        console.error('[MCQ] Error data:', logError.data);
        console.error('[MCQ] Error status:', logError.status);
        toast.error('Failed to save exam logs');
      }

      try {
        const answersObject = Object.fromEntries(answers);
        if (selectedOption && (!currentQuestionData.questionType || currentQuestionData.questionType === 'mcq')) {
          answersObject[currentQuestionData._id] = selectedOption;
        }

        const finalSubjectiveAnswers = { ...subjectiveAnswers };
        if (subjectiveAnswer && currentQuestionData.questionType === 'subjective') {
          finalSubjectiveAnswers[currentQuestionData._id] = subjectiveAnswer;
        }

        const finalCodingAnswers = { ...codingAnswers };
        if (codingAnswer && currentQuestionData.questionType === 'coding') {
          finalCodingAnswers[currentQuestionData._id] = {
            code: codingAnswer,
            language: codingLanguage,
          };
        }

        await axiosInstance.post(
          '/api/users/results',
          {
            examId,
            answers: answersObject,
            subjectiveAnswers: finalSubjectiveAnswers,
            codingAnswers: finalCodingAnswers,
          },
          {
            withCredentials: true,
          },
        );

        // Always navigate to success page after submission
        toast.success('Test submitted successfully!');
        navigate('/Success');
      } catch (error) {
        console.error('Error saving results:', error);
        toast.error('Failed to save results');
      }
    }

    setSelectedOption(null);
    setSubjectiveAnswer('');
    setCodingAnswer('');
    setCodingLanguage('javascript');
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  return (
    <Card
      sx={{
        width: { xs: '100%', md: '90%', lg: '80%' },
        boxShadow: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent
        sx={{
          boxShadow: 0,
          p: { xs: 2, md: 3 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {questions && questions.length > 0 ? (
          <>
            <Typography variant="h4" mb={3} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              Question {currentQuestion + 1}:
              {questions[currentQuestion]?.questionType === 'subjective' && (
                <Chip label={`${questions[currentQuestion].ansmarks} marks`} color="primary" size="small" sx={{ ml: 2 }} />
              )}
              {questions[currentQuestion]?.questionType === 'coding' && (
                <Chip label={`${questions[currentQuestion].ansmarks || 10} marks`} color="secondary" size="small" sx={{ ml: 2 }} />
              )}
            </Typography>
            <Typography variant="body1" mb={3}>
              {questions[currentQuestion].question}
            </Typography>
            
            {/* Coding Question - Show Description */}
            {questions[currentQuestion]?.questionType === 'coding' && questions[currentQuestion].description && (
              <Box mb={2} p={2} sx={{ backgroundColor: '#F8F9FB', borderRadius: '8px' }}>
                <Typography variant="body2" color="text.secondary" mb={1} fontWeight={600}>
                  Problem Description:
                </Typography>
                <Typography variant="body2" whiteSpace="pre-wrap">
                  {questions[currentQuestion].description}
                </Typography>
              </Box>
            )}
            
            {/* Coding Question - Show Sample Input/Output */}
            {questions[currentQuestion]?.questionType === 'coding' && (
              <Box mb={2}>
                {questions[currentQuestion].sampleInput && (
                  <Box mb={1} p={2} sx={{ backgroundColor: '#F0F8FF', borderRadius: '8px' }}>
                    <Typography variant="body2" fontWeight={600} color="#003974" mb={1}>
                      Sample Input:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {questions[currentQuestion].sampleInput}
                    </Typography>
                  </Box>
                )}
                {questions[currentQuestion].sampleOutput && (
                  <Box mb={1} p={2} sx={{ backgroundColor: '#F0FFF0', borderRadius: '8px' }}>
                    <Typography variant="body2" fontWeight={600} color="#003974" mb={1}>
                      Sample Output:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {questions[currentQuestion].sampleOutput}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Content area - grows to fill space */}
            <Box flex={1} mb={2}>
              {questions[currentQuestion]?.questionType === 'subjective' ? (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Type your answer here..."
                  value={subjectiveAnswer}
                  onChange={(e) => setSubjectiveAnswer(e.target.value)}
                  variant="outlined"
                />
              ) : questions[currentQuestion]?.questionType === 'coding' ? (
                <>
                  <Box mb={2}>
                    <InputLabel id="coding-language-label" sx={{ mb: 1, color: '#003974', fontWeight: 600 }}>
                      Select Programming Language
                    </InputLabel>
                    <Select
                      labelId="coding-language-label"
                      value={codingLanguage}
                      onChange={(e) => setCodingLanguage(e.target.value)}
                      fullWidth
                      sx={{
                        backgroundColor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#003974',
                        },
                      }}
                    >
                      {(questions[currentQuestion].allowedLanguages || ['JavaScript', 'Python']).map((lang) => (
                        <MenuItem key={lang} value={lang.toLowerCase()}>
                          {lang}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={15}
                    placeholder="Write your code here..."
                    value={codingAnswer}
                    onChange={(e) => setCodingAnswer(e.target.value)}
                    variant="outlined"
                    sx={{
                      '& textarea': {
                        fontFamily: 'monospace',
                        fontSize: '14px',
                      },
                    }}
                  />
                </>
              ) : (
                <FormControl component="fieldset">
                  <RadioGroup
                    aria-label="quiz"
                    name="quiz"
                    value={selectedOption}
                    onChange={handleOptionChange}
                  >
                    {questions[currentQuestion]?.options?.map((option) => (
                      <FormControlLabel
                        key={option._id}
                        value={option._id}
                        control={<Radio />}
                        label={option.optionText}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </Box>
            
            {/* Button anchored to bottom right */}
            <Box display="flex" justifyContent="flex-end" mt="auto">
              <Button
                variant="contained"
                color="primary"
                onClick={handleNextQuestion}
                disabled={
                  questions[currentQuestion]?.questionType === 'subjective'
                    ? subjectiveAnswer.trim() === ''
                    : questions[currentQuestion]?.questionType === 'coding'
                    ? codingAnswer.trim() === ''
                    : selectedOption === null
                }
                sx={{
                  px: { xs: 3, md: 4 },
                  py: { xs: 1, md: 1.5 },
                  fontSize: { xs: '0.875rem', md: '1rem' },
                }}
              >
                {isLastQuestion ? 'Submit Test' : 'Next Question'}
              </Button>
            </Box>
          </>
        ) : (
          <Typography>No questions available</Typography>
        )}
      </CardContent>
    </Card>
  );
}
