import {
  Button,
  List,
  Stack,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import * as React from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetQuestionsQuery, useGetUserResultsQuery } from 'src/slices/examApiSlice';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import axiosInstance from 'src/axios';

const DescriptionAndInstructions = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { resetCheatingLog } = useCheatingLog();
  const { data: userResults } = useGetUserResultsQuery();

  // Check if student already completed this exam
  const alreadyCompleted = userResults?.data?.some((r) => r.examId === examId);

  // Redirect if already completed
  React.useEffect(() => {
    if (alreadyCompleted) {
      toast.error('You have already completed this exam.');
      navigate('/dashboard');
    }
  }, [alreadyCompleted, navigate]);

  // Reset cheating log when starting a new exam
  React.useEffect(() => {
    resetCheatingLog(examId);
  }, [examId]);
  const { data: questions, isError } = useGetQuestionsQuery(examId);
  const [hasCodingQuestions, setHasCodingQuestions] = useState(false);

  // Check if exam has coding questions
  React.useEffect(() => {
    const checkCodingQuestions = async () => {
      try {
        const response = await axiosInstance.get(`/api/coding/questions/${examId}`);
        const data = response.data;
        setHasCodingQuestions(data && data.length > 0);
      } catch (error) {
        setHasCodingQuestions(false);
      }
    };
    checkCodingQuestions();
  }, [examId]);

  const handleTest = () => {
    navigate(`/exam/${examId}/system-check`);
  };

  const mcqCount = questions?.filter(q => !q.questionType || q.questionType === 'mcq').length || 0;
  const subjectiveCount = questions?.filter(q => q.questionType === 'subjective').length || 0;

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load exam questions. Please refresh and try again.</Typography>
      </Box>
    );
  }

  const instructions = [
    `${mcqCount > 0 ? `${mcqCount} MCQ` : ''}${mcqCount > 0 && subjectiveCount > 0 ? ' + ' : ''}${subjectiveCount > 0 ? `${subjectiveCount} Subjective` : ''}${hasCodingQuestions ? ' + Coding questions' : ''} — answer all to the best of your ability.`,
    'Your webcam will monitor you throughout the exam.',
    'Do not switch tabs or minimize the window — violations are recorded.',
    'Each violation counts toward termination (max 10).',
    'Screenshots may be taken automatically on violation.',
    'Use Next to advance. Submit Test when done.',
    'Results will be available after submission.',
  ];

  return (
    <Box sx={{ p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Title */}
      <Typography variant="h4" fontWeight={700} color="#003974" mb={0.5}>Exam Instructions</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Read carefully before starting. You cannot pause once the exam begins.
      </Typography>

      {/* Stats chips */}
      <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
        {mcqCount > 0    && <Chip label={`${mcqCount} MCQ`} size="small" sx={{ backgroundColor: '#EEF3FB', color: '#003974', fontWeight: 700 }} />}
        {subjectiveCount > 0 && <Chip label={`${subjectiveCount} Subjective`} size="small" sx={{ backgroundColor: '#fef9c3', color: '#854d0e', fontWeight: 700 }} />}
        {hasCodingQuestions  && <Chip label="Coding" size="small" sx={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 700 }} />}
        <Chip label={`${questions?.length || 0} Total Questions`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
      </Stack>

      {/* Instructions list */}
      <Box
        sx={{
          backgroundColor: '#f8faff',
          border: '1px solid #e8eaf0',
          borderRadius: '12px',
          p: 2.5,
          mb: 3,
        }}
      >
        <List disablePadding>
          <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {instructions.map((text, i) => (
              <li key={i} style={{ marginBottom: '10px' }}>
                <Typography variant="body2" color="#374151" lineHeight={1.6}>{text}</Typography>
              </li>
            ))}
          </ol>
        </List>
      </Box>

      {/* Proctoring notice */}
      <Box sx={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', px: 2, py: 1.5, mb: 3 }}>
        <Typography variant="body2" color="#c2410c" fontWeight={600}>
          ⚠ Proctoring Active
        </Typography>
        <Typography variant="body2" color="#9a3412" mt={0.25}>
          Your actions will be monitored. Misconduct may result in test cancellation.
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        onClick={handleTest}
        sx={{
          backgroundColor: '#003974',
          borderRadius: '12px',
          fontWeight: 700,
          py: 1.5,
          fontSize: '1rem',
          '&:hover': { backgroundColor: '#002a54' },
        }}
      >
        Proceed to System Check →
      </Button>
    </Box>
  );
};

const imgUrl = '/image.png';

export default function ExamDetails() {
  return (
    <Grid container sx={{ height: '100vh' }}>
      <Grid
        item xs={false} sm={4} md={7}
        sx={{
          backgroundImage: `url(${imgUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) => t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Grid
        item xs={12} sm={8} md={5}
        component={Paper} elevation={0} square
        sx={{ overflowY: 'auto', borderLeft: '1px solid #e8eaf0' }}
      >
        <DescriptionAndInstructions />
      </Grid>
    </Grid>
  );
}
