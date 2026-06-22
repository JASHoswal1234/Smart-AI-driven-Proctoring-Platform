import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import { Box, Stack, Typography } from '@mui/material';

const NumberOfQuestions = ({ questionLength, examDurationInSeconds, currentQuestion, answeredQuestions = [], onTimerTick }) => {
  const totalQuestions = questionLength;
  const questionNumbers = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  const [timeLeft, setTimeLeft] = useState(examDurationInSeconds * 60);

  useEffect(() => {
    setTimeLeft(examDurationInSeconds * 60);
  }, [examDurationInSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (onTimerTick) onTimerTick(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rows of 5
  const rows = [];
  for (let i = 0; i < questionNumbers.length; i += 5) {
    rows.push(questionNumbers.slice(i, i + 5));
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Legend */}
      <Stack direction="row" spacing={2} mb={2}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#22c55e' }} />
          <Typography variant="caption" color="text.secondary">Attempted</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#e0e0e0' }} />
          <Typography variant="caption" color="text.secondary">Not attempted</Typography>
        </Stack>
      </Stack>

      {/* Question grid */}
      <Grid container spacing={1}>
        {rows.map((row, rowIndex) => (
          <Grid key={rowIndex} item xs={12}>
            <Stack direction="row" alignItems="center" justifyContent="start" flexWrap="wrap">
              {row.map((questionNumber) => {
                const idx = questionNumber - 1;
                const isCurrent = (currentQuestion ?? 0) === idx;
                const isAnswered = answeredQuestions.includes(idx);
                return (
                  <Avatar
                    key={questionNumber}
                    variant="rounded"
                    sx={{
                      width: { xs: '36px', md: '40px' },
                      height: { xs: '36px', md: '40px' },
                      fontSize: { xs: '13px', md: '15px' },
                      cursor: 'default',
                      m: 0.5,
                      background: isCurrent
                        ? '#003974'
                        : isAnswered
                        ? '#22c55e'
                        : '#e0e0e0',
                      color: isCurrent || isAnswered ? '#fff' : '#555',
                      fontWeight: 700,
                      border: isCurrent ? '2px solid #1565c0' : 'none',
                    }}
                  >
                    {questionNumber}
                  </Avatar>
                );
              })}
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default NumberOfQuestions;
