import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Grid, CircularProgress, Typography, IconButton,
  Drawer, AppBar, Toolbar, useMediaQuery, useTheme, Button,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import MultipleChoiceQuestion from './Components/MultipleChoiceQuestion';
import NumberOfQuestions from './Components/NumberOfQuestions';
import WebCam from './Components/WebCam';
import { useGetExamsQuery, useGetQuestionsQuery } from '../../slices/examApiSlice';
import { useGetCodingQuestionsQuery } from 'src/slices/codingQuestionApiSlice';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import swal from 'sweetalert';
import axiosInstance from '../../axios';

// Standalone timer hook so it runs independently of drawer state
function useExamTimer(durationInMinutes) {
  const [timeLeft, setTimeLeft] = useState(durationInMinutes * 60);

  useEffect(() => {
    setTimeLeft(durationInMinutes * 60);
  }, [durationInMinutes]);

  useEffect(() => {
    if (!durationInMinutes) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [durationInMinutes]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return { timeLeft, formatted: formatTime(timeLeft) };
}

const TestPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const { data: userExamdata, isLoading: isExamsLoading } = useGetExamsQuery();
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState(0);
  const [questions, setQuestions] = useState([]);
  const { data, isLoading } = useGetQuestionsQuery(examId);
  const { data: codingQuestionsData, isLoading: isCodingLoading } = useGetCodingQuestionsQuery(examId);
  const [score, setScore] = useState(0);
  const answersRef = useRef({});
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [cameraPermissionChecking, setCameraPermissionChecking] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [questionPanelOpen, setQuestionPanelOpen] = useState(false);

  // All refs declared up front so event handlers always have stable references
  const terminatedRef        = useRef(false);
  const lastTabSwitchTimeRef = useRef(0);
  const cheatingLogRef       = useRef(cheatingLog);
  const [shouldTerminate, setShouldTerminate] = useState(false);

  useEffect(() => { cheatingLogRef.current = cheatingLog; }, [cheatingLog]);

  const { timeLeft, formatted: timeFormatted } = useExamTimer(examDurationInSeconds);

  // ── Back button / navigation guard ─────────────────────────────────────────
  useEffect(() => {
    // Push a dummy history entry so the first back-press lands here
    window.history.pushState({ examActive: true }, '');

    const handlePopState = () => {
      if (terminatedRef.current) return; // exam over — allow normal navigation

      // Immediately re-push to block further back presses
      window.history.pushState({ examActive: true }, '');

      const now = Date.now();
      if (now - lastTabSwitchTimeRef.current < 2000) return;
      lastTabSwitchTimeRef.current = now;

      const newCount = (cheatingLogRef.current.totalViolations || 0) + 1;
      updateCheatingLog((prev) => ({ ...prev, totalViolations: newCount }));

      swal(
        'Navigation Blocked!',
        `Pressing back during the exam is not allowed.\nViolation ${newCount}/5 recorded.`,
        'warning',
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && examDurationInSeconds > 0) {
      toast.warning('Time is up! Submitting your test...');
      handleTestSubmission();
    }
  }, [timeLeft]);

  // Camera permission check
  useEffect(() => {
    const check = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setCameraPermissionGranted(true);
      } catch {
        setCameraPermissionGranted(false);
        swal({
          title: 'Camera Permission Required',
          text: 'You must allow camera access to take this exam.',
          icon: 'error',
          button: 'Go Back',
          closeOnClickOutside: false,
          closeOnEsc: false,
        }).then(() => navigate('/dashboard'));
      } finally {
        setCameraPermissionChecking(false);
      }
    };
    check();
  }, [navigate]);

  // Init cheating log
  useEffect(() => {
    if (examId && userInfo) {
      updateCheatingLog({
        examId,
        username: userInfo.name,
        email: userInfo.email,
        totalViolations: cheatingLog.totalViolations || 0,
        screenshots: cheatingLog.screenshots || [],
      });
    }
  }, [examId, userInfo]);

  // Fullscreen
  useEffect(() => {
    const enter = async () => {
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      } catch {
        toast.warning('Please enable fullscreen for better exam experience');
      }
    };
    enter();
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  // Browser lockdown
  useEffect(() => {
    const block = (e) => e.preventDefault();
    const blockWithMsg = (msg) => (e) => { e.preventDefault(); toast.warning(msg); };
    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key))) {
        e.preventDefault(); toast.warning('Developer tools are disabled during the exam'); return false;
      }
      if (e.ctrlKey && ['u','c','v','x','a','p','s'].includes(e.key)) {
        e.preventDefault();
        if (e.key !== 's') toast.warning('This action is disabled during the exam');
        return false;
      }
    };
    const handleSelectStart = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
    };
    document.addEventListener('contextmenu', blockWithMsg('Right-click is disabled during the exam'));
    document.addEventListener('copy', blockWithMsg('Copy is disabled during the exam'));
    document.addEventListener('paste', block);
    document.addEventListener('cut', block);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    return () => {
      document.removeEventListener('contextmenu', blockWithMsg);
      document.removeEventListener('copy', blockWithMsg);
      document.removeEventListener('paste', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  // Exam duration
  useEffect(() => {
    if (userExamdata) {
      const exam = userExamdata.find((e) => e.examId === examId);
      if (exam) setExamDurationInSeconds(exam.duration);
    }
  }, [userExamdata, examId]);

  // Tab/focus/fullscreen violations
  useEffect(() => {
    const guard = () => terminatedRef.current || (cheatingLog.totalViolations || 0) >= 5;
    const bump = (title, msg) => {
      if (guard()) return;
      const now = Date.now();
      if (now - lastTabSwitchTime < 2000) return;
      setLastTabSwitchTime(now);
      const n = (cheatingLog.totalViolations || 0) + 1;
      updateCheatingLog({ ...cheatingLog, totalViolations: n });
      swal(title, `${msg} (Count: ${n})`, 'warning');
    };
    const onVisibility = () => { if (document.hidden) bump('Tab Switch Detected!', 'Warning Recorded'); };
    const onBlur = () => bump('Window Focus Lost!', 'Warning Recorded');
    const onFS = () => { if (!document.fullscreenElement) bump('Fullscreen Exited!', 'Warning Recorded'); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFS);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFS);
    };
  }, [cheatingLog, updateCheatingLog, lastTabSwitchTime]);

  useEffect(() => {
    if ((cheatingLog.totalViolations || 0) >= 5 && !terminatedRef.current && !shouldTerminate) {
      setShouldTerminate(true);
    }
  }, [cheatingLog.totalViolations]);

  useEffect(() => {
    if (!shouldTerminate || terminatedRef.current) return;
    terminatedRef.current = true;
    swal({ title: 'Exam Terminated!', text: 'You have reached 5 violations. Your exam has been submitted.', icon: 'error', button: 'OK', closeOnClickOutside: false, closeOnEsc: false })
      .then(() => navigate('/dashboard'));
    (async () => {
      const answers = Object.keys(answersRef.current).length > 0 ? answersRef.current : { terminated: 'terminated' };
      try { await axiosInstance.post('/api/users/results', { examId, answers, subjectiveAnswers: {} }, { withCredentials: true }); }
      catch (err) { if (err?.response?.status !== 400) console.error(err); }
      try {
        await saveCheatingLogMutation({ ...cheatingLog, username: userInfo?.name, email: userInfo?.email, examId, totalViolations: cheatingLog.totalViolations || 5 }).unwrap();
      } catch (err) { console.error(err); }
    })();
  }, [shouldTerminate]);

  // Load questions
  useEffect(() => {
    if (data) {
      const all = [...data];
      if (codingQuestionsData?.length > 0) {
        codingQuestionsData.forEach((cq) => all.push({ ...cq, questionType: 'coding', _id: cq._id }));
      }
      setQuestions(all);
    }
  }, [data, codingQuestionsData]);

  // Submit with confirmation
  const handleTestSubmission = async (skipConfirm = false) => {
    if (isSubmitting) return;

    if (!skipConfirm) {
      const confirmed = await swal({
        title: 'Submit Test?',
        text: 'Are you sure you want to submit? You cannot change answers after submission.',
        icon: 'warning',
        buttons: { cancel: 'Cancel', confirm: { text: 'Yes, Submit', value: true } },
        dangerMode: true,
      });
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      const answersObject = answersRef.current || {};
      const updatedLog = {
        ...cheatingLog,
        username: userInfo.name,
        email: userInfo.email,
        examId,
        totalViolations: parseInt(cheatingLog.totalViolations) || 0,
        screenshots: cheatingLog.screenshots || [],
      };
      try { await saveCheatingLogMutation(updatedLog).unwrap(); }
      catch (logError) { console.error('[TestPage] cheating log error:', logError); }

      try {
        await axiosInstance.post('/api/users/results', { examId, answers: answersObject, subjectiveAnswers: {} }, { withCredentials: true });
      } catch (resultError) {
        if (resultError?.response?.status !== 400) throw resultError;
      }
      toast.success('Test submitted successfully!');
      navigate('/Success');
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'Failed to submit test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveUserTestScore = () => setScore((s) => s + 1);

  if (isExamsLoading || isLoading || isCodingLoading || cameraPermissionChecking) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!cameraPermissionGranted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h5" color="error">Camera permission is required to take this exam.</Typography>
      </Box>
    );
  }

  const QuestionPanel = (
    <NumberOfQuestions
      questionLength={questions.length}
      examDurationInSeconds={examDurationInSeconds}
      currentQuestion={currentQuestion}
      answeredQuestions={answeredQuestions}
    />
  );

  return (
    <PageContainer title="TestPage" description="This is TestPage">
      {/* ── Mobile fixed AppBar ── */}
      {isMobile && (
        <AppBar position="fixed" elevation={2} sx={{ top: 0, left: 0, right: 0, zIndex: 1200, backgroundColor: '#003974' }}>
          <Toolbar variant="dense" sx={{ minHeight: 52, px: 1.5, gap: 1 }}>

            {/* Grid icon — opens question panel ONLY */}
            <IconButton size="small" sx={{ color: '#fff', p: 0.5 }} onClick={() => setQuestionPanelOpen((v) => !v)}>
              <GridViewIcon fontSize="small" />
            </IconButton>

            {/* Q counter */}
            <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
              Q {currentQuestion + 1}/{questions.length}
            </Typography>

            <Box flex={1} />

            {/* Timer — always visible */}
            <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', whiteSpace: 'nowrap', fontSize: '0.8rem', mr: 1 }}>
              ⏱ {timeFormatted}
            </Typography>

            {/* Submit Test button — always visible */}
            <Button
              variant="contained"
              size="small"
              onClick={() => handleTestSubmission(false)}
              disabled={isSubmitting}
              sx={{
                backgroundColor: '#e53935',
                color: '#fff',
                fontSize: '0.7rem',
                py: 0.5,
                px: 1.2,
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                '&:hover': { backgroundColor: '#b71c1c' },
              }}
            >
              {isSubmitting ? '...' : 'Submit'}
            </Button>
          </Toolbar>
        </AppBar>
      )}

      {/* ── Bottom drawer for question panel (mobile only) ── */}
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={questionPanelOpen}
          onClose={() => setQuestionPanelOpen(false)}
          PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60vh', overflowY: 'auto' } }}
        >
          <Box sx={{ pt: 1, pb: 2 }}>
            <Box sx={{ width: 40, height: 4, bgcolor: '#ccc', borderRadius: 2, mx: 'auto', mb: 1 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ px: 2, mb: 1, color: '#003974' }}>
              Questions Navigator
            </Typography>
            {QuestionPanel}
          </Box>
        </Drawer>
      )}

      {/* ── Main layout ── */}
      <Box pt={{ xs: '56px', md: '3rem' }}>
        <Grid container spacing={{ xs: 0, md: 3 }}>
          {/* Question area */}
          <Grid item xs={12} md={7} lg={7}>
            <BlankCard>
              <Box
                width="100%"
                minHeight={{ xs: 'calc(100vh - 56px)', md: '500px' }}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="flex-start"
                p={{ xs: 2, md: 3 }}
                sx={{ backgroundColor: 'white' }}
              >
                <MultipleChoiceQuestion
                  submitTest={handleTestSubmission}
                  questions={questions}
                  saveUserTestScore={saveUserTestScore}
                  answersRef={answersRef}
                  onQuestionChange={setCurrentQuestion}
                  onAnsweredChange={setAnsweredQuestions}
                />
              </Box>
            </BlankCard>

            {/* Mobile webcam — square, below question card */}
            {isMobile && (
              <Box
                sx={{
                  mx: 2,
                  mt: 2,
                  mb: 2,
                  width: 'calc(100% - 32px)',
                  aspectRatio: '1 / 1',
                  maxWidth: 240,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  border: '2px solid #e0e0e0',
                  boxShadow: 2,
                }}
              >
                <WebCam cheatingLog={cheatingLog} updateCheatingLog={updateCheatingLog} />
              </Box>
            )}
          </Grid>

          {/* Desktop sidebar */}
          {!isMobile && (
            <Grid item md={5} lg={5}>
              <Grid container spacing={3}>
                {/* Desktop header bar */}
                <Grid item xs={12}>
                  <BlankCard>
                    <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#003974', borderRadius: '8px' }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#fff' }}>
                        Q {currentQuestion + 1}/{questions.length}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#fff' }}>
                        ⏱ {timeFormatted}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleTestSubmission(false)}
                        disabled={isSubmitting}
                        sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#b71c1c' }, fontSize: '0.75rem' }}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Test'}
                      </Button>
                    </Box>
                  </BlankCard>
                </Grid>

                {/* Question navigator */}
                <Grid item xs={12}>
                  <BlankCard>
                    <Box sx={{ backgroundColor: 'white' }}>{QuestionPanel}</Box>
                  </BlankCard>
                </Grid>

                {/* Webcam */}
                <Grid item xs={12}>
                  <BlankCard>
                    <Box sx={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#000', borderRadius: '8px' }}>
                      <WebCam cheatingLog={cheatingLog} updateCheatingLog={updateCheatingLog} />
                    </Box>
                  </BlankCard>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default TestPage;
