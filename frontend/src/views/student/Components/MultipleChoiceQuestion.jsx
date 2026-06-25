import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { Select, MenuItem, InputLabel } from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import axiosInstance from '../../../axios';
import { toast } from 'react-toastify';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';

// Option letter labels
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Single option tile — card style like the reference image
function OptionTile({ label, text, selected, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        mb: 1.5,
        borderRadius: '12px',
        border: '1.5px solid',
        borderColor: selected ? '#003974' : '#e8eaf0',
        backgroundColor: selected ? '#EEF3FB' : '#fafafa',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        '&:hover': {
          borderColor: '#003974',
          backgroundColor: selected ? '#EEF3FB' : '#f0f4ff',
        },
        '&:active': { transform: 'scale(0.99)' },
      }}
    >
      {/* Letter badge */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? '#003974' : '#e8eaf0',
          color: selected ? '#fff' : '#555',
          fontWeight: 700,
          fontSize: '0.8rem',
          transition: 'all 0.15s ease',
        }}
      >
        {label}
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: selected ? 600 : 400,
          color: selected ? '#003974' : '#333',
          fontSize: { xs: '0.9rem', md: '0.95rem' },
          lineHeight: 1.4,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

export default function MultipleChoiceQuestion({
  questions,
  saveUserTestScore,
  submitTest,
  answersRef,
  onQuestionChange,
  onAnsweredChange,
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('');
  const [codingAnswer, setCodingAnswer] = useState('');
  const [codingLanguage, setCodingLanguage] = useState('javascript');
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState(new Map());
  const [subjectiveAnswers, setSubjectiveAnswers] = useState({});
  const [codingAnswers, setCodingAnswers] = useState({});
  const [answeredIndices, setAnsweredIndices] = useState([]);

  const { examId } = useParams();
  const { cheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const { userInfo } = useSelector((state) => state.auth);
  const [isLastQuestion, setIsLastQuestion] = useState(false);

  useEffect(() => {
    setIsLastQuestion(currentQuestion === questions.length - 1);
    if (onQuestionChange) onQuestionChange(currentQuestion);
  }, [currentQuestion, questions, onQuestionChange]);

  useEffect(() => {
    if (onAnsweredChange) onAnsweredChange(answeredIndices);
  }, [answeredIndices, onAnsweredChange]);

  // Keep answersRef in sync for intermediate questions
  useEffect(() => {
    if (answersRef) answersRef.current = Object.fromEntries(answers);
  }, [answers, answersRef]);

  const handleNextQuestion = () => {
    const q = questions[currentQuestion];

    // Build updated answers eagerly so the last answer is captured before async state update
    let updatedAnswers = new Map(answers);

    if (!q.questionType || q.questionType === 'mcq') {
      if (selectedOption) {
        const correct = q.options?.find((o) => o.isCorrect);
        if (correct && correct._id === selectedOption) {
          setScore((s) => s + 1);
          saveUserTestScore();
        }
        updatedAnswers.set(q._id, selectedOption);
        setAnswers(updatedAnswers);
      }
    } else if (q.questionType === 'subjective' && subjectiveAnswer.trim()) {
      setSubjectiveAnswers((prev) => ({ ...prev, [q._id]: subjectiveAnswer }));
    } else if (q.questionType === 'coding' && codingAnswer.trim()) {
      setCodingAnswers((prev) => ({ ...prev, [q._id]: { code: codingAnswer, language: codingLanguage } }));
    }

    // Flush the latest answers into the ref immediately (don't wait for re-render)
    if (answersRef) {
      answersRef.current = Object.fromEntries(updatedAnswers);
    }

    const newAnsweredIndices = answeredIndices.includes(currentQuestion)
      ? answeredIndices
      : [...answeredIndices, currentQuestion];
    setAnsweredIndices(newAnsweredIndices);
    if (onAnsweredChange) onAnsweredChange(newAnsweredIndices);

    // Last question — save answer then submit
    if (isLastQuestion) {
      submitTest(true); // true = skipConfirm, user already chose to save
      return;
    }

    setSelectedOption(null);
    setSubjectiveAnswer('');
    setCodingAnswer('');
    setCodingLanguage('javascript');
    setCurrentQuestion(currentQuestion + 1);
  };

  if (!questions || questions.length === 0) {
    return <Typography color="text.secondary">No questions available</Typography>;
  }

  const q = questions[currentQuestion];
  const qType = q.questionType || 'mcq';

  const canProceed =
    qType === 'subjective' ? subjectiveAnswer.trim() !== ''
    : qType === 'coding'   ? codingAnswer.trim() !== ''
    : selectedOption !== null;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* ── Question header ─────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 3 },
          pb: 1.5,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {/* Type + marks chips */}
        <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap">
          <Chip
            label={qType === 'mcq' ? 'Single select' : qType === 'subjective' ? 'Descriptive' : 'Coding'}
            size="small"
            sx={{ backgroundColor: '#EEF3FB', color: '#003974', fontWeight: 600, fontSize: '0.7rem', borderRadius: '6px' }}
          />
          <Chip
            label={`${q.ansmarks || 1} mark${(q.ansmarks || 1) !== 1 ? 's' : ''}`}
            size="small"
            sx={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.7rem', borderRadius: '6px' }}
          />
        </Stack>

        {/* Question text */}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            fontSize: { xs: '0.95rem', md: '1rem' },
            color: '#1a1a2e',
            lineHeight: 1.6,
          }}
        >
          {q.question}
        </Typography>

        {/* Question image — only renders if present, zero perf cost otherwise */}
        {q.imageUrl && (
          <Box sx={{ mt: 1.5 }}>
            <img
              src={q.imageUrl}
              alt="Question illustration"
              style={{
                maxWidth: '100%',
                maxHeight: 280,
                borderRadius: 10,
                border: '1px solid #e8eaf0',
                display: 'block',
              }}
              loading="lazy"
            />
          </Box>
        )}
      </Box>

      {/* ── Answer area ─────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 2, md: 3 },
          pt: 2,
          pb: 1,
        }}
      >
        {/* MCQ options */}
        {qType === 'mcq' && (
          <Box>
            {q.options?.map((option, i) => (
              <OptionTile
                key={option._id}
                label={OPTION_LABELS[i]}
                text={option.optionText}
                selected={selectedOption === option._id}
                onClick={() => setSelectedOption(option._id)}
              />
            ))}
          </Box>
        )}

        {/* Subjective */}
        {qType === 'subjective' && (
          <TextField
            fullWidth
            multiline
            rows={6}
            placeholder="Type your answer here..."
            value={subjectiveAnswer}
            onChange={(e) => setSubjectiveAnswer(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#fafafa',
              },
            }}
          />
        )}

        {/* Coding */}
        {qType === 'coding' && (
          <>
            {/* Description */}
            {q.description && (
              <Box mb={2} p={2} sx={{ backgroundColor: '#F8F9FB', borderRadius: '10px', border: '1px solid #e8eaf0' }}>
                <Typography variant="body2" fontWeight={600} color="#003974" mb={0.5}>Problem Description</Typography>
                <Typography variant="body2" whiteSpace="pre-wrap" color="#444">{q.description}</Typography>
              </Box>
            )}
            {/* Sample I/O */}
            {(q.sampleInput || q.sampleOutput) && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
                {q.sampleInput && (
                  <Box flex={1} p={1.5} sx={{ backgroundColor: '#F0F8FF', borderRadius: '10px' }}>
                    <Typography variant="caption" fontWeight={700} color="#003974">Sample Input</Typography>
                    <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', mt: 0.5, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{q.sampleInput}</Typography>
                  </Box>
                )}
                {q.sampleOutput && (
                  <Box flex={1} p={1.5} sx={{ backgroundColor: '#F0FFF0', borderRadius: '10px' }}>
                    <Typography variant="caption" fontWeight={700} color="#166534">Sample Output</Typography>
                    <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', mt: 0.5, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{q.sampleOutput}</Typography>
                  </Box>
                )}
              </Stack>
            )}
            {/* Language select */}
            <Box mb={1.5}>
              <InputLabel sx={{ mb: 0.5, color: '#003974', fontWeight: 600, fontSize: '0.8rem' }}>Language</InputLabel>
              <Select
                value={codingLanguage}
                onChange={(e) => setCodingLanguage(e.target.value)}
                size="small"
                sx={{ borderRadius: '10px', backgroundColor: '#fafafa', minWidth: 160 }}
              >
                {(q.allowedLanguages || ['JavaScript', 'Python']).map((lang) => (
                  <MenuItem key={lang} value={lang.toLowerCase()}>{lang}</MenuItem>
                ))}
              </Select>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={12}
              placeholder="Write your code here..."
              value={codingAnswer}
              onChange={(e) => setCodingAnswer(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fafafa' },
                '& textarea': { fontFamily: 'monospace', fontSize: '13px' },
              }}
            />
          </>
        )}
      </Box>

      {/* ── Footer: navigation ─────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 1.5, md: 2 },
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fff',
        }}
      >
        {/* Q counter */}
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {currentQuestion + 1} / {questions.length}
        </Typography>

        <Button
          variant="contained"
          onClick={handleNextQuestion}
          disabled={!canProceed}
          sx={{
            borderRadius: '10px',
            px: { xs: 3, md: 4 },
            py: 1,
            fontWeight: 700,
            fontSize: '0.875rem',
            backgroundColor: '#003974',
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#002a54', boxShadow: 'none' },
            '&:disabled': { backgroundColor: '#e0e0e0', color: '#aaa' },
          }}
        >
          {isLastQuestion ? 'Submit Test' : 'Next →'}
        </Button>
      </Box>
    </Box>
  );
}
