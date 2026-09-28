import React, { memo } from 'react';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import { Box, Stack, Typography } from '@mui/material';

// Stable sx objects — avoids MUI/emotion recalculating styles on every render
const sxCurrent   = { width: { xs: '36px', md: '40px' }, height: { xs: '36px', md: '40px' }, fontSize: { xs: '13px', md: '15px' }, cursor: 'default', m: 0.5, background: '#003974', color: '#fff', fontWeight: 700, border: '2px solid #1565c0' };
const sxAnswered  = { width: { xs: '36px', md: '40px' }, height: { xs: '36px', md: '40px' }, fontSize: { xs: '13px', md: '15px' }, cursor: 'default', m: 0.5, background: '#22c55e', color: '#fff', fontWeight: 700, border: 'none' };
const sxUnanswered = { width: { xs: '36px', md: '40px' }, height: { xs: '36px', md: '40px' }, fontSize: { xs: '13px', md: '15px' }, cursor: 'default', m: 0.5, background: '#e0e0e0', color: '#555', fontWeight: 700, border: 'none' };

// Wrapped in React.memo — skips re-render unless props actually change.
// The timer that was previously here has been removed: it was a duplicate of the
// one in TestPage's useExamTimer hook, causing TestPage to re-render twice per second.
const NumberOfQuestions = memo(function NumberOfQuestions({
  questionLength,
  currentQuestion,
  answeredQuestions = [],
}) {
  const totalQuestions = questionLength;
  const questionNumbers = Array.from({ length: totalQuestions }, (_, i) => i + 1);

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
                const isCurrent  = (currentQuestion ?? 0) === idx;
                const isAnswered = answeredQuestions.includes(idx);
                return (
                  <Avatar
                    key={questionNumber}
                    variant="rounded"
                    sx={isCurrent ? sxCurrent : isAnswered ? sxAnswered : sxUnanswered}
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
});

export default NumberOfQuestions;
