import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uniqueId } from 'lodash';
import {
  Box, Button, Typography, Stack, CircularProgress,
  Stepper, Step, StepLabel, Paper, Chip, LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import FaceIcon from '@mui/icons-material/Face';
import Webcam from 'react-webcam';
import { FaceMesh } from '@mediapipe/face_mesh';

// ── Step indices ──────────────────────────────────────────────────────────────
const STEP_CAM   = 0;
const STEP_FACE  = 1;
const STEP_SHOT  = 2;
const STEP_READY = 3;

const STEPS = ['Camera Check', 'Face Verification', 'Screenshot Permission', 'Ready'];

// Head-pose thresholds (same logic as WebCam.jsx)
const YAW_LEFT_MAX  = 0.55;   // nose skewed left
const YAW_RIGHT_MIN = 1.45;   // nose skewed right
const YAW_CENTER_LO = 0.75;
const YAW_CENTER_HI = 1.25;

// ── Main component ────────────────────────────────────────────────────────────
export default function SystemCheck() {
  const navigate = useNavigate();
  const { examId } = useParams();

  const [step, setStep] = useState(STEP_CAM);

  // ── Step 0: camera ──────────────────────────────────────────────────────────
  const [camStatus, setCamStatus]   = useState('checking'); // checking | ok | denied
  const webcamRef  = useRef(null);

  // ── Step 1: face pose ───────────────────────────────────────────────────────
  const canvasRef     = useRef(null);
  const faceMeshRef   = useRef(null);
  const isProcessing  = useRef(false);
  const intervalRef   = useRef(null);
  const smoothYaw     = useRef(1);

  const FACE_STEPS = ['Turn LEFT', 'Turn RIGHT', 'Face CENTER'];
  const [faceStepIdx, setFaceStepIdx]   = useState(0);  // 0=left 1=right 2=center
  const [faceStepDone, setFaceStepDone] = useState([false, false, false]);
  const faceStepIdxRef = useRef(0);   // ref mirror so closure in facemesh callback works
  const faceStepDoneRef = useRef([false, false, false]);

  // ── Step 2: screenshot ──────────────────────────────────────────────────────
  const [shotStatus, setShotStatus] = useState('idle'); // idle | granted | denied

  // ── Step 0 — camera check ────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        s.getTracks().forEach(t => t.stop());
        setCamStatus('ok');
      } catch {
        setCamStatus('denied');
      }
    };
    check();
  }, []);

  // ── Step 1 — FaceMesh setup ──────────────────────────────────────────────────
  useEffect(() => {
    if (step !== STEP_FACE) return;

    const fm = new FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    });
    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    fm.onResults((results) => {
      if (!results.multiFaceLandmarks?.length) return;

      const lm = results.multiFaceLandmarks[0];
      const nose = lm[1], left = lm[234], right = lm[454];
      const raw = Math.abs(nose.x - left.x) / Math.abs(right.x - nose.x);

      const alpha = 0.8;
      smoothYaw.current = alpha * smoothYaw.current + (1 - alpha) * raw;
      const yaw = smoothYaw.current;

      const curIdx  = faceStepIdxRef.current;
      const curDone = [...faceStepDoneRef.current];
      if (curDone[curIdx]) return; // already ticked

      let passed = false;
      if (curIdx === 0) passed = yaw < YAW_LEFT_MAX;
      if (curIdx === 1) passed = yaw > YAW_RIGHT_MIN;
      if (curIdx === 2) passed = yaw > YAW_CENTER_LO && yaw < YAW_CENTER_HI;

      if (passed) {
        curDone[curIdx] = true;
        faceStepDoneRef.current = curDone;
        setFaceStepDone([...curDone]);

        if (curIdx < 2) {
          const next = curIdx + 1;
          faceStepIdxRef.current = next;
          setFaceStepIdx(next);
        }
        // all done — advance to screenshot step after short delay
        if (curIdx === 2) {
          setTimeout(() => setStep(STEP_SHOT), 800);
        }
      }
    });

    faceMeshRef.current = fm;

    // Poll webcam frames
    intervalRef.current = setInterval(async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4 || isProcessing.current) return;
      isProcessing.current = true;
      try { await fm.send({ image: video }); } catch {}
      isProcessing.current = false;
    }, 200);

    return () => {
      clearInterval(intervalRef.current);
      fm.close();
    };
  }, [step]);

  // ── Step 2 — Screenshot permission ─────────────────────────────────────────
  const requestScreenshot = async () => {
    try {
      // Attempt to capture a test screenshot (canvas from webcam)
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        const c = document.createElement('canvas');
        c.width = video.videoWidth;
        c.height = video.videoHeight;
        c.getContext('2d').drawImage(video, 0, 0);
        // If we can draw it, permission is implicitly granted via camera access
      }
      setShotStatus('granted');
    } catch {
      setShotStatus('denied');
    }
  };

  // ── Proceed ─────────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === STEP_CAM   && camStatus === 'ok')  { setStep(STEP_FACE); return; }
    if (step === STEP_SHOT  && shotStatus === 'granted') { setStep(STEP_READY); return; }
    if (step === STEP_READY) {
      const testId = uniqueId();
      navigate(`/exam/${examId}/${testId}`);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const StatusIcon = ({ status }) => {
    if (status === 'ok' || status === 'granted')
      return <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 28 }} />;
    if (status === 'denied')
      return <ErrorIcon sx={{ color: '#dc2626', fontSize: 28 }} />;
    return <CircularProgress size={24} />;
  };

  const faceAllDone = faceStepDone.every(Boolean);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 600,
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box sx={{ backgroundColor: '#003974', px: 3, py: 2 }}>
          <Typography variant="h6" fontWeight={700} color="#fff">
            System Check
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.25 }}>
            Let's make sure everything is ready before your exam
          </Typography>
        </Box>

        {/* Stepper */}
        <Box sx={{ px: 3, pt: 2.5 }}>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem' } }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content */}
        <Box sx={{ px: 3, py: 3 }}>

          {/* ── STEP 0: Camera ── */}
          {step === STEP_CAM && (
            <Stack spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 220,
                  height: 220,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  border: '3px solid',
                  borderColor: camStatus === 'ok' ? '#16a34a' : camStatus === 'denied' ? '#dc2626' : '#e0e0e0',
                  position: 'relative',
                }}
              >
                {camStatus !== 'denied' && (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    muted
                    videoConstraints={{ width: 640, height: 640, facingMode: 'user' }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                {camStatus === 'denied' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <ErrorIcon sx={{ color: '#dc2626', fontSize: 48 }} />
                  </Box>
                )}
              </Box>

              <Stack direction="row" alignItems="center" spacing={1}>
                <CameraAltIcon sx={{ color: '#003974' }} />
                <Typography variant="body1" fontWeight={600}>
                  {camStatus === 'checking' && 'Checking camera access...'}
                  {camStatus === 'ok'       && 'Camera is working ✓'}
                  {camStatus === 'denied'   && 'Camera access denied'}
                </Typography>
                <StatusIcon status={camStatus} />
              </Stack>

              {camStatus === 'denied' && (
                <Typography variant="body2" color="error" textAlign="center">
                  Please allow camera access in your browser settings and refresh the page.
                </Typography>
              )}

              <Button
                variant="contained"
                disabled={camStatus !== 'ok'}
                onClick={handleNext}
                sx={{ backgroundColor: '#003974', borderRadius: '8px', px: 4 }}
              >
                Next
              </Button>
            </Stack>
          )}

          {/* ── STEP 1: Face Verification ── */}
          {step === STEP_FACE && (
            <Stack spacing={2} alignItems="center">
              {/* Live webcam */}
              <Box
                sx={{
                  width: 220,
                  height: 220,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  border: '3px solid #003974',
                  position: 'relative',
                }}
              >
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  muted
                  videoConstraints={{ width: 640, height: 640, facingMode: 'user' }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <canvas
                  ref={canvasRef}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                />
              </Box>

              {/* Current instruction */}
              <Box
                sx={{
                  backgroundColor: faceStepDone[faceStepIdx] ? '#f0fdf4' : '#eff6ff',
                  border: '1.5px solid',
                  borderColor: faceStepDone[faceStepIdx] ? '#16a34a' : '#3b82f6',
                  borderRadius: '10px',
                  px: 3,
                  py: 1.5,
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                <Typography variant="h6" fontWeight={700} color={faceStepDone[faceStepIdx] ? '#16a34a' : '#003974'}>
                  {faceAllDone ? '✓ Face verification complete!' : `Please ${FACE_STEPS[faceStepIdx]}`}
                </Typography>
                {!faceAllDone && (
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    Hold the pose for a moment until it's detected
                  </Typography>
                )}
              </Box>

              {/* Sub-step chips */}
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                {FACE_STEPS.map((label, i) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    icon={faceStepDone[i] ? <CheckCircleIcon /> : undefined}
                    sx={{
                      backgroundColor: faceStepDone[i]
                        ? '#dcfce7'
                        : i === faceStepIdx
                        ? '#dbeafe'
                        : '#f3f4f6',
                      color: faceStepDone[i] ? '#166534' : i === faceStepIdx ? '#1e40af' : '#6b7280',
                      fontWeight: faceStepDone[i] || i === faceStepIdx ? 700 : 400,
                      border: i === faceStepIdx && !faceStepDone[i] ? '1.5px solid #3b82f6' : 'none',
                    }}
                  />
                ))}
              </Stack>

              {/* Progress bar */}
              <Box sx={{ width: '100%' }}>
                <LinearProgress
                  variant="determinate"
                  value={(faceStepDone.filter(Boolean).length / 3) * 100}
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { backgroundColor: '#16a34a' } }}
                />
              </Box>
            </Stack>
          )}

          {/* ── STEP 2: Screenshot Permission ── */}
          {step === STEP_SHOT && (
            <Stack spacing={2.5} alignItems="center">
              <ScreenshotMonitorIcon sx={{ fontSize: 64, color: '#003974' }} />

              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} mb={1}>
                  Screenshot Permission
                </Typography>
                <Typography variant="body2" color="text.secondary" maxWidth={400}>
                  This exam uses AI proctoring. If a violation is detected (e.g. looking away, phone detected),
                  a screenshot will be automatically captured as evidence.
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  By clicking <strong>Allow Screenshots</strong>, you consent to this.
                </Typography>
              </Box>

              {shotStatus === 'idle' && (
                <Button
                  variant="contained"
                  startIcon={<ScreenshotMonitorIcon />}
                  onClick={requestScreenshot}
                  sx={{ backgroundColor: '#003974', borderRadius: '8px', px: 4 }}
                >
                  Allow Screenshots
                </Button>
              )}

              {shotStatus === 'granted' && (
                <Stack spacing={1} alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ color: '#16a34a' }} />
                    <Typography fontWeight={600} color="#16a34a">Permission granted</Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ backgroundColor: '#003974', borderRadius: '8px', px: 4 }}
                  >
                    Next
                  </Button>
                </Stack>
              )}

              {shotStatus === 'denied' && (
                <Stack spacing={1} alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ErrorIcon sx={{ color: '#dc2626' }} />
                    <Typography fontWeight={600} color="#dc2626">Permission denied</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Screenshot capture failed. Please ensure your browser allows camera access.
                  </Typography>
                  <Button variant="outlined" onClick={requestScreenshot} sx={{ borderRadius: '8px' }}>
                    Try Again
                  </Button>
                </Stack>
              )}
            </Stack>
          )}

          {/* ── STEP 3: All Ready ── */}
          {step === STEP_READY && (
            <Stack spacing={2.5} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 72, color: '#16a34a' }} />
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} mb={1}>
                  All checks passed!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your camera is working, face verification is complete, and proctoring permissions are set.
                  You're ready to start your exam.
                </Typography>
              </Box>

              {/* Summary */}
              <Stack spacing={1} width="100%">
                {[
                  { label: 'Camera access', ok: true },
                  { label: 'Face verification (left, right, center)', ok: true },
                  { label: 'Screenshot permission', ok: true },
                ].map(({ label, ok }) => (
                  <Stack key={label} direction="row" alignItems="center" spacing={1}
                    sx={{ backgroundColor: '#f0fdf4', borderRadius: '8px', px: 2, py: 1 }}
                  >
                    <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 18 }} />
                    <Typography variant="body2" fontWeight={500}>{label}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                sx={{ backgroundColor: '#003974', borderRadius: '8px', px: 5, fontWeight: 700 }}
              >
                Proceed to Exam →
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
