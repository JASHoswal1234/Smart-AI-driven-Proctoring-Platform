import React from 'react';
import { Grid, Typography, Box, Paper, Avatar, Chip, Stack, Button } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetExamsQuery, useGetUserResultsQuery } from 'src/slices/examApiSlice';
import ExamCard from './Components/ExamCard';
import FlowButton from 'src/components/shared/FlowButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Add as AddIcon, CheckCircleOutline, AccessTimeOutlined, AssignmentOutlined, TrendingUpOutlined } from '@mui/icons-material';
import { Helmet } from 'react-helmet';

const StatChip = ({ icon: Icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: '#EEF3FB', borderRadius: '12px', px: 2.5, py: 1.5, minWidth: 110 }}>
    <Box sx={{ width: 34, height: 34, borderRadius: '9px', backgroundColor: '#003974', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon sx={{ color: '#fff', fontSize: 17 }} />
    </Box>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#003974', lineHeight: 1, fontSize: '1.15rem' }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{label}</Typography>
    </Box>
  </Box>
);

const SectionHeader = ({ title, action }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 4, height: 22, backgroundColor: '#003974', borderRadius: 2 }} />
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2242', fontSize: '1.1rem' }}>{title}</Typography>
    </Box>
    {action}
  </Box>
);

const Dashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const examPhoto = userInfo?._id ? localStorage.getItem(`examPhoto_${userInfo._id}`) : null;
  const { data: userExams } = useGetExamsQuery();
  const { data: userResults } = useGetUserResultsQuery();
  const navigate = useNavigate();
  const isTeacher = userInfo?.role === 'teacher';

  const completedExamIds = new Set(userResults?.data?.map((r) => r.examId) || []);

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

  const activeExams = userExams?.filter((e) => !completedExamIds.has(e.examId) && categorizeStatus(e) === 'active') || [];
  const upcomingExams = userExams?.filter((e) => !completedExamIds.has(e.examId) && categorizeStatus(e) === 'upcoming') || [];
  const expiredExams = userExams?.filter((e) => !completedExamIds.has(e.examId) && categorizeStatus(e) === 'expired') || [];

  const totalExams = userExams?.length || 0;
  const completedExams = userResults?.data?.length || 0;
  const averageScore = userResults?.data?.length > 0
    ? Math.round(userResults.data.reduce((s, r) => s + (r.percentage || 0), 0) / userResults.data.length)
    : 0;

  const performanceData = (() => {
    if (!userResults?.data?.length) return [];
    return [...userResults.data]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-6)
      .map((result) => ({
        exam: userExams?.find((e) => e.examId === result.examId)?.examName?.slice(0, 10) || 'Exam',
        score: result.percentage || 0,
      }));
  })();

  const blueShades = ['#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8', '#1e40af', '#93c5fd'];

  const EmptyState = ({ message, sub }) => (
    <Box sx={{ textAlign: 'center', py: 6, backgroundColor: '#fff', borderRadius: '16px', border: '1px dashed #e8eaf0' }}>
      <Typography variant="body1" sx={{ color: '#9CA3AF', fontWeight: 500 }}>{message}</Typography>
      {sub && <Typography variant="body2" sx={{ color: '#CBD5E1', mt: 0.5 }}>{sub}</Typography>}
    </Box>
  );

  return (
    <>
      <Helmet><title>Dashboard — ProctAI</title></Helmet>

      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 }, backgroundColor: '#F5F7FA', minHeight: '100vh' }}>

        {/* ── Hero / Welcome ── */}
        <Paper elevation={0} sx={{ mb: 4, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e8eaf0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {/* Top navy strip */}
          <Box sx={{ backgroundColor: '#003974', px: { xs: 3, md: 4 }, pt: 3, pb: 4 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  src={examPhoto || undefined}
                  sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.5rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.35)' }}
                >
                  {!examPhoto && userInfo?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: { xs: '1.25rem', md: '1.5rem' }, lineHeight: 1.2 }}>
                    Hello, {userInfo?.name?.split(' ')[0]}!
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>
                    {isTeacher ? 'Manage your exams and track performance' : 'Ready for your next challenge?'}
                  </Typography>
                </Box>
              </Stack>
              {isTeacher && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/create-exam')}
                  sx={{ backgroundColor: '#fff', color: '#003974', fontWeight: 700, borderRadius: '10px', textTransform: 'none', '&:hover': { backgroundColor: '#f0f4ff' }, flexShrink: 0 }}
                >
                  Create Exam
                </Button>
              )}
            </Stack>
          </Box>

          {/* Stats row */}
          <Box sx={{ px: { xs: 3, md: 4 }, py: 2.5, backgroundColor: '#fff' }}>
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: { xs: 1.5, md: 2 } }}>
              <StatChip icon={AssignmentOutlined} label="Total Exams" value={totalExams} />
              <StatChip icon={CheckCircleOutline} label="Completed" value={completedExams} />
              <StatChip icon={AccessTimeOutlined} label="Active Now" value={activeExams.length} />
              {!isTeacher && <StatChip icon={TrendingUpOutlined} label="Avg Score" value={`${averageScore}%`} />}
            </Stack>
          </Box>
        </Paper>

        {/* ── Performance Chart (students only) ── */}
        {!isTeacher && performanceData.length > 0 && (
          <Paper elevation={0} sx={{ mb: 4, p: { xs: 2.5, md: 3 }, borderRadius: '16px', border: '1px solid #e8eaf0', backgroundColor: '#fff' }}>
            <SectionHeader title="Recent Performance" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={performanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="exam" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e8eaf0', borderRadius: '10px', fontSize: '13px' }}
                  formatter={(v) => [`${v}%`, 'Score']}
                  cursor={{ fill: 'rgba(0,57,116,0.04)' }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {performanceData.map((_, i) => <Cell key={i} fill={blueShades[i % blueShades.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {/* ── Active Exams ── */}
        <Box sx={{ mb: 4 }}>
          <SectionHeader title={`Active Exams${activeExams.length ? ` (${activeExams.length})` : ''}`} />
          {activeExams.length > 0 ? (
            <Grid container spacing={2.5}>
              {activeExams.map((exam, i) => (
                <Grid item xs={12} sm={6} md={4} key={exam._id}>
                  <ExamCard exam={exam} isCompleted={false} status="active" serialNumber={i + 1} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <EmptyState
              message="No active exams right now"
              sub={isTeacher ? 'Create your first exam to get started' : 'Check back later for new exams'}
            />
          )}
        </Box>

        {/* ── Upcoming Exams ── */}
        {upcomingExams.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <SectionHeader title={`Upcoming (${upcomingExams.length})`} />
            <Grid container spacing={2.5}>
              {upcomingExams.map((exam, i) => (
                <Grid item xs={12} sm={6} md={4} key={exam._id}>
                  <ExamCard exam={exam} isCompleted={false} status="upcoming" serialNumber={activeExams.length + i + 1} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* ── Expired Exams ── */}
        {expiredExams.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <SectionHeader title={`Expired (${expiredExams.length})`} />
            <Grid container spacing={2.5}>
              {expiredExams.map((exam, i) => (
                <Grid item xs={12} sm={6} md={4} key={exam._id}>
                  <ExamCard exam={exam} isCompleted={false} status="expired" serialNumber={activeExams.length + upcomingExams.length + i + 1} />
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
