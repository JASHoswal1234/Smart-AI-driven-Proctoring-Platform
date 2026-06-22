import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import questions from './questionData';
import BlankCard from 'src/components/shared/BlankCard';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const NumberOfQuestions = ({ questionLength, submitTest, examDurationInSeconds }) => {
  const totalQuestions = questionLength;
  const questionNumbers = Array.from({ length: totalQuestions }, (_, index) => index + 1);

  const [timeLeft, setTimeLeft] = useState(examDurationInSeconds * 60); // Convert minutes to seconds
  const navigate = useNavigate();

  // Create an array of rows, each containing up to 4 question numbers
  const rows = [];
  for (let i = 0; i < questionNumbers.length; i += 5) {
    rows.push(questionNumbers.slice(i, i + 5));
  }

  const handleQuestionButtonClick = (questionNumber) => {
    // Set the current question to the selected question number
    // setCurrentQuestion(questionNumber);
  };

  useEffect(() => {
    // Reset timer when exam duration changes
    setTimeLeft(examDurationInSeconds * 60);
  }, [examDurationInSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeUp = () => {
    toast.warning('Time is up! Submitting your test...');
    submitTest();
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Fixed header with consistent spacing */}
      <Box 
        position="sticky" 
        top="0" 
        zIndex={1} 
        bgcolor="white" 
        width="100%"
        sx={{
          py: { xs: 1.5, md: 2 },
          px: { xs: 2, md: 3 },
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between"
          spacing={2}
          sx={{
            flexWrap: { xs: 'nowrap', sm: 'nowrap' },
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Questions: 1/{totalQuestions}
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Time Left: {formatTime(timeLeft)}
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={submitTest} 
            color="error"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              py: { xs: 0.75, md: 1 },
              px: { xs: 1.5, md: 2 },
              whiteSpace: 'nowrap',
              minWidth: 'auto',
            }}
          >
            Finish Test
          </Button>
        </Stack>
      </Box>

      {/* Question numbers grid */}
      <Box 
        sx={{
          p: { xs: 2, md: 3 },
          mt: { xs: 2, md: 3 },
          maxHeight: { xs: '200px', md: '270px' },
          overflowY: 'auto',
        }}
      >
        <Grid container spacing={1}>
          {rows.map((row, rowIndex) => (
            <Grid key={rowIndex} item xs={12}>
              <Stack direction="row" alignItems="center" justifyContent="start" flexWrap="wrap">
                {row.map((questionNumber) => (
                  <Avatar
                    key={questionNumber}
                    variant="rounded"
                    sx={{
                      width: { xs: '35px', md: '40px' },
                      height: { xs: '35px', md: '40px' },
                      fontSize: { xs: '16px', md: '20px' },
                      cursor: 'pointer',
                      m: 0.5,
                      background: '#ccc',
                    }}
                    onClick={() => handleQuestionButtonClick(questionNumber)}
                  >
                    {questionNumber}
                  </Avatar>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default NumberOfQuestions;
