import React from 'react';
import { Grid, Typography, Box, CircularProgress } from '@mui/material';
import ExamCard from './ExamCard';
import { useGetExamsQuery, useGetUserResultsQuery } from 'src/slices/examApiSlice';

const Exams = () => {
  const { data: userExams, isLoading, isError } = useGetExamsQuery();
  const { data: userResults } = useGetUserResultsQuery();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">Error fetching exams.</Typography>
      </Box>
    );
  }

  // Get set of completed exam IDs
  const completedExamIds = new Set(
    userResults?.data?.map((result) => result.examId) || []
  );

  // Recompute status client-side — normalize to day boundaries
  const now = new Date();
  const getStatus = (exam) => {
    const liveDate = new Date(exam.liveDate);
    const deadDate = new Date(exam.deadDate);
    const liveDayStart = new Date(liveDate.getFullYear(), liveDate.getMonth(), liveDate.getDate(), 0, 0, 0, 0);
    const deadDayEnd = new Date(deadDate.getFullYear(), deadDate.getMonth(), deadDate.getDate(), 23, 59, 59, 999);
    if (now < liveDayStart) return 'upcoming';
    if (now > deadDayEnd) return 'expired';
    return 'active';
  };

  // Separate exams into available and completed
  const availableExams = userExams.filter((exam) => !completedExamIds.has(exam.examId));
  const completedExams = userExams.filter((exam) => completedExamIds.has(exam.examId));

  return (
    <Box 
      sx={{ 
        width: '100%',
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        py: 4,
        backgroundColor: '#F8F9FB',
        minHeight: '100vh'
      }}
    >
      {/* Active Exams Section */}
      {availableExams.length > 0 && (
        <Box mb={5}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: '#003974',
              mb: 3,
              fontSize: '24px',
            }}
          >
            Active Exams
          </Typography>
          
          <Grid container spacing={3}>
            {availableExams.map((exam, index) => (
              <Grid item xs={12} sm={6} md={4} key={exam._id}>
                <ExamCard exam={exam} isCompleted={false} status={getStatus(exam)} serialNumber={index + 1} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Previously Given Exams Section */}
      {completedExams.length > 0 && (
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: '#003974',
              mb: 3,
              fontSize: '24px',
            }}
          >
            Previous Exams
          </Typography>
          
          <Grid container spacing={3}>
            {completedExams.map((exam, index) => (
              <Grid item xs={12} sm={6} md={4} key={exam._id}>
                <ExamCard exam={exam} isCompleted={true} serialNumber={availableExams.length + index + 1} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {availableExams.length === 0 && completedExams.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 600 }}>
            No exams available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Exams;
