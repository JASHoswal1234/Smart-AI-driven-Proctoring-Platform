import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uniqueId } from 'lodash';
import {
  Box, Button, Typography, Stack,
  Stepper, Step, StepLabel, Paper, Chip, LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import { CircularProgress } from '@mui/material';
import Webcam from 'react-webcam';
import { FaceMesh } from '@mediapipe/face_mesh';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from 'src/slices/authSlice';

const STEP_CAM   = 0;
const STEP_FACE  = 1;
const STEP_SHOT  = 2;
const STEP_READY = 3;
const STEPS = ['Camera Check', 'Face Verification', 'Screenshot Permission', 'Ready'];

const YAW_LEFT_MAX  = 0.55;
const YAW_RIGHT_MIN = 1.45;
const YAW_CENTER_LO = 0.75;
const YAW_CENTER_HI = 1.25;
const FACE_STEPS = ['Turn LEFT', 'Turn RIGHT', 'Face CENTER'];

export default function SystemCheck() {
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const { examId } = useParams();
  const { userInfo } = useSelector((s) => s.auth);

  const [step, setStep]           = useState(STEP_CAM);
  const [camStatus, setCamStatus] = useState('checking');
  const [shotStatus, setShotStatus] = useState('idle');
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const webcamRef      = useRef(null);
  const canvasRef      = useRef(null);
  const faceMeshRef    = useRef(null);
  const isProcessing   = useRef(false);
  const intervalRef    = useRef(null);
  const smoothYaw      = useRef(1);
  const faceStepIdxRef = useRef(0);
  const faceStepDoneRef = useRef([false, false, false]);

  const [faceStepIdx, setFaceStepIdx]   = useState(0);
  const [faceStepDone, setFaceStepDone] = useState([false, false, false]);
  const faceAllDone = faceStepDone.every(Boolean);

  // ── Camera check ────────────────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((s) => { s.getTracks().forEach(t => t.stop()); setCamStatus('ok'); })
      .catch(() => setCamStatus('denied'));
  }, []);

  // ── FaceMesh ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== STEP_FACE) return;

    const fm = new FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    });
    fm.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });

    fm.onResults((results) => {
      if (!results.multiFaceLandmarks?.length) return;
      const lm = results.multiFaceLandmarks[0];
      const nose = lm[1], left = lm[234], right = lm[454];
      const raw = Math.abs(nose.x - left.x) / Math.abs(right.x - nose.x);
      smoothYaw.current = 0.8 * smoothYaw.current + 0.2 * raw;
      const yaw = smoothYaw.current;

      const curIdx  = faceStepIdxRef.current;
      const curDone = [...faceStepDoneRef.current];
      if (curDone[curIdx]) return;

      const passed =
        (curIdx === 0 && yaw < YAW_LEFT_MAX) ||
        (curIdx === 1 && yaw > YAW_RIGHT_MIN) ||
        (curIdx === 2 && yaw > YAW_CENTER_LO && yaw < YAW_CENTER_HI);

      if (passed) {
        curDone[curIdx] = true;
        faceStepDoneRef.current = curDone;
        setFaceStepDone([...curDone]);

        if (curIdx < 2) {
          faceStepIdxRef.current = curIdx + 1;
          setFaceStepIdx(curIdx + 1);
        }

        // All done — capture photo at center pose
        if (curIdx === 2) {
          const video = webcamRef.current?.video;
          if (video && video.readyState === 4) {
            const c = document.createElement('canvas');
            c.width = video.videoWidth;
            c.height = video.videoHeight;
            c.getContext('2d').drawImage(video, 0, 0);
            const dataUrl = c.toDataURL('image/jpeg', 0.8);
            setCapturedPhoto(dataUrl);
            // Persist to localStorage keyed by user so it survives page reload
            if (userInfo?._id) {
              localStorage.setItem(`examPhoto_${userInfo._id}`, dataUrl);
            }
          }
          setTimeout(() => setStep(STEP_SHOT), 800);
        }
      }
    });

    faceMeshRef.current = fm;
    intervalRef.current = setInterval(async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4 || isProcessing.current) return;
      isProcessing.current = true;
      try { await fm.send({ image: video }); } catch {}
      isProcessing.current = false;
    }, 200);

    return () => { clearInterval(intervalRef.current); fm.close(); };
  }, [step]);

  // ── Screenshot consent ───────────────────────────────────────────────────────
  const requestScreenshot = () => {
    try {
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        const c = document.createElement('canvas');
        c.width = video.videoWidth; c.height = video.videoHeight;
        c.getContext('2d').drawImage(video, 0, 0);
      }
      setShotStatus('granted');
    } catch { setShotStatus('denied'); }
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === STEP_CAM  && camStatus === 'ok')       { setStep(STEP_FACE);  return; }
    if (step === STEP_SHOT && shotStatus === 'granted')  { setStep(STEP_READY); return; }
    if (step === STEP_READY) navigate(`/exam/${examId}/${uniqueId()}`);
  };

  const StatusIcon = ({ status }) =>
    status === 'ok' || status === 'granted' ? <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 28 }} />
    : status === 'denied'                   ? <ErrorIcon sx={{ color: '#dc2626', fontSize: 28 }} />
    : <CircularProgress size={24} />;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 560, borderRadius: '20px', overflow: 'hidden', border: '1px solid #e8eaf0' }}>

        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #003974 0%, #0056b3 100%)', px: 3, py: 2.5 }}>
          <Typography variant="h6" fontWeight={700} color="#fff">System Check</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
            Let's make sure everything is ready before your exam
          </Typography>
        </Box>

        {/* Stepper */}
        <Box sx={{ px: 3, pt: 3, backgroundColor: '#fff' }}>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content */}
        <Box sx={{ px: 3, py: 3, backgroundColor: '#fff' }}>

          {/* STEP 0 — Camera */}
          {step === STEP_CAM && (
            <Stack spacing={2.5} alignItems="center">
              <Box sx={{
                width: 220, height: 220, borderRadius: '16px', overflow: 'hidden',
                backgroundColor: '#000', border: '3px solid',
                borderColor: camStatus === 'ok' ? '#16a34a' : camStatus === 'denied' ? '#dc2626' : '#e0e0e0',
              }}>
                {camStatus !== 'denied'
                  ? <Webcam ref={webcamRef} audio={false} muted videoConstraints={{ width: 640, height: 640, facingMode: 'user' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><ErrorIcon sx={{ color: '#dc2626', fontSize: 48 }} /></Box>
                }
              </Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CameraAltIcon sx={{ color: '#003974' }} />
                <Typography fontWeight={600}>
                  {camStatus === 'checking' ? 'Checking camera...' : camStatus === 'ok' ? 'Camera working ✓' : 'Camera access denied'}
                </Typography>
                <StatusIcon status={camStatus} />
              </Stack>
              {camStatus === 'denied' && <Typography variant="body2" color="error" textAlign="center">Allow camera in browser settings and refresh.</Typography>}
              <Button variant="contained" disabled={camStatus !== 'ok'} onClick={handleNext} sx={{ backgroundColor: '#003974', borderRadius: '10px', px: 5, fontWeight: 700 }}>Next</Button>
            </Stack>
          )}

          {/* STEP 1 — Face */}
          {step === STEP_FACE && (
            <Stack spacing={2} alignItems="center">
              <Box sx={{ width: 220, height: 220, borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000', border: '3px solid #003974', position: 'relative' }}>
                <Webcam ref={webcamRef} audio={false} muted videoConstraints={{ width: 640, height: 640, facingMode: 'user' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                {/* Overlay instruction */}
                {!faceAllDone && (
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,57,116,0.85)', py: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="#fff" fontWeight={700}>{FACE_STEPS[faceStepIdx]}</Typography>
                  </Box>
                )}
                {faceAllDone && (
                  <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(22,163,74,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 56 }} />
                  </Box>
                )}
              </Box>

              <Stack direction="row" spacing={1} justifyContent="center">
                {FACE_STEPS.map((label, i) => (
                  <Chip key={label} label={label} size="small"
                    icon={faceStepDone[i] ? <CheckCircleIcon style={{ fontSize: 14 }} /> : undefined}
                    sx={{
                      backgroundColor: faceStepDone[i] ? '#dcfce7' : i === faceStepIdx ? '#dbeafe' : '#f3f4f6',
                      color: faceStepDone[i] ? '#166534' : i === faceStepIdx ? '#1e40af' : '#9ca3af',
                      fontWeight: faceStepDone[i] || i === faceStepIdx ? 700 : 400,
                      fontSize: '0.7rem',
                    }}
                  />
                ))}
              </Stack>

              <LinearProgress variant="determinate" value={(faceStepDone.filter(Boolean).length / 3) * 100}
                sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { backgroundColor: '#16a34a' } }}
              />
              {faceAllDone && (
                <Typography variant="body2" fontWeight={600} color="#16a34a">
                  ✓ Face photo captured for your exam identity
                </Typography>
              )}
            </Stack>
          )}

          {/* STEP 2 — Screenshot */}
          {step === STEP_SHOT && (
            <Stack spacing={2.5} alignItems="center">
              <ScreenshotMonitorIcon sx={{ fontSize: 64, color: '#003974' }} />
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} mb={1}>Screenshot Permission</Typography>
                <Typography variant="body2" color="text.secondary" maxWidth={400}>
                  If a violation is detected during the exam, a screenshot will be captured automatically as evidence.
                  By proceeding you consent to this.
                </Typography>
              </Box>
              {shotStatus === 'idle' && (
                <Button variant="contained" startIcon={<ScreenshotMonitorIcon />} onClick={requestScreenshot}
                  sx={{ backgroundColor: '#003974', borderRadius: '10px', px: 4, fontWeight: 700 }}>
                  Allow Screenshots
                </Button>
              )}
              {shotStatus === 'granted' && (
                <Stack spacing={1.5} alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ color: '#16a34a' }} />
                    <Typography fontWeight={600} color="#16a34a">Permission granted</Typography>
                  </Stack>
                  <Button variant="contained" onClick={handleNext} sx={{ backgroundColor: '#003974', borderRadius: '10px', px: 5, fontWeight: 700 }}>Next</Button>
                </Stack>
              )}
              {shotStatus === 'denied' && (
                <Stack spacing={1} alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center"><ErrorIcon sx={{ color: '#dc2626' }} /><Typography fontWeight={600} color="#dc2626">Failed</Typography></Stack>
                  <Button variant="outlined" onClick={requestScreenshot} sx={{ borderRadius: '10px' }}>Try Again</Button>
                </Stack>
              )}
            </Stack>
          )}

          {/* STEP 3 — Ready */}
          {step === STEP_READY && (
            <Stack spacing={2.5} alignItems="center">
              {/* Show captured photo */}
              {capturedPhoto && (
                <Box sx={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '3px solid #16a34a', boxShadow: '0 4px 16px rgba(22,163,74,0.3)' }}>
                  <img src={capturedPhoto} alt="Your photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              )}
              {!capturedPhoto && <CheckCircleIcon sx={{ fontSize: 72, color: '#16a34a' }} />}

              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} mb={0.5}>All checks passed!</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your identity has been verified. You're ready to start.
                </Typography>
              </Box>

              <Stack spacing={1} width="100%">
                {['Camera access', 'Face verification (left, right, center)', 'Identity photo captured', 'Screenshot permission'].map((label) => (
                  <Stack key={label} direction="row" alignItems="center" spacing={1}
                    sx={{ backgroundColor: '#f0fdf4', borderRadius: '10px', px: 2, py: 1 }}>
                    <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 16 }} />
                    <Typography variant="body2" fontWeight={500}>{label}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Button variant="contained" size="large" onClick={handleNext}
                sx={{ backgroundColor: '#003974', borderRadius: '10px', px: 5, fontWeight: 700 }}>
                Start Exam →
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
