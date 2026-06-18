import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import axiosInstance from '../../axios';
import Webcam from '../student/Components/WebCam';
import {
  Button,
  Box,
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice'; // Adjust the import path
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import swal from 'sweetalert';

export default function Coder() {
  const [code, setCode] = useState('// Write your code here...');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [questionId, setQuestionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState(null);
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState(0);
  const { examId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();

  // Enter fullscreen when page loads
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
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    };

    enterFullscreen();

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error('Exit fullscreen error:', err));
      }
    };
  }, []);

  // Tab switching detection
  useEffect(() => {
    // Check total violations
    const totalViolations = 
      cheatingLog.noFaceCount + 
      cheatingLog.multipleFaceCount + 
      cheatingLog.cellPhoneCount + 
      cheatingLog.prohibitedObjectCount + 
      cheatingLog.tabSwitchCount;

    if (totalViolations >= 5) {
      swal({
        title: 'Test Terminated!',
        text: 'You have exceeded the maximum number of violations (5). Please contact your teacher.',
        icon: 'error',
        button: 'OK',
        closeOnClickOutside: false,
      }).then(() => {
        navigate('/dashboard');
      });
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastTabSwitchTime >= 2000) {
          setLastTabSwitchTime(now);
          const newCount = cheatingLog.tabSwitchCount + 1;
          updateCheatingLog({
            ...cheatingLog,
            tabSwitchCount: newCount,
          });
          swal('Tab Switch Detected!', `Warning Recorded (Count: ${newCount})`, 'warning');
        }
      }
    };

    const handleBlur = () => {
      const now = Date.now();
      if (now - lastTabSwitchTime >= 2000) {
        setLastTabSwitchTime(now);
        const newCount = cheatingLog.tabSwitchCount + 1;
        updateCheatingLog({
          ...cheatingLog,
          tabSwitchCount: newCount,
        });
        swal('Window Focus Lost!', `Warning Recorded (Count: ${newCount})`, 'warning');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const now = Date.now();
        if (now - lastTabSwitchTime >= 2000) {
          setLastTabSwitchTime(now);
          const newCount = cheatingLog.tabSwitchCount + 1;
          updateCheatingLog({
            ...cheatingLog,
            tabSwitchCount: newCount,
          });
          swal('Fullscreen Exited!', `Warning Recorded (Count: ${newCount})`, 'warning');
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
    if (userInfo) {
      updateCheatingLog((prevLog) => ({
        ...prevLog,
        username: userInfo.name,
        email: userInfo.email,
      }));
    }
  }, [userInfo]);

  // Fetch coding question when component mounts
  useEffect(() => {
    const fetchCodingQuestion = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(`/api/coding/questions/exam/${examId}`, {
          withCredentials: true,
        });
        if (response.data.success && response.data.data) {
          setQuestionId(response.data.data._id);
          setQuestion(response.data.data);
          // Set initial code if there's a template or description
          if (response.data.data.description) {
            setCode(`// ${response.data.data.description}\n\n// Write your code here...`);
          }
        } else {
          toast.error('No coding question found for this exam. Please contact your teacher.');
        }
      } catch (error) {
        console.error('Error fetching coding question:', error);
        toast.error(error?.response?.data?.message || 'Failed to load coding question');
      } finally {
        setIsLoading(false);
      }
    };

    if (examId) {
      fetchCodingQuestion();
    }
  }, [examId]);

  const runCode = async () => {
    let apiUrl;
    switch (language) {
      case 'python':
        apiUrl = '/run-python';
        break;
      case 'java':
        apiUrl = '/run-java';
        break;
      case 'javascript':
        apiUrl = '/run-javascript';
        break;
      default:
        return;
    }

    try {
      const response = await axiosInstance.post(apiUrl, { code }, { withCredentials: true });
      console.log('API Response:', response.data); // Log the response for debugging
      setOutput(response.data); // Adjust based on actual response structure
    } catch (error) {
      console.error('Error running code:', error);
      setOutput('Error running code.'); // Display error message
    }
  };

  const handleSubmit = async () => {
    console.log('Starting submission with questionId:', questionId);
    console.log('Current code:', code);
    console.log('Selected language:', language);
    console.log('Current cheating log:', cheatingLog);

    if (!questionId) {
      toast.error('Question not loaded properly. Please try again.');
      return;
    }

    try {
      // First submit the code
      const codeSubmissionData = {
        code,
        language,
        questionId,
      };

      console.log('Submitting code with data:', codeSubmissionData);

      const response = await axiosInstance.post('/api/coding/submit', codeSubmissionData, {
        withCredentials: true,
      });
      console.log('Submission response:', response.data);

      if (response.data.success) {
        try {
          // Make sure we have the latest user info in the log
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
            screenshots: cheatingLog.screenshots || [],
          };

          console.log('[Coder] === SAVING CHEATING LOG ===');
          console.log('[Coder] Data to save:', updatedLog);
          const logResult = await saveCheatingLogMutation(updatedLog).unwrap();
          console.log('[Coder] ✓ Cheating log saved successfully. Response:', logResult);
          console.log('[Coder] Saved log ID:', logResult._id);

          toast.success('Test submitted successfully!');
          navigate('/Success');
        } catch (cheatingLogError) {
          console.error('[Coder] ✗ Error saving cheating log:', cheatingLogError);
          console.error('[Coder] Error data:', cheatingLogError.data);
          console.error('[Coder] Error status:', cheatingLogError.status);
          toast.error('Test submitted but failed to save monitoring logs');
          navigate('/Success');
        }
      } else {
        console.error('Submission failed:', response.data);
        toast.error('Failed to submit code');
      }
    } catch (error) {
      console.error('Error during submission:', error.response?.data || error);
      toast.error(
        error?.response?.data?.message || error?.data?.message || 'Failed to submit test',
      );
    }
  };

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isLoading ? (
        <Box sx={{ textAlign: 'center', p: 3 }}>Loading question...</Box>
      ) : !question ? (
        <Box sx={{ textAlign: 'center', p: 3 }}>
          No coding question found for this exam. Please contact your teacher.
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          {/* Question Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h5" gutterBottom>
                {question.question}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {question.description}
              </Typography>
            </Paper>
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)' }}>
            {/* Code Editor Section */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={language}
                    label="Language"
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <MenuItem value="javascript">JavaScript</MenuItem>
                    <MenuItem value="python">Python</MenuItem>
                    <MenuItem value="java">Java</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: 1, minHeight: 0, height: 'calc(100% - 200px)' }}>
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value)}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </Box>

              {/* Output Section */}
              <Paper sx={{ mt: 2, p: 2, height: '120px', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Output:
                </Typography>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
              </Paper>

              {/* Action Buttons */}
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={runCode} sx={{ minWidth: 120 }}>
                  Run Code
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  sx={{ minWidth: 120 }}
                >
                  Submit Test
                </Button>
              </Box>
            </Box>

            {/* Webcam Section */}
            <Box sx={{ width: '320px', height: '240px', flexShrink: 0 }}>
              <Paper sx={{ height: '100%', overflow: 'hidden' }}>
                <Webcam
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  cheatingLog={cheatingLog}
                  updateCheatingLog={updateCheatingLog}
                />
              </Paper>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
