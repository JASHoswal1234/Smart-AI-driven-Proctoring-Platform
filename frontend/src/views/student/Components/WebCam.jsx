import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { drawRect, drawFaceRect } from './utilities';
import { Box, Card, Typography, CircularProgress } from '@mui/material';
import swal from 'sweetalert';
import { FaceMesh } from '@mediapipe/face_mesh';
import '@tensorflow/tfjs-backend-webgl';

// Cooldown per violation type in ms
const COOLDOWN_MS = 8000;
// Frames looking away before triggering (10 frames = ~5 seconds at 500ms interval) - allow time for rough work
const AWAY_FRAME_THRESHOLD = 10;
// Consecutive frames needed to confirm no-face (reduces false positives)
const NO_FACE_CONFIRMATION_FRAMES = 2;
// Multiple faces needs MORE frames - strictest check (must see 2+ faces for 3 consecutive frames)
const MULTIPLE_FACE_CONFIRMATION_FRAMES = 3;
// Cell phone only needs 1 frame (faster detection, partial phone visible)
const CELLPHONE_CONFIRMATION_FRAMES = 1;
// Book/laptop need 2 frames (balance speed vs false positives)
const OBJECT_CONFIRMATION_FRAMES = 2;
// Lower confidence for cell phone (partial visibility), higher for books/laptops
const CELLPHONE_CONFIDENCE_THRESHOLD = 0.55;
const OBJECT_CONFIDENCE_THRESHOLD = 0.75;

// ================= AUDIO MONITORING CONSTANTS =================
// Audio threshold: trigger when RMS exceeds this (0-255 range, ~30 = moderate speaking)
const AUDIO_THRESHOLD = 30;
// Duration in milliseconds: sustained audio above threshold needed to trigger violation
const AUDIO_DURATION_THRESHOLD = 4000; // 4 seconds of continuous speaking
// Cooldown for audio violations (same as other violations)
const AUDIO_COOLDOWN_MS = COOLDOWN_MS;

export default function WebCam({ cheatingLog, updateCheatingLog, onTerminate, compact = false }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const isProcessingRef = useRef(false);
  const smoothPoseRef = useRef({ yaw: 1, pitch: 1 });
  const awayFramesRef = useRef(0);
  const cooldownMapRef = useRef({});
  const totalViolationsRef = useRef(0);
  const onTerminateRef = useRef(onTerminate); // always latest
  const currentFaceLandmarksRef = useRef(null); // Store latest face landmarks
  
  // Audio monitoring refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioStartTimeRef = useRef(null); // When sustained audio started
  const audioCheckIntervalRef = useRef(null); // Interval ID for audio checking
  
  // Confirmation counters for reducing false positives
  const noFaceFramesRef = useRef(0);
  const multipleFaceFramesRef = useRef(0);
  const objectDetectionRef = useRef({ cellPhone: 0, book: 0, laptop: 0 });
  
  // Loading state for models
  const [modelsLoading, setModelsLoading] = useState(true);

  // Keep refs in sync
  useEffect(() => { onTerminateRef.current = onTerminate; }, [onTerminate]);
  useEffect(() => { totalViolationsRef.current = cheatingLog.totalViolations || 0; }, [cheatingLog.totalViolations]);

  // ================= UPLOAD SCREENSHOT =================
  const captureAndUpload = useCallback(async (type) => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4 || !canvasRef.current) return null;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/upload/screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dataUrl: canvas.toDataURL('image/jpeg'),
          examId: window.location.pathname.split('/')[2] || 'unknown',
          type,
        }),
      });
      const data = await response.json();
      if (data.secure_url) {
        console.log('✅ Screenshot uploaded:', data.secure_url);
        return { url: data.secure_url, type, detectedAt: new Date() };
      } else {
        console.error('❌ Upload error:', data.message);
      }
    } catch (err) {
      console.error('Screenshot upload failed:', err);
    }
    return null;
  }, []);

  // ================= HANDLE VIOLATION =================
  const handleViolation = useCallback(async (type, label) => {
    // CRITICAL: Stop detecting violations at 10
    if (totalViolationsRef.current >= 10) {
      console.log('[WebCam] 🛑 Already at 10 violations, ignoring new detections');
      return;
    }

    const now = Date.now();

    // Per-type cooldown check
    if (cooldownMapRef.current[type] && now - cooldownMapRef.current[type] < COOLDOWN_MS) return;
    cooldownMapRef.current[type] = now;

    const newTotal = totalViolationsRef.current + 1;
    totalViolationsRef.current = newTotal;

    console.log('[WebCam] 🚨 VIOLATION!', type, '- New total:', newTotal, 'Type:', typeof newTotal);

    // Upload screenshot in background
    const screenshot = await captureAndUpload(type);

    updateCheatingLog((prev) => {
      const updated = {
        ...prev,
        totalViolations: newTotal,
        [`${type}Count`]: (prev[`${type}Count`] || 0) + 1,
        screenshots: screenshot
          ? [...(prev.screenshots || []), screenshot]
          : prev.screenshots || [],
      };
      console.log('[WebCam] 📝 Updated cheating log:', updated);
      return updated;
    });

    // Don't show swal at 10 - TestPage will handle termination
    if (newTotal < 10) {
      swal('⚠️ Violation Detected', `${label}\nViolation ${newTotal}/10`, 'warning');
    } else {
      console.log('[WebCam] 🔴 Reached 10 violations - TestPage will terminate');
    }
  }, [captureAndUpload, updateCheatingLog]);

  // ================= PREVENT WASM CRASH =================
  useEffect(() => {
    const prev = window.onerror;
    window.onerror = (msg) => {
      if (msg?.includes('abort')) return true;
      return prev?.(msg);
    };
    return () => { window.onerror = prev; };
  }, []);

  // ================= FACEMESH =================
  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 2,
      refineLandmarks: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    faceMesh.onResults((results) => {
      // Stop processing if 10+ violations
      if (totalViolationsRef.current >= 10) return;

      // Store current face landmarks for drawing
      currentFaceLandmarksRef.current = results.multiFaceLandmarks;

      // No face detected
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        noFaceFramesRef.current++;
        multipleFaceFramesRef.current = 0; // Reset other counter
        awayFramesRef.current = 0;
        
        // Only trigger violation after consecutive frames
        if (noFaceFramesRef.current >= NO_FACE_CONFIRMATION_FRAMES) {
          noFaceFramesRef.current = 0; // Reset after triggering
          handleViolation('noFace', 'No face detected');
        }
        return;
      }

      // Multiple faces detected - STRICT: only trigger when exactly 2+ faces clearly detected
      if (results.multiFaceLandmarks.length >= 2) {
        multipleFaceFramesRef.current++;
        noFaceFramesRef.current = 0; // Reset other counter
        awayFramesRef.current = 0;
        
        // Only trigger violation after consecutive frames with 2+ faces
        if (multipleFaceFramesRef.current >= MULTIPLE_FACE_CONFIRMATION_FRAMES) {
          multipleFaceFramesRef.current = 0; // Reset after triggering
          handleViolation('multipleFace', `${results.multiFaceLandmarks.length} faces detected`);
        }
        return;
      }

      // Valid single face detected - reset all counters
      noFaceFramesRef.current = 0;
      multipleFaceFramesRef.current = 0;

      // Head pose
      const lm = results.multiFaceLandmarks[0];
      const nose = lm[1], left = lm[234], right = lm[454], top = lm[10], bottom = lm[152];

      const yawRatio = Math.abs(nose.x - left.x) / Math.abs(right.x - nose.x);
      const pitchRatio = Math.abs(nose.y - top.y) / Math.abs(bottom.y - nose.y);

      const alpha = 0.85;
      smoothPoseRef.current.yaw = alpha * smoothPoseRef.current.yaw + (1 - alpha) * yawRatio;
      smoothPoseRef.current.pitch = alpha * smoothPoseRef.current.pitch + (1 - alpha) * pitchRatio;

      const { yaw, pitch } = smoothPoseRef.current;
      // Very lenient thresholds - allow looking down for rough work, reading questions
      // Only flag extreme movements (completely turning away or looking far down for extended time)
      const isAway = yaw < 0.25 || yaw > 1.75 || pitch < 0.25 || pitch > 2.0;

      if (isAway) {
        awayFramesRef.current++;
        if (awayFramesRef.current >= AWAY_FRAME_THRESHOLD) {
          awayFramesRef.current = 0;
          handleViolation('lookingAway', 'Please look at the screen');
        }
      } else {
        awayFramesRef.current = 0; // Reset when looking forward
      }
    });

    faceMeshRef.current = faceMesh;
    return () => faceMesh.close();
  }, [handleViolation]);

  // ================= COCO-SSD =================
  useEffect(() => {
    let intervalId;

    const run = async () => {
      try {
        console.log('🔄 Loading detection models...');
        await tf.setBackend('webgl');
        await tf.ready();
        const net = await cocossd.load();
        console.log('✅ Models loaded successfully');
        setModelsLoading(false);

        intervalId = setInterval(async () => {
          // Stop processing if 10+ violations
          if (totalViolationsRef.current >= 10) return;

          const video = webcamRef.current?.video;
          if (!video || video.readyState !== 4) return;

          const canvas = canvasRef.current;
          if (!canvas) return;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');

          // Clear canvas before drawing
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // FaceMesh send
          if (faceMeshRef.current && !isProcessingRef.current) {
            isProcessingRef.current = true;
            try {
              await faceMeshRef.current.send({ image: video });
            } catch (e) {
              // suppress
            }
            isProcessingRef.current = false;
          }

          // Draw face rectangles first (from stored landmarks)
          if (currentFaceLandmarksRef.current) {
            drawFaceRect(currentFaceLandmarksRef.current, ctx, canvas);
          }

          // Object detection and drawing
          const objects = await net.detect(video);
          drawRect(objects, ctx);

          // Reset all object counters first
          const detectedNow = { cellPhone: false, book: false, laptop: false };

          objects.forEach(({ class: cls, score }) => {
            // Cell phone: lower confidence, detects partial phones
            if (cls === 'cell phone' && score >= CELLPHONE_CONFIDENCE_THRESHOLD) {
              detectedNow.cellPhone = true;
            }
            // Books/laptops: higher confidence
            if (cls === 'book' && score >= OBJECT_CONFIDENCE_THRESHOLD) {
              detectedNow.book = true;
            }
            if (cls === 'laptop' && score >= OBJECT_CONFIDENCE_THRESHOLD) {
              detectedNow.laptop = true;
            }
          });

          // Increment counters for detected objects, reset others
          Object.keys(detectedNow).forEach((objType) => {
            if (detectedNow[objType]) {
              objectDetectionRef.current[objType]++;
              // Cell phone needs fewer frames for faster detection
              const threshold = objType === 'cellPhone' ? CELLPHONE_CONFIRMATION_FRAMES : OBJECT_CONFIRMATION_FRAMES;
              
              if (objectDetectionRef.current[objType] >= threshold) {
                objectDetectionRef.current[objType] = 0; // Reset after triggering
                if (objType === 'cellPhone') handleViolation('cellPhone', 'Cell phone detected');
                if (objType === 'book') handleViolation('prohibitedObject', 'Book detected');
                if (objType === 'laptop') handleViolation('prohibitedObject', 'Laptop detected');
              }
            } else {
              objectDetectionRef.current[objType] = 0; // Reset if not detected
            }
          });
        }, 500); // Run every 500ms for smoother visuals
      } catch (error) {
        console.error('❌ Error loading models:', error);
        setModelsLoading(false);
      }
    };

    run();
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [handleViolation]);

  // ================= AUDIO MONITORING =================
  useEffect(() => {
    let mounted = true;

    const initAudioMonitoring = async () => {
      try {
        console.log('🎤 Initializing audio monitoring...');
        
        // Request microphone access (audio only)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        if (!mounted) {
          // Component unmounted before stream was obtained
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        audioStreamRef.current = stream;

        // Create Web Audio API context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create analyser for volume detection
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Connect microphone stream to analyser
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        console.log('✅ Audio monitoring initialized');

        // Start checking audio levels periodically
        audioCheckIntervalRef.current = setInterval(() => {
          // Stop processing if 10+ violations
          if (totalViolationsRef.current >= 10) return;

          if (!analyserRef.current) return;

          // Get audio data (frequency domain)
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate RMS (Root Mean Square) for volume level
          const sum = dataArray.reduce((acc, val) => acc + val * val, 0);
          const rms = Math.sqrt(sum / dataArray.length);

          const now = Date.now();

          // Check if audio exceeds threshold
          if (rms > AUDIO_THRESHOLD) {
            // Start tracking sustained audio
            if (!audioStartTimeRef.current) {
              audioStartTimeRef.current = now;
              console.log('[Audio] 🔊 Sustained audio started, RMS:', rms.toFixed(1));
            }

            // Check if audio has been sustained long enough
            const duration = now - audioStartTimeRef.current;
            if (duration >= AUDIO_DURATION_THRESHOLD) {
              console.log('[Audio] 🚨 Suspicious audio detected! Duration:', duration, 'ms, RMS:', rms.toFixed(1));
              handleViolation('suspiciousAudio', 'Suspicious audio/communication detected');
              // Reset start time after triggering
              audioStartTimeRef.current = null;
            }
          } else {
            // Audio dropped below threshold - reset timer
            if (audioStartTimeRef.current) {
              const duration = now - audioStartTimeRef.current;
              console.log('[Audio] 🔇 Audio stopped. Duration was:', duration, 'ms (threshold:', AUDIO_DURATION_THRESHOLD, 'ms)');
              audioStartTimeRef.current = null;
            }
          }
        }, 200); // Check every 200ms for responsive detection

      } catch (error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.warn('⚠️ Microphone access denied - audio monitoring disabled');
        } else {
          console.error('❌ Error initializing audio monitoring:', error);
        }
      }
    };

    initAudioMonitoring();

    // Cleanup function
    return () => {
      mounted = false;
      console.log('🧹 Cleaning up audio monitoring...');

      // Stop interval
      if (audioCheckIntervalRef.current) {
        clearInterval(audioCheckIntervalRef.current);
        audioCheckIntervalRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop microphone stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }

      // Reset audio tracking
      audioStartTimeRef.current = null;
      analyserRef.current = null;

      console.log('✅ Audio monitoring cleaned up');
    };
  }, [handleViolation]);

  const totalViolations = cheatingLog.totalViolations || 0;

  // Compact mode: tiny square for mobile toolbar
  if (compact) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          muted
          videoConstraints={{ width: 120, height: 120, facingMode: 'user' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}
        />
        {modelsLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
            }}
          >
            <CircularProgress size={20} sx={{ color: '#fff' }} />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Card sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          muted
          videoConstraints={{ width: 480, height: 480, facingMode: 'user' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}
        />
        {/* Loading indicator */}
        {modelsLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 25,
              backgroundColor: 'rgba(0,0,0,0.75)',
              borderRadius: '12px',
              px: 3,
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <CircularProgress size={32} sx={{ color: '#00ff00' }} />
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
              Loading AI Detection...
            </Typography>
          </Box>
        )}
        {/* Violation counter overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 20,
            backgroundColor: totalViolations >= 8 ? 'rgba(220,38,38,0.85)' : 'rgba(0,0,0,0.55)',
            borderRadius: '8px',
            px: 1.5,
            py: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
            Violations: {totalViolations}/10
          </Typography>
        </Box>
        {/* Detection status indicator */}
        {!modelsLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 20,
              backgroundColor: 'rgba(0,200,0,0.75)',
              borderRadius: '8px',
              px: 1.5,
              py: 0.5,
            }}
          >
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '11px' }}>
              ● MONITORING
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}
