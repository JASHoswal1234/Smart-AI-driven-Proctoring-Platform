import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, CircularProgress, Typography } from '@mui/material';
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

const TestPage = () => {
  const { examId, testId } = useParams();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState(null);
  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const { data: userExamdata, isLoading: isExamsLoading } = useGetExamsQuery();
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog, resetCheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState(0);
  const [questions, setQuestions] = useState([]);
  const { data, isLoading } = useGetQuestionsQuery(examId);
  const { data: codingQuestionsData, isLoading: isCodingLoading } = useGetCodingQuestionsQuery(examId);
  const [score, setScore] = useState(0);
  const answersRef = useRef({}); // shared answers ref updated by MCQ component
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [cameraPermissionChecking, setCameraPermissionChecking] = useState(true);

  // Check camera permission on mount
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Camera permission granted
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        setCameraPermissionGranted(true);
        setCameraPermissionChecking(false);
      } catch (error) {
        console.error('Camera permission denied:', error);
        setCameraPermissionGranted(false);
        setCameraPermissionChecking(false);
        
        // Show error and redirect
        swal({
          title: 'Camera Permission Required',
          text: 'You must allow camera access to take this exam. The exam cannot proceed without camera permission.',
          icon: 'error',
          button: 'Go Back',
          closeOnClickOutside: false,
          closeOnEsc: false,
        }).then(() => {
          navigate('/dashboard');
        });
      }
    };

    checkCameraPermission();
  }, [navigate]);

  // Initialize cheating log with exam and user info
  useEffect(() => {
    if (examId && userInfo) {
      console.log('[TestPage] 🎯 Initializing cheating log with:', {
        examId,
        username: userInfo.name,
        email: userInfo.email,
      });
      updateCheatingLog({
        examId,
        username: userInfo.name,
        email: userInfo.email,
        totalViolations: cheatingLog.totalViolations || 0,
        screenshots: cheatingLog.screenshots || [],
      });
    }
  }, [examId, userInfo]);

  // Enter fullscreen when test starts
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
        console.log('Entered fullscreen mode');
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
        toast.warning('Please enable fullscreen for better exam experience');
      }
    };

    enterFullscreen();

    // Exit fullscreen on unmount
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error('Exit fullscreen error:', err));
      }
    };
  }, []);

  // Browser lockdown: Disable right-click, copy, paste, cut, and keyboard shortcuts
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.warning('Right-click is disabled during the exam');
      return false;
    };

    // Disable copy
    const handleCopy = (e) => {
      e.preventDefault();
      toast.warning('Copy is disabled during the exam');
      return false;
    };

    // Disable paste
    const handlePaste = (e) => {
      e.preventDefault();
      toast.warning('Paste is disabled during the exam');
      return false;
    };

    // Disable cut
    const handleCut = (e) => {
      e.preventDefault();
      toast.warning('Cut is disabled during the exam');
      return false;
    };

    // Disable keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+P, F12, etc.)
    const handleKeyDown = (e) => {
      // Disable F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        toast.warning('Developer tools are disabled during the exam');
        return false;
      }

      // Disable Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        toast.warning('Developer tools are disabled during the exam');
        return false;
      }

      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        toast.warning('Developer tools are disabled during the exam');
        return false;
      }

      // Disable Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        toast.warning('Developer tools are disabled during the exam');
        return false;
      }

      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        toast.warning('View source is disabled during the exam');
        return false;
      }

      // Disable Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        toast.warning('Copy is disabled during the exam');
        return false;
      }

      // Disable Ctrl+V (Paste)
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        toast.warning('Paste is disabled during the exam');
        return false;
      }

      // Disable Ctrl+X (Cut)
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        toast.warning('Cut is disabled during the exam');
        return false;
      }

      // Disable Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        toast.warning('Select all is disabled during the exam');
        return false;
      }

      // Disable Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        toast.warning('Print is disabled during the exam');
        return false;
      }

      // Disable Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection
    const handleSelectStart = (e) => {
      // Allow selection in input fields and textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);

    // Add CSS to disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      
      // Restore text selection
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.msUserSelect = '';
    };
  }, []);

  useEffect(() => {
    if (userExamdata) {
      const exam = userExamdata.find((exam) => exam.examId === examId);
      if (exam) {
        setSelectedExam(exam);
        // Convert duration from minutes to seconds
        setExamDurationInSeconds(exam.duration);
        console.log('Exam duration (minutes):', exam.duration);
      }
    }
  }, [userExamdata, examId]);

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Stop tracking if terminated
      if (terminatedRef.current || (cheatingLog.totalViolations || 0) >= 5) {
        console.log('[TestPage] ⛔ Ignoring visibility change - exam terminated');
        return;
      }

      if (document.hidden) {
        const now = Date.now();
        // Debounce to prevent multiple triggers
        if (now - lastTabSwitchTime >= 2000) {
          setLastTabSwitchTime(now);
          
          // Tab switched away
          const newCount = (cheatingLog.totalViolations || 0) + 1;
          updateCheatingLog({
            ...cheatingLog,
            totalViolations: newCount,
          });
          
          // Show popup alert
          swal('Tab Switch Detected!', `Warning Recorded (Count: ${newCount})`, 'warning');
          console.log('Tab switch detected. Count:', newCount);
        }
      }
    };

    const handleBlur = () => {
      // Stop tracking if terminated
      if (terminatedRef.current || (cheatingLog.totalViolations || 0) >= 5) {
        console.log('[TestPage] ⛔ Ignoring blur - exam terminated');
        return;
      }

      // Detect when window loses focus (Windows key, Alt+Tab, etc.)
      const now = Date.now();
      if (now - lastTabSwitchTime >= 2000) {
        setLastTabSwitchTime(now);
        
        const newCount = (cheatingLog.totalViolations || 0) + 1;
        updateCheatingLog({
            ...cheatingLog,
          totalViolations: newCount,
        });
        
        swal('Window Focus Lost!', `Warning Recorded (Count: ${newCount})`, 'warning');
        console.log('Window focus lost. Count:', newCount);
      }
    };

    const handleFullscreenChange = () => {
      // Stop tracking if terminated
      if (terminatedRef.current || (cheatingLog.totalViolations || 0) >= 5) {
        console.log('[TestPage] ⛔ Ignoring fullscreen change - exam terminated');
        return;
      }

      if (!document.fullscreenElement) {
        // User exited fullscreen
        const now = Date.now();
        if (now - lastTabSwitchTime >= 2000) {
          setLastTabSwitchTime(now);
          
          const newCount = (cheatingLog.totalViolations || 0) + 1;
          updateCheatingLog({
            ...cheatingLog,
            totalViolations: newCount,
          });
          
          swal('Fullscreen Exited!', `Warning Recorded (Count: ${newCount})`, 'warning');
          console.log('Fullscreen exited. Count:', newCount);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [cheatingLog, updateCheatingLog, lastTabSwitchTime, userInfo, examId, navigate, saveCheatingLogMutation]);

  useEffect(() => {
    if (data) {
      console.log('MCQ Questions loaded:', data.length, 'questions');
      console.log('Question types:', data.map(q => ({ type: q.questionType, question: q.question.substring(0, 30) })));
      
      // Combine MCQ and coding questions
      const allQuestions = [...data];
      
      if (codingQuestionsData && codingQuestionsData.length > 0) {
        console.log('Coding Questions loaded:', codingQuestionsData.length, 'questions');
        // Add coding questions with a special marker
        codingQuestionsData.forEach(cq => {
          allQuestions.push({
            ...cq,
            questionType: 'coding',
            _id: cq._id,
          });
        });
      }
      
      console.log('Total questions (MCQ + Coding):', allQuestions.length);
      setQuestions(allQuestions);
    }
  }, [data, codingQuestionsData]);

  // Remove the old handleMcqCompletion function that redirects to coding
  // Both buttons should now directly submit the test

  const handleForceSubmitRef = useRef(null);
  const terminatedRef = useRef(false); // prevent double termination
  const [shouldTerminate, setShouldTerminate] = useState(false); // trigger for termination

  // CRITICAL: Watch violations with a simpler approach
  useEffect(() => {
    const total = cheatingLog.totalViolations || 0;
    
    console.log('[TestPage] 🚨 Violation check - Total:', total, 'Type:', typeof total, 'Terminated:', terminatedRef.current);
    
    // Set termination trigger when >= 5
    if (total >= 5 && !terminatedRef.current && !shouldTerminate) {
      console.log('[TestPage] 💥 SETTING TERMINATION FLAG');
      setShouldTerminate(true);
    }
  }, [cheatingLog.totalViolations]);

  // Separate effect to handle termination
  useEffect(() => {
    if (shouldTerminate && !terminatedRef.current) {
      console.log('[TestPage] 💥 EXECUTING TERMINATION NOW!');
      terminatedRef.current = true;

      (async () => {
        console.log('[Terminate] 🔴 Starting termination sequence...');
        
        const answers = Object.keys(answersRef.current).length > 0
          ? answersRef.current
          : { terminated: 'terminated' };

        // Save result
        try {
          await axiosInstance.post(
            '/api/users/results',
            { examId, answers, subjectiveAnswers: {} },
            { withCredentials: true }
          );
          console.log('[Terminate] ✅ Result saved');
        } catch (err) {
          if (err?.response?.status !== 400) {
            console.error('[Terminate] Result save failed:', err?.response?.data);
          } else {
            console.log('[Terminate] Result already exists (400)');
          }
        }

        // Save cheating log
        try {
          await saveCheatingLogMutation({
            ...cheatingLog,
            username: userInfo?.name,
            email: userInfo?.email,
            examId,
            totalViolations: cheatingLog.totalViolations || 5,
          }).unwrap();
          console.log('[Terminate] ✅ Cheating log saved');
        } catch (err) {
          console.error('[Terminate] Cheating log save failed:', err);
        }

        // Show alert and navigate
        await swal({
          title: 'Exam Terminated!',
          text: 'You have reached 5 violations. Your exam has been submitted.',
          icon: 'error',
          button: 'OK',
          closeOnClickOutside: false,
          closeOnEsc: false,
        });

        console.log('[Terminate] 🔄 Navigating to dashboard...');
        navigate('/dashboard');
      })();
    }
  }, [shouldTerminate, examId, cheatingLog, userInfo, saveCheatingLogMutation, navigate]);

  const handleTestSubmission = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setIsSubmitting(true);

      // Get current answers from the ref
      const answersObject = answersRef.current || {};
      
      console.log('[TestPage] 📤 Submitting test...');
      console.log('[TestPage] Answers:', answersObject);

      // Save cheating log FIRST
      const updatedLog = {
        ...cheatingLog,
        username: userInfo.name,
        email: userInfo.email,
        examId: examId,
        totalViolations: parseInt(cheatingLog.totalViolations) || 0,
        screenshots: cheatingLog.screenshots || [],
      };

      console.log('[TestPage] 📤 Submitting cheating log:', updatedLog);

      try {
        const result = await saveCheatingLogMutation(updatedLog).unwrap();
        console.log('[TestPage] ✅ Cheating log saved successfully:', result);
      } catch (logError) {
        console.error('[TestPage] Error saving cheating log:', logError);
        // Continue with submission even if log save fails
      }

      // Save test results
      try {
        await axiosInstance.post(
          '/api/users/results',
          {
            examId,
            answers: answersObject,
            subjectiveAnswers: {},
          },
          {
            withCredentials: true,
          },
        );
        console.log('[TestPage] ✅ Results saved successfully');
      } catch (resultError) {
        // Check if it's a duplicate submission error (400)
        if (resultError?.response?.status === 400) {
          console.log('[TestPage] Result already exists, continuing...');
        } else {
          throw resultError;
        }
      }

      toast.success('Test submitted successfully!');
      navigate('/Success');
    } catch (error) {
      console.error('[TestPage] Error submitting test:', error);
      console.error('[TestPage] Error details:', error.data, error.status);
      toast.error(
        error?.data?.message || error?.message || 'Failed to submit test. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveUserTestScore = () => {
    setScore(score + 1);
  };

  if (isExamsLoading || isLoading || isCodingLoading || cameraPermissionChecking) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Block exam if camera permission not granted
  if (!cameraPermissionGranted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h5" color="error">
          Camera permission is required to take this exam.
        </Typography>
      </Box>
    );
  }

  return (
    <PageContainer title="TestPage" description="This is TestPage">
      <Box pt="3rem">
        <Grid container spacing={3}>
          <Grid item xs={12} md={7} lg={7}>
            <BlankCard>
              <Box
                width="100%"
                minHeight="400px"
                boxShadow={3}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
              >
                {isLoading || isCodingLoading ? (
                  <CircularProgress />
                ) : (
                  <MultipleChoiceQuestion
                    submitTest={handleTestSubmission}
                    questions={questions}
                    saveUserTestScore={saveUserTestScore}
                    answersRef={answersRef}
                  />
                )}
              </Box>
            </BlankCard>
          </Grid>
          <Grid item xs={12} md={5} lg={5}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    maxHeight="300px"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'start',
                      justifyContent: 'center',
                      overflowY: 'auto',
                      height: '100%',
                    }}
                  >
                    <NumberOfQuestions
                      questionLength={questions.length}
                      submitTest={handleTestSubmission}
                      examDurationInSeconds={examDurationInSeconds}
                    />
                  </Box>
                </BlankCard>
              </Grid>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    width="300px"
                    maxHeight="180px"
                    boxShadow={3}
                    display="flex"
                    flexDirection="column"
                    alignItems="start"
                    justifyContent="center"
                  >
                <WebCam
                    cheatingLog={cheatingLog}
                    updateCheatingLog={updateCheatingLog}
                  />
                  </Box>
                </BlankCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default TestPage;
