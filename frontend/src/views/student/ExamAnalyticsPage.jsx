import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import axiosInstance from '../../axios';
import { toast } from 'react-toastify';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ExamAnalyticsPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examData, setExamData] = useState(null);
  const [myResult, setMyResult] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Custom tooltip that only shows for bars with count > 0
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0].value > 0) {
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ECECEC',
            borderRadius: '8px',
            p: 1.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#003974' }}>
            {payload[0].payload.range}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Count: {payload[0].value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch exam details
        const examResponse = await axiosInstance.get('/api/users/exam', {
          withCredentials: true,
        });
        const exam = examResponse.data.find(e => e.examId === examId);
        setExamData(exam);

        // Fetch my result for this exam
        const myResultResponse = await axiosInstance.get('/api/users/results/user', {
          withCredentials: true,
        });
        const myExamResult = myResultResponse.data.data.find(r => r.examId === examId);
        setMyResult(myExamResult);

        if (!myExamResult) {
          setError('No result found for this exam');
          setLoading(false);
          return;
        }

        // Fetch analytics using the new student-accessible endpoint
        const analyticsResponse = await axiosInstance.get(`/api/users/results/analytics/${examId}`, {
          withCredentials: true,
        });
        
        const analyticsData = analyticsResponse.data.data;
        
        setAnalytics({
          rank: analyticsData.rank,
          totalStudents: analyticsData.totalStudents,
          percentile: analyticsData.percentile,
          average: analyticsData.average,
          highest: analyticsData.highest,
          lowest: analyticsData.lowest,
          distribution: analyticsData.distribution,
        });

      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch analytics');
        toast.error('Failed to load exam analytics');
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchAnalytics();
    }
  }, [examId]);

  const getPerformanceBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', color: '#4CAF50' };
    if (score >= 75) return { label: 'Good', color: '#003974' };
    if (score >= 60) return { label: 'Average', color: '#FFC107' };
    return { label: 'Needs Improvement', color: '#ED1C24' };
  };

  if (loading) {
    return (
      <PageContainer title="Exam Analytics" description="Detailed exam analytics">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress sx={{ color: '#003974' }} />
        </Box>
      </PageContainer>
    );
  }

  if (error || !myResult) {
    return (
      <PageContainer title="Exam Analytics" description="Detailed exam analytics">
        <Box p={3}>
          <Alert severity="error">
            {error || 'No result found for this exam'}
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  const performanceBadge = getPerformanceBadge(myResult.percentage || 0);

  return (
    <PageContainer title="Exam Analytics" description="Detailed exam analytics">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate('/exam')}
            sx={{ 
              color: '#003974',
              '&:hover': { backgroundColor: '#F0F7FF' }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ color: '#003974', fontWeight: 600 }}>
              {examData?.examName || 'Exam Analytics'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
              Detailed performance analysis and peer comparison
            </Typography>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid #ECECEC', borderRadius: '12px', borderLeft: '4px solid #003974' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 1 }}>
                  Your Score
                </Typography>
                <Typography variant="h3" sx={{ color: '#003974', fontWeight: 700 }}>
                  {myResult.percentage?.toFixed(1)}%
                </Typography>
                <Chip 
                  label={performanceBadge.label}
                  size="small"
                  sx={{ 
                    mt: 1, 
                    backgroundColor: `${performanceBadge.color}20`,
                    color: performanceBadge.color,
                    fontWeight: 600
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid #ECECEC', borderRadius: '12px', borderLeft: '4px solid #ED1C24' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 1 }}>
                  Your Rank
                </Typography>
                <Typography variant="h3" sx={{ color: '#ED1C24', fontWeight: 700 }}>
                  #{analytics?.rank}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', mt: 1 }}>
                  out of {analytics?.totalStudents} students
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid #ECECEC', borderRadius: '12px', borderLeft: '4px solid #4CAF50' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 1 }}>
                  Percentile
                </Typography>
                <Typography variant="h3" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                  {analytics?.percentile}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', mt: 1 }}>
                  Better than {analytics?.percentile}% students
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid #ECECEC', borderRadius: '12px', borderLeft: '4px solid #FFC107' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 1 }}>
                  Class Average
                </Typography>
                <Typography variant="h3" sx={{ color: '#FFC107', fontWeight: 700 }}>
                  {analytics?.average}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', mt: 1 }}>
                  {myResult.percentage > parseFloat(analytics?.average) ? 'Above' : 'Below'} average
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Score Distribution */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ border: '1px solid #ECECEC', borderRadius: '12px', p: 3 }}>
              <Typography variant="h6" sx={{ color: '#003974', fontWeight: 600, mb: 3 }}>
                Score Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECECEC" />
                  <XAxis dataKey="range" stroke="#6B7280" />
                  <YAxis 
                    stroke="#6B7280" 
                    domain={[0, 'dataMax + 1']}
                    allowDecimals={false}
                    label={{ 
                      value: 'Number of Students', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: 10,
                      style: { 
                        fill: '#6B7280',
                        textAnchor: 'middle'
                      } 
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar 
                    dataKey="count" 
                    fill="#003974" 
                    radius={[8, 8, 0, 0]}
                    minPointSize={5}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Performance Comparison */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: '1px solid #ECECEC', borderRadius: '12px', p: 3 }}>
              <Typography variant="h6" sx={{ color: '#003974', fontWeight: 600, mb: 3 }}>
                Performance Comparison
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Highest Score</Typography>
                  <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                    {analytics?.highest?.toFixed(1)}%
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Your Score</Typography>
                  <Typography variant="h6" sx={{ color: '#003974', fontWeight: 600 }}>
                    {myResult.percentage?.toFixed(1)}%
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Class Average</Typography>
                  <Typography variant="h6" sx={{ color: '#FFC107', fontWeight: 600 }}>
                    {analytics?.average}%
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Lowest Score</Typography>
                  <Typography variant="h6" sx={{ color: '#ED1C24', fontWeight: 600 }}>
                    {analytics?.lowest?.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default ExamAnalyticsPage;
