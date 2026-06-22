import {
  Button,
  Card,
  CardContent,
  List,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import { uniqueId } from 'lodash';import * as React from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetQuestionsQuery, useGetUserResultsQuery } from 'src/slices/examApiSlice';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import axiosInstance from 'src/axios';

function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

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
  const { data: questions, isLoading, isError } = useGetQuestionsQuery(examId);
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
      <Card><CardContent>
        <Typography color="error">Failed to load exam questions. Please refresh and try again.</Typography>
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h2" mb={3}>
          Description
        </Typography>
        <Typography>
          This exam will test your knowledge through various question types. 
          {mcqCount > 0 && ` It includes ${mcqCount} multiple choice question${mcqCount > 1 ? 's' : ''}.`}
          {subjectiveCount > 0 && ` It includes ${subjectiveCount} subjective question${subjectiveCount > 1 ? 's' : ''}.`}
          {hasCodingQuestions && ` It also includes coding questions.`}
          {' '}We recommend you to read all instructions carefully before starting the test.
        </Typography>


        <>
          <Typography variant="h3" mb={3} mt={3}>
            Test Instructions
          </Typography>
          <List>
            <ol>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    This exam consists of {mcqCount > 0 && `${mcqCount} MCQ question${mcqCount > 1 ? 's' : ''}`}
                    {mcqCount > 0 && subjectiveCount > 0 && ', '}
                    {subjectiveCount > 0 && `${subjectiveCount} subjective question${subjectiveCount > 1 ? 's' : ''}`}
                    {hasCodingQuestions && ', and coding questions'}.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    There are a total of <strong>{questions?.length || 0} questions.</strong>
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Answer all questions to the best of your ability.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Your webcam will monitor you during the exam for proctoring purposes.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    You may need to use blank sheets for rough work. Please arrange for blank sheets
                    before starting.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Click Next to move to the next question. Your answers are saved automatically.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Click Submit Test when you complete all questions.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    You will be able to view the scores once your test is complete.
                  </Typography>
                </ListItemText>
              </li>
            </ol>
          </List>
        </>
        <Typography variant="h3" mb={3} mt={3}>
          Confirmation
        </Typography>
        <Typography mb={3}>
          Your actions shall be proctored and any signs of wrongdoing may lead to suspension or
          cancellation of your test.
        </Typography>
        <Stack direction="column" alignItems="center" spacing={3}>
          <Button variant="contained" color="primary" onClick={handleTest}>
            Proceed to System Check
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const imgUrl = '/image.png';

export default function ExamDetails() {
  return (
    <>
      <Grid container sx={{ height: '100vh' }}>
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage: `url(${imgUrl})`, // 'url(https://source.unsplash.com/random?wallpapers)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <DescriptionAndInstructions />
        </Grid>
      </Grid>
    </>
  );
}
