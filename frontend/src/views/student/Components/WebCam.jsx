import React, { useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { drawRect } from './utilities';
import { Box, Card, Typography } from '@mui/material';
import swal from 'sweetalert';
import { FaceMesh } from '@mediapipe/face_mesh';
import '@tensorflow/tfjs-backend-webgl';

// Cooldown per violation type in ms
const COOLDOWN_MS = 8000;
// Frames looking away before triggering
const AWAY_FRAME_THRESHOLD = 20;

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
    // CRITICAL: Stop detecting violations at 5
    if (totalViolationsRef.current >= 5) {
      console.log('[WebCam] 🛑 Already at 5 violations, ignoring new detections');
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

    // Don't show swal at 5 - TestPage will handle termination
    if (newTotal < 5) {
      swal('⚠️ Violation Detected', `${label}\nViolation ${newTotal}/5`, 'warning');
    } else {
      console.log('[WebCam] 🔴 Reached 5 violations - TestPage will terminate');
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
      // Stop processing if 5+ violations
      if (totalViolationsRef.current >= 5) return;

      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        awayFramesRef.current = 0;
        handleViolation('noFace', 'No face detected');
        return;
      }

      if (results.multiFaceLandmarks.length > 1) {
        awayFramesRef.current = 0;
        handleViolation('multipleFace', 'Multiple faces detected');
        return;
      }

      // Head pose
      const lm = results.multiFaceLandmarks[0];
      const nose = lm[1], left = lm[234], right = lm[454], top = lm[10], bottom = lm[152];

      const yawRatio = Math.abs(nose.x - left.x) / Math.abs(right.x - nose.x);
      const pitchRatio = Math.abs(nose.y - top.y) / Math.abs(bottom.y - nose.y);

      const alpha = 0.85;
      smoothPoseRef.current.yaw = alpha * smoothPoseRef.current.yaw + (1 - alpha) * yawRatio;
      smoothPoseRef.current.pitch = alpha * smoothPoseRef.current.pitch + (1 - alpha) * pitchRatio;

      const { yaw, pitch } = smoothPoseRef.current;
      const isAway = yaw < 0.45 || yaw > 1.55 || pitch < 0.45 || pitch > 1.75;

      if (isAway) {
        awayFramesRef.current++;
        if (awayFramesRef.current >= AWAY_FRAME_THRESHOLD) {
          awayFramesRef.current = 0;
          handleViolation('lookingAway', 'Please look at the screen');
        }
      } else {
        awayFramesRef.current = 0;
      }
    });

    faceMeshRef.current = faceMesh;
    return () => faceMesh.close();
  }, [handleViolation]);

  // ================= COCO-SSD =================
  useEffect(() => {
    let intervalId;

    const run = async () => {
      await tf.setBackend('webgl');
      await tf.ready();
      const net = await cocossd.load();

      intervalId = setInterval(async () => {
        // Stop processing if 5+ violations
        if (totalViolationsRef.current >= 5) return;

        const video = webcamRef.current?.video;
        if (!video || video.readyState !== 4) return;

        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

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

        // Object detection
        const objects = await net.detect(video);
        drawRect(objects, canvas.getContext('2d'));

        objects.forEach(({ class: cls, score }) => {
          if (score < 0.6) return; // ignore low-confidence detections
          if (cls === 'cell phone') handleViolation('cellPhone', 'Cell phone detected');
          if (cls === 'book') handleViolation('prohibitedObject', 'Book detected');
          if (cls === 'laptop') handleViolation('prohibitedObject', 'Laptop detected');
        });
      }, 1000); // run every 1s instead of 500ms
    };

    run();
    return () => { if (intervalId) clearInterval(intervalId); };
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
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ position: 'relative' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          muted
          videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
          style={{ width: '100%' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}
        />
        {/* Violation counter overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 20,
            backgroundColor: totalViolations >= 4 ? 'rgba(220,38,38,0.85)' : 'rgba(0,0,0,0.55)',
            borderRadius: '8px',
            px: 1.5,
            py: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
            Violations: {totalViolations}/5
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
