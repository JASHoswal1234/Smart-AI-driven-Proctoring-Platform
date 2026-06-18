import React, { useState, useCallback } from 'react';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  List,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import Paper from '@mui/material/Paper';
import { useNavigate, useParams } from 'react-router';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import { useSelector } from 'react-redux';
import swal from 'sweetalert';

const CodeDetailsMore = () => {
  const [certify, setCertify] = useState(false);
  const [hasCodingQuestions, setHasCodingQuestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState(0);
  const navigate = useNavigate();
  const { examId } = useParams();
  const { cheatingLog, updateCheatingLog } = useCheatingLog();
  const { userInfo } = useSelector((state) => state.auth);

  // Enter fullscreen when page loads
  React.useEffect(() => {
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
        document.exitFullscreen().catch((err) => console.error('Exit fullscreen error:', err));
      }
    };
  }, []);

  // ✅ FIX 1: Separate violation recording logic using useCallback
  // The old code was spreading stale cheatingLog state causing counts to reset
  const recordViolation = useCallback(
    async (type) => {
      const now = Date.now();
      if (now - lastTabSwitchTime < 2000) return; // debounce
      setLastTabSwitchTime(now);

      // ✅ FIX 2: Calculate new count BEFORE updating so it's accurate
      const newCount = (cheatingLog.tabSwitchCount || 0) + 1;
      const totalViolations =
        (cheatingLog.noFaceCount || 0) +
        (cheatingLog.multipleFaceCount || 0) +
        (cheatingLog.cellPhoneCount || 0) +
        (cheatingLog.prohibitedObjectCount || 0) +
        newCount; // use newCount not old tabSwitchCount

      // ✅ FIX 3: Update FIRST, then show alert (so state saves even if alert blocks)
      updateCheatingLog({
        ...cheatingLog,
        tabSwitchCount: newCount,
      });

      console.log(`Violation recorded: ${type}, tabSwitchCount: ${newCount}, total: ${totalViolations}`);

      if (totalViolations >= 5) {
        await swal({
          title: 'Test Terminated!',
          text: 'You have exceeded the maximum number of violations (5). Please contact your teacher.',
          icon: 'error',
          button: 'OK',
          closeOnClickOutside: false,
        });
        navigate('/dashboard');
        return;
      }

      swal(`${type}!`, `Warning Recorded (Tab Switch Count: ${newCount}, Total Violations: ${totalViolations})`, 'warning');
    },
    [cheatingLog, updateCheatingLog, lastTabSwitchTime, navigate],
  );

  // Tab switching / blur / fullscreen detection
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('Tab Switch Detected');
      }
    };

    const handleBlur = () => {
      recordViolation('Window Focus Lost');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordViolation('Fullscreen Exited');
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
  }, [recordViolation]); // ✅ FIX 4: depend on recordViolation, not the whole cheatingLog

  React.useEffect(() => {
    const checkCodingQuestions = async () => {
      try {
        const response = await fetch(`/api/coding/questions/${examId}`, {
          credentials: 'include',
        });
        const data = await response.json();
        setHasCodingQuestions(data && data.length > 0);
        if (!data || data.length === 0) {
          navigate('/Success');
        }
      } catch (error) {
        navigate('/Success');
      } finally {
        setLoading(false);
      }
    };
    checkCodingQuestions();
  }, [examId, navigate]);

  const handleCertifyChange = () => setCertify(!certify);
  const handleCodeTest = () => navigate(`/exam/${examId}/code`);
  const handleSkipCoding = () => navigate('/Success');

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardContent>
          {/* ✅ FIX 5: Show live violation count so you can verify it's working */}
          <Typography variant="caption" color="error" display="block" mb={1}>
            Violations: Tab={cheatingLog.tabSwitchCount || 0} | 
            NoFace={cheatingLog.noFaceCount || 0} | 
            Total={
              (cheatingLog.tabSwitchCount || 0) +
              (cheatingLog.noFaceCount || 0) +
              (cheatingLog.multipleFaceCount || 0) +
              (cheatingLog.cellPhoneCount || 0) +
              (cheatingLog.prohibitedObjectCount || 0)
            }
          </Typography>

          <Typography variant="h2" mb={3}>
            Coding Round
          </Typography>
          <Typography>
            This section contains coding questions to test your programming skills. You will be
            able to write and execute code in multiple programming languages.
          </Typography>
          <Typography mt={2}>#Coding #Programming</Typography>

          <Typography variant="h3" mb={3} mt={3}>
            Test Instructions
          </Typography>
          <List>
            <ol>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    This section consists of <strong>coding questions.</strong>
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Write your code in the provided editor and test it before submitting.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    You can choose from multiple programming languages.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Your code will be executed and tested automatically.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Click Submit when you complete the coding questions.
                  </Typography>
                </ListItemText>
              </li>
            </ol>
          </List>

          <Typography variant="h3" mb={3} mt={3}>
            Confirmation
          </Typography>
          <Typography mb={3}>
            Your actions shall be proctored and any signs of wrongdoing may lead to suspension or
            cancellation of your test.
          </Typography>
          <Stack direction="column" alignItems="center" spacing={3}>
            <FormControlLabel
              control={
                <Checkbox checked={certify} onChange={handleCertifyChange} color="primary" />
              }
              label="I certify that I have carefully read and agree to all of the instructions mentioned above"
            />
            <Stack direction="row" spacing={2}>
              <Button
                onClick={handleCodeTest}
                disabled={!certify}
                variant="contained"
                color="primary"
              >
                Start Coding Test
              </Button>
              <Button
                onClick={handleSkipCoding}
                disabled={!certify}
                variant="outlined"
                color="secondary"
              >
                Skip & Submit
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </div>
  );
};

const imgUrl =
  'https://cdn-api.elice.io/api-attachment/attachment/61bd920a02e1497b8f9fab92d566e103/image.jpeg';

export function CodeDetails() {
  return (
    <Grid container sx={{ height: '100vh' }}>
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: `url(${imgUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <CodeDetailsMore />
      </Grid>
    </Grid>
  );
}

export default CodeDetails;