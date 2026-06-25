import React from 'react';
import { Grid, Typography, Box, Paper, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetExamsQuery, useGetUserResultsQuery } from 'src/slices/examApiSlice';
import ExamCard from './Components/ExamCard';
import FlowButton from 'src/components/shared/FlowButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Assignment, CheckCircle, Schedule, EmojiEvents, Add as AddIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet';
import axiosInstance from '../../axios';

const Dashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const examPhoto = userInfo?._id ? localStorage.getItem(`examPhoto_${userInfo._id}`) : null;
  const { data: userExams } = useGetExamsQuery();
  const { data: userResults } = useGetUserResultsQuery();
  const navigate = useNavigate();
  const isTeacher = userInfo?.role === 'teacher';

  // Get completed exam IDs
  const completedExamIds = new Set(
    userResults?.data?.map((result) => result.examId) || []
  );

  // Categorize exams by status — recompute client-side to avoid server timezone drift
  // Normalize to date boundaries so "June 25" means active all day on June 25
  const now = new Date();
  const categorizeStatus = (exam) => {
    const liveDate = new Date(exam.liveDate);
    const deadDate = new Date(exam.deadDate);
    const liveDayStart = new Date(liveDate.getFullYear(), liveDate.getMonth(), liveDate.getDate(), 0, 0, 0, 0);
    const deadDayEnd = new Date(deadDate.getFullYear(), deadDate.getMonth(), deadDate.getDate(), 23, 59, 59, 999);
    if (now < liveDayStart) return 'upcoming';
    if (now > deadDayEnd) return 'expired';
    return 'active';
  };

  // Categorize exams by status
  const activeExams = userExams?.filter(
    (exam) => !completedExamIds.has(exam.examId) && categorizeStatus(exam) === 'active'
  ) || [];
  
  const upcomingExams = userExams?.filter(
    (exam) => !completedExamIds.has(exam.examId) && categorizeStatus(exam) === 'upcoming'
  ) || [];
  
  const expiredExams = userExams?.filter(
    (exam) => !completedExamIds.has(exam.examId) && categorizeStatus(exam) === 'expired'
  ) || [];

  // Fetch leaderboard data - REMOVED (students shouldn't see other students' results)
  // Teachers can implement leaderboard functionality separately if needed

  // Calculate stats
  const totalExams = userExams?.length || 0;
  const completedExams = userResults?.data?.length || 0;
  const pendingExams = totalExams - completedExams;
  const averageScore = userResults?.data?.length > 0
    ? (userResults.data.reduce((sum, result) => sum + (result.totalMarks || 0), 0) / userResults.data.length).toFixed(1)
    : 0;

  // Generate performance data
  const generatePerformanceData = () => {
    if (!userResults?.data || userResults.data.length === 0) {
      return [];
    }
    
    // Sort by createdAt to get chronological order
    const sortedResults = [...userResults.data].sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    // Take last 6 results and match with exam names
    return sortedResults.slice(-6).map((result) => {
      // Find the exam name from userExams
      const exam = userExams?.find(e => e.examId === result.examId);
      return {
        exam: exam?.examName || result.examId || 'Exam',
        score: result.percentage || 0
      };
    });
  };

  const performanceData = generatePerformanceData();

  // Blue shades for bars
  const blueShades = ['#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8', '#1e40af', '#93c5fd'];

  // Get rank badge color
  const getRankColor = (rank, total) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 10) return '#fbbf24'; // Gold - Top 10%
    if (percentage <= 25) return '#94a3b8'; // Silver - Top 25%
    if (percentage <= 50) return '#cd7f32'; // Bronze - Top 50%
    return '#64748b'; // Default
  };

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
        <meta name="description" content="Student Dashboard" />
      </Helmet>

      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4, lg: 5 }, py: 4, backgroundColor: '#F8F9FB', minHeight: '100vh' }}>
        {/* Welcome Section */}
        <Paper 
          elevation={0}
          sx={{ 
            mb: 4, 
            p: 4,
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={examPhoto || undefined}
              sx={{
                width: 72,
                height: 72,
                bgcolor: '#003974',
                fontSize: '32px',
                fontWeight: 700,
                border: examPhoto ? '3px solid #16a34a' : 'none',
              }}
            >
              {!examPhoto && userInfo?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#0F2242', mb: 0.5, fontSize: '32px' }}>
                Welcome back, {userInfo?.name}!
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280', fontSize: '16px' }}>
                {isTeacher
                  ? "Manage your exams and track student performance"
                  : "Here's your learning progress overview"}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Charts Row - Only show for students */}
        {!isTeacher && (
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {/* Performance Chart */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F2242', mb: 3, fontSize: '20px' }}>
                  Recent Performance
                </Typography>
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECECEC" />
                      <XAxis dataKey="exam" tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fill: '#6B7280' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #ECECEC',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => [`${value}%`, 'Score']}
                      />
                      <Bar 
                        dataKey="score" 
                        radius={[8, 8, 0, 0]}
                        minPointSize={5}
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={blueShades[index % blueShades.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      No performance data yet. Take an exam to see your progress!
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Active Exams Section */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#003974',
                fontSize: '24px',
              }}
            >
              Active Exams
            </Typography>
            
            {isTeacher && (
              <FlowButton 
                text="Create Exam" 
                onClick={() => navigate('/create-exam')}
                startIcon={<AddIcon />}
              />
            )}
          </Box>

          {activeExams.length > 0 ? (
            <Grid container spacing={3}>
              {activeExams.map((exam, index) => (
                <Grid item xs={12} sm={6} md={4} key={exam._id}>
                  <ExamCard exam={exam} isCompleted={false} serialNumber={index + 1} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 5, borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 600 }}>
                No active exams at the moment
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 1 }}>
                {isTeacher ? 'Create your first exam to get started' : 'Check back later for new exams'}
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Upcoming Exams Section */}
        {upcomingExams.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#003974',
                mb: 3,
                fontSize: '24px',
              }}
            >
              Upcoming Exams
            </Typography>

            <Grid container spacing={3}>
              {upcomingExams.map((exam, index) => (
                <Grid item xs={12} sm={6} md={4} key={exam._id}>
                  <ExamCard exam={exam} isCompleted={false} status="upcoming" serialNumber={activeExams.length + index + 1} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Expired Exams Section */}
        {expiredExams.length > 0 && (
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
              Expired Exams
            </Typography>

            <Grid container spacing={3}>
              {expiredExams.map((exam, index) => (
                <Grid item xs={12} sm={6} md={4} key={exam._id}>
                  <ExamCard exam={exam} isCompleted={false} status="expired" serialNumber={activeExams.length + upcomingExams.length + index + 1} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </>
  );
};

export default Dashboard;
