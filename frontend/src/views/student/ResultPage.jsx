import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import { Code, Visibility, VisibilityOff, Search, CheckCircle, Download, PictureAsPdf, TrendingUp, Assessment } from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import axiosInstance from '../../axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const COLORS = ['#003974', '#ED1C24', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ResultPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedResult, setSelectedResult] = useState(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [exams, setExams] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all exams first
        const examsResponse = await axiosInstance.get('/api/users/exam', {
          withCredentials: true,
        });
        setExams(examsResponse.data);

        // Check if examId is in URL query parameters
        const examIdFromUrl = searchParams.get('examId');
        
        if (examIdFromUrl) {
          // Set the selected exam from URL
          setSelectedExam(examIdFromUrl);
          // Fetch results for specific exam
          const resultsResponse = await axiosInstance.get(`/api/users/results/exam/${examIdFromUrl}`, {
            withCredentials: true,
          });
          setResults(resultsResponse.data.data);
        } else {
          // Fetch results based on user role
          if (userInfo?.role === 'teacher') {
            // For teachers, fetch all results
            const resultsResponse = await axiosInstance.get('/api/users/results/all', {
              withCredentials: true,
            });
            setResults(resultsResponse.data.data);
          } else {
            // For students, fetch only their visible results
            const resultsResponse = await axiosInstance.get('/api/users/results/user', {
              withCredentials: true,
            });
            setResults(resultsResponse.data.data);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userInfo, searchParams]);

  const handleToggleVisibility = async (resultId) => {
    try {
      await axiosInstance.put(
        `/api/users/results/${resultId}/toggle-visibility`,
        {},
        {
          withCredentials: true,
        },
      );
      toast.success('Visibility updated successfully');
      // Refresh results
      const response = await axiosInstance.get('/api/users/results/all', {
        withCredentials: true,
      });
      setResults(response.data.data);
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const handleViewCode = (result) => {
    setSelectedResult(result);
    setCodeDialogOpen(true);
  };

  const handleExamChange = async (examId) => {
    setSelectedExam(examId);
    
    if (examId === 'all') {
      // Fetch all results
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/users/results/all', {
          withCredentials: true,
        });
        setResults(response.data.data);
      } catch (err) {
        toast.error('Failed to fetch all results');
      } finally {
        setLoading(false);
      }
    } else {
      // Fetch results for specific exam
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/users/results/exam/${examId}`, {
          withCredentials: true,
        });
        setResults(response.data.data);
      } catch (err) {
        toast.error('Failed to fetch exam results');
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadCSV = () => {
    const headers = ['Student Name', 'Email', 'Exam', 'Total Score (%)', 'Total Marks', 'Coding Submissions', 'Submission Date'];
    const csvData = filteredResults.map(result => [
      result.userId?.name || '',
      result.userId?.email || '',
      exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || result.examId,
      result.percentage.toFixed(1),
      result.totalMarks,
      result.codingSubmissions?.length || 0,
      new Date(result.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `exam_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded successfully');
  };

  const downloadPDF = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    const examName = selectedExam === 'all' ? 'All Exams' : exams.find((e) => e._id === selectedExam || e.examId === selectedExam)?.examName || 'Exam';
    
    printWindow.document.write('<html><head><title>Exam Results</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
    printWindow.document.write('h1 { color: #333; text-align: center; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }');
    printWindow.document.write('th { background-color: #003974; color: white; }');
    printWindow.document.write('tr:nth-child(even) { background-color: #F8F9FB; }');
    printWindow.document.write('.summary { display: flex; justify-content: space-around; margin: 20px 0; }');
    printWindow.document.write('.summary-card { text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px; }');
    printWindow.document.write('.summary-card h3 { margin: 0; color: #666; font-size: 14px; }');
    printWindow.document.write('.summary-card p { margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #333; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(`<h1>Exam Results - ${examName}</h1>`);
    printWindow.document.write('<div class="summary">');
    printWindow.document.write(`<div class="summary-card"><h3>Total Students</h3><p>${filteredResults.length}</p></div>`);
    printWindow.document.write(`<div class="summary-card"><h3>Average Score</h3><p>${filteredResults.length > 0 ? (filteredResults.reduce((acc, curr) => acc + curr.percentage, 0) / filteredResults.length).toFixed(1) : 0}%</p></div>`);
    printWindow.document.write(`<div class="summary-card"><h3>Total Submissions</h3><p>${filteredResults.reduce((acc, curr) => acc + (curr.codingSubmissions?.length || 0), 0)}</p></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('<table>');
    printWindow.document.write('<thead><tr><th>Student Name</th><th>Email</th><th>Exam</th><th>Score (%)</th><th>Total Marks</th><th>Coding Submissions</th><th>Date</th></tr></thead>');
    printWindow.document.write('<tbody>');
    
    filteredResults.forEach(result => {
      printWindow.document.write('<tr>');
      printWindow.document.write(`<td>${result.userId?.name || ''}</td>`);
      printWindow.document.write(`<td>${result.userId?.email || ''}</td>`);
      printWindow.document.write(`<td>${exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || result.examId}</td>`);
      printWindow.document.write(`<td>${result.percentage.toFixed(1)}%</td>`);
      printWindow.document.write(`<td>${result.totalMarks}</td>`);
      printWindow.document.write(`<td>${result.codingSubmissions?.length || 0}</td>`);
      printWindow.document.write(`<td>${new Date(result.createdAt).toLocaleDateString()}</td>`);
      printWindow.document.write('</tr>');
    });
    
    printWindow.document.write('</tbody></table>');
    printWindow.document.write(`<p style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      toast.success('PDF generation initiated');
    }, 250);
  };

  const filteredResults = results.filter((result) => {
    // Search filter - if no search term, include all
    const matchesSearch = !searchTerm || 
      result.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Tab filter
    let matchesTab = true;
    if (selectedTab === 1) {
      // MCQ Results - show only results without coding submissions or with empty coding submissions
      matchesTab = !result.codingSubmissions || result.codingSubmissions.length === 0;
    }
    
    return matchesSearch && matchesTab;
  });

  // Analytics Calculations
  const getScoreDistribution = () => {
    if (!filteredResults || filteredResults.length === 0) {
      return [
        { name: '0-20%', count: 0 },
        { name: '21-40%', count: 0 },
        { name: '41-60%', count: 0 },
        { name: '61-80%', count: 0 },
        { name: '81-100%', count: 0 },
      ];
    }

    const ranges = [
      { name: '0-20%', min: 0, max: 20, count: 0 },
      { name: '21-40%', min: 21, max: 40, count: 0 },
      { name: '41-60%', min: 41, max: 60, count: 0 },
      { name: '61-80%', min: 61, max: 80, count: 0 },
      { name: '81-100%', min: 81, max: 100, count: 0 },
    ];

    filteredResults.forEach((result) => {
      const percentage = result.percentage || 0;
      const range = ranges.find((r) => percentage >= r.min && percentage <= r.max);
      if (range) range.count++;
    });

    return ranges.map(r => ({ name: r.name, count: r.count }));
  };

  const getDetailedScoreAnalysis = () => {
    if (!filteredResults || filteredResults.length === 0) return [];

    return filteredResults.map((result, index) => {
      const fullName = exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || `Exam ${index + 1}`;
      
      return {
        exam: `T${index + 1}`,
        fullExam: fullName,
        score: parseFloat((result.percentage || 0).toFixed(1)),
        totalMarks: result.totalMarks || 0,
        date: new Date(result.createdAt).toLocaleDateString(),
      };
    });
  };

  const getSubjectiveVsCodingPerformance = () => {
    if (!filteredResults || filteredResults.length === 0) return [];

    return filteredResults.map((result, index) => {
      const subjectiveScore = result.subjectiveResponses?.length > 0
        ? (result.subjectiveResponses.reduce((sum, sr) => sum + sr.aiScore, 0) / 
           result.subjectiveResponses.reduce((sum, sr) => sum + sr.maxMarks, 0)) * 100
        : 0;
      
      const codingScore = result.codingSubmissions?.length > 0 ? 80 : 0; // Assuming coding is pass/fail

      return {
        exam: `Exam ${index + 1}`,
        subjective: parseFloat(subjectiveScore.toFixed(1)),
        coding: codingScore,
        overall: parseFloat((result.percentage || 0).toFixed(1)),
      };
    });
  };

  const getProgressOverTime = () => {
    if (!filteredResults || filteredResults.length === 0) return [];

    const sortedResults = [...filteredResults].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    let cumulativeScore = 0;
    return sortedResults.map((result, index) => {
      cumulativeScore += result.percentage || 0;
      const avgScore = cumulativeScore / (index + 1);
      
      return {
        exam: `Exam ${index + 1}`,
        currentScore: parseFloat((result.percentage || 0).toFixed(1)),
        averageScore: parseFloat(avgScore.toFixed(1)),
        date: new Date(result.createdAt).toLocaleDateString(),
      };
    });
  };

  const getGradeDistribution = () => {
    if (!filteredResults || filteredResults.length === 0) return [];

    const grades = [
      { name: 'A+ (90-100%)', min: 90, max: 100, count: 0, color: '#003974' },
      { name: 'A (80-89%)', min: 80, max: 89, count: 0, color: '#0088FE' },
      { name: 'B (70-79%)', min: 70, max: 79, count: 0, color: '#00C49F' },
      { name: 'C (60-69%)', min: 60, max: 69, count: 0, color: '#FFBB28' },
      { name: 'D (40-59%)', min: 40, max: 59, count: 0, color: '#FF8042' },
      { name: 'F (<40%)', min: 0, max: 39, count: 0, color: '#ED1C24' },
    ];

    filteredResults.forEach((result) => {
      const percentage = result.percentage || 0;
      const grade = grades.find((g) => percentage >= g.min && percentage <= g.max);
      if (grade) grade.count++;
    });

    return grades.filter(g => g.count > 0);
  };

  const getPerformanceTrend = () => {
    if (!filteredResults || filteredResults.length === 0) return [];

    const sortedResults = [...filteredResults].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    return sortedResults.map((result, index) => ({
      exam: `Exam ${index + 1}`,
      score: parseFloat((result.percentage || 0).toFixed(1)),
      date: new Date(result.createdAt).toLocaleDateString(),
    }));
  };

  const getExamWisePerformance = () => {
    if (!filteredResults || filteredResults.length === 0) return [];

    const examStats = {};

    filteredResults.forEach((result) => {
      const examName = exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || 'Unknown';
      
      if (!examStats[examName]) {
        examStats[examName] = {
          name: examName,
          totalScore: 0,
          count: 0,
        };
      }

      examStats[examName].totalScore += (result.percentage || 0);
      examStats[examName].count++;
    });

    return Object.values(examStats).map((stat) => ({
      name: stat.name,
      avgScore: parseFloat((stat.totalScore / stat.count).toFixed(1)),
      students: stat.count,
    }));
  };

  const getTopPerformers = () => {
    if (!filteredResults || filteredResults.length === 0) return [];

    return [...filteredResults]
      .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
      .slice(0, 5)
      .map((result, index) => ({
        rank: index + 1,
        name: result.userId?.name || 'Unknown',
        score: (result.percentage || 0).toFixed(1),
        exam: exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || 'Unknown',
      }));
  };

  const getPerformanceMetrics = () => {
    if (!filteredResults || filteredResults.length === 0) {
      return [
        { metric: 'Average', value: 0 },
        { metric: 'Highest', value: 0 },
        { metric: 'Lowest', value: 0 },
        { metric: 'Pass Rate', value: 0 },
      ];
    }

    const scores = filteredResults.map((r) => r.percentage || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const passRate = (filteredResults.filter((r) => (r.percentage || 0) >= 40).length / filteredResults.length) * 100;

    return [
      { metric: 'Average', value: parseFloat(avgScore.toFixed(1)) },
      { metric: 'Highest', value: parseFloat(maxScore.toFixed(1)) },
      { metric: 'Lowest', value: parseFloat(minScore.toFixed(1)) },
      { metric: 'Pass Rate', value: parseFloat(passRate.toFixed(1)) },
    ];
  };

  // Debug: Log analytics data
  useEffect(() => {
    if (showAnalytics) {
      console.log('=== ANALYTICS DEBUG ===');
      console.log('Raw Results from API:', results);
      console.log('Raw Results Length:', results.length);
      console.log('First Result Sample:', results[0]);
      console.log('Search Term:', searchTerm);
      console.log('Selected Tab:', selectedTab);
      console.log('Filtered Results:', filteredResults);
      console.log('Filtered Results Length:', filteredResults.length);
      console.log('User Info:', userInfo);
      
      if (filteredResults.length > 0) {
        console.log('Score Distribution:', getScoreDistribution());
        console.log('Performance Trend:', getPerformanceTrend());
        console.log('Exam Wise Performance:', getExamWisePerformance());
        console.log('Top Performers:', getTopPerformers());
        console.log('Performance Metrics:', getPerformanceMetrics());
      } else {
        console.log('No results data available for analytics');
        console.log('Possible reasons:');
        console.log('1. Results not fetched from API (check network tab)');
        console.log('2. Results filtered out by search or tab selection');
        console.log('3. Results not visible to current user role');
      }
      console.log('=== END DEBUG ===');
    }
  }, [showAnalytics, filteredResults, results]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Student View
  if (userInfo?.role === 'student') {
    return (
      <PageContainer title="My Exam Results" description="View your exam results">
        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {/* Summary Cards - Stack on mobile, row on desktop */}
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '1rem' }, mb: 1 }} gutterBottom>
                    Total Exams
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                    {results.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '1rem' }, mb: 1 }} gutterBottom>
                    Avg Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                    {results.length > 0
                      ? `${(
                          results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length
                        ).toFixed(1)}%`
                      : '0%'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '1rem' }, mb: 1 }} gutterBottom>
                    Highest
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                    {results.length > 0
                      ? `${Math.max(...results.map((r) => r.percentage)).toFixed(1)}%`
                      : '0%'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '1rem' }, mb: 1 }} gutterBottom>
                    Attempts
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                    {results.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Analytics Toggle */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => setShowAnalytics(!showAnalytics)}
                fullWidth
                sx={{
                  borderColor: '#003974',
                  color: '#003974',
                  fontWeight: 600,
                  py: { xs: 1, md: 1.5 },
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  '&:hover': {
                    backgroundColor: '#003974',
                    color: '#FFFFFF',
                    borderColor: '#003974',
                  },
                }}
              >
                {showAnalytics ? 'Hide Analytics' : 'Show Detailed Analytics'}
              </Button>
            </Grid>

          {/* Analytics Section */}
          {showAnalytics && (
            <>
              {results.length === 0 ? (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No exam results available yet. Take some exams to see your analytics!
                  </Alert>
                </Grid>
              ) : (
                <>
                  {/* Detailed Score Analysis - Full width on mobile */}
                  <Grid item xs={12} md={6}>
                    <DashboardCard title="Score Breakdown by Exam">
                      <ResponsiveContainer width="100%" height={{ xs: 250, md: 320 }}>
                        <BarChart 
                          data={getDetailedScoreAnalysis()} 
                          margin={{ top: 20, right: { xs: 10, md: 20 }, left: { xs: 10, md: 20 }, bottom: 35 }}
                          barSize={getDetailedScoreAnalysis().length === 1 ? 60 : undefined}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="exam" 
                            tick={{ fontSize: { xs: 10, md: 12 } }}
                            height={50}
                            label={{ value: 'Tests', position: 'insideBottom', offset: -5, style: { fontSize: { xs: 11, md: 13 }, fill: '#6B7280', fontWeight: 600 } }}
                          />
                          <YAxis domain={[0, 100]} label={{ value: 'Score %', angle: -90, position: 'insideLeft' }} tick={{ fontSize: { xs: 10, md: 12 } }} />
                          <Tooltip 
                            formatter={(value, name, props) => {
                              if (name === 'Score %') return [`${value}%`, name];
                              return [value, name];
                            }}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                return payload[0].payload.fullExam || label;
                              }
                              return label;
                            }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: { xs: '0.75rem', md: '0.875rem' } }} align="left" />
                          <Bar dataKey="score" fill="#003974" name="Score %" radius={[8, 8, 0, 0]} minPointSize={5} maxBarSize={80} />
                        </BarChart>
                      </ResponsiveContainer>
                    </DashboardCard>
                  </Grid>

                  {/* Grade Distribution Pie - Full width on mobile */}
                  <Grid item xs={12} md={6}>
                    <DashboardCard title="Grade Distribution">
                      <ResponsiveContainer width="100%" height={{ xs: 250, md: 320 }}>
                        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                          <Pie
                            data={getGradeDistribution()}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, count }) => `${name}: ${count}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {getGradeDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend align="left" />
                        </PieChart>
                      </ResponsiveContainer>
                    </DashboardCard>
                  </Grid>

                  {/* Progress Over Time */}
                  <Grid item xs={12}>
                    <DashboardCard title="Performance Progress Over Time">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getProgressOverTime()} margin={{ top: 20, right: 20, bottom: 5, left: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="exam" />
                          <YAxis domain={[0, 100]} label={{ value: 'Score %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="currentScore" 
                            stroke="#003974" 
                            strokeWidth={3} 
                            name="Current Score" 
                            dot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="averageScore" 
                            stroke="#ED1C24" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            name="Running Average" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </DashboardCard>
                  </Grid>
                </>
              )}
            </>
          )}

          {/* Results Table - Desktop View */}
          <Grid item xs={12} sx={{ display: { xs: 'none', md: 'block' } }}>
            <DashboardCard title="My Results">
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam Name</TableCell>
                      <TableCell>Total Score</TableCell>
                      <TableCell>Subjective Score</TableCell>
                      <TableCell>Coding Submissions</TableCell>
                      <TableCell>Total Score</TableCell>
                      <TableCell>Submission Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result._id}>
                        <TableCell>
  {exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || 'Exam'}
</TableCell>
                        <TableCell>
                          <Chip
                            label={`${result.percentage.toFixed(1)}%`}
                            sx={{
                              backgroundColor: result.percentage >= 70 ? '#DCFCE7' : result.percentage >= 40 ? '#FEF3C7' : '#FEE2E2',
                              color: result.percentage >= 70 ? '#166534' : result.percentage >= 40 ? '#92400E' : '#991B1B',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {result.subjectiveResponses?.length > 0 ? (
                            <Chip
                              label={`${result.subjectiveResponses.reduce((sum, sr) => sum + sr.aiScore, 0)}/${result.subjectiveResponses.reduce((sum, sr) => sum + sr.maxMarks, 0)}`}
                              sx={{
                                backgroundColor: '#E0F2FE',
                                color: '#003974',
                                fontWeight: 600,
                              }}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {result.codingSubmissions?.length > 0 && (
                              <CheckCircle color="success" fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            Total: {result.totalMarks}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(result.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {(result.codingSubmissions?.length > 0 || result.subjectiveResponses?.length > 0) && (
                            <IconButton onClick={() => handleViewCode(result)}>
                              <Code />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DashboardCard>
          </Grid>

          {/* Results Cards - Mobile View */}
          <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
            <DashboardCard title="My Results">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {results.map((result) => (
                  <Card key={result._id} sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ p: 2 }}>
                      {/* Exam Name */}
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                        {exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || 'Exam'}
                      </Typography>

                      {/* Score Badge */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="body2" color="textSecondary">Score</Typography>
                        <Chip
                          label={`${result.percentage.toFixed(1)}%`}
                          sx={{
                            backgroundColor: result.percentage >= 70 ? '#DCFCE7' : result.percentage >= 40 ? '#FEF3C7' : '#FEE2E2',
                            color: result.percentage >= 70 ? '#166534' : result.percentage >= 40 ? '#92400E' : '#991B1B',
                            fontWeight: 600,
                          }}
                        />
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      {/* Details Grid */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Subjective Score */}
                        {result.subjectiveResponses?.length > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="textSecondary">Subjective</Typography>
                            <Chip
                              size="small"
                              label={`${result.subjectiveResponses.reduce((sum, sr) => sum + sr.aiScore, 0)}/${result.subjectiveResponses.reduce((sum, sr) => sum + sr.maxMarks, 0)}`}
                              sx={{
                                backgroundColor: '#E0F2FE',
                                color: '#003974',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        )}

                        {/* Coding Submission */}
                        {result.codingSubmissions?.length > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="textSecondary">Coding</Typography>
                            <CheckCircle color="success" fontSize="small" />
                          </Box>
                        )}

                        {/* Total Marks */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="textSecondary">Total Marks</Typography>
                          <Typography variant="body2" fontWeight="600">{result.totalMarks}</Typography>
                        </Box>

                        {/* Date */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="textSecondary">Date</Typography>
                          <Typography variant="body2">{new Date(result.createdAt).toLocaleDateString()}</Typography>
                        </Box>
                      </Box>

                      {/* Action Button */}
                      {(result.codingSubmissions?.length > 0 || result.subjectiveResponses?.length > 0) && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Code />}
                            onClick={() => handleViewCode(result)}
                            fullWidth
                            sx={{
                              borderColor: '#003974',
                              color: '#003974',
                              fontWeight: 600,
                              '&:hover': {
                                backgroundColor: '#003974',
                                color: '#FFFFFF',
                              },
                            }}
                          >
                            View Submissions
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </DashboardCard>
          </Grid>
        </Grid>
        </Box>

        {/* Code View Dialog */}
        <Dialog
          open={codeDialogOpen}
          onClose={() => setCodeDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={window.innerWidth < 600}
          PaperProps={{
            sx: {
              m: { xs: 0, sm: 2 },
              maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            My Submissions
            <IconButton
              aria-label="close"
              onClick={() => setCodeDialogOpen(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <Code />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            {selectedResult?.subjectiveResponses?.length > 0 && (
              <>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, mt: 2 }} gutterBottom>
                  AI-Graded Subjective Answers
                </Typography>
                {selectedResult.subjectiveResponses.map((response, index) => (
                  <Box key={index} mb={3} p={2} sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} gutterBottom>
                      Question {index + 1}: {response.question}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Your Answer:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, mb: 2, wordBreak: 'break-word' }}>
                      {response.studentAnswer}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="flex-start" flexDirection={{ xs: 'column', sm: 'row' }}>
                      <Chip
                        label={`Score: ${response.aiScore}/${response.maxMarks}`}
                        sx={{
                          backgroundColor: response.aiScore >= response.maxMarks * 0.7 ? '#DCFCE7' : '#FEF3C7',
                          color: response.aiScore >= response.maxMarks * 0.7 ? '#166534' : '#92400E',
                          fontWeight: 600,
                        }}
                      />
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Feedback: {response.aiFeedback}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </>
            )}
            {selectedResult?.codingSubmissions?.map((submission, index) => (
              <Box key={index} mb={3}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} gutterBottom>
                  Coding Question {index + 1}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Language: {submission.language}
                </Typography>
                <Box sx={{ 
                  maxWidth: '100%', 
                  overflow: 'auto',
                  '& pre': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    margin: 0,
                  }
                }}>
                  <SyntaxHighlighter language={submission.language} style={docco}>
                    {submission.code}
                  </SyntaxHighlighter>
                </Box>
                <Box mt={1} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<CheckCircle />} 
                    label="Success" 
                    size={window.innerWidth < 600 ? 'small' : 'medium'}
                    sx={{
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      fontWeight: 600,
                      '& .MuiChip-icon': {
                        color: '#166534',
                      }
                    }}
                  />
                  {submission.executionTime && (
                    <Chip 
                      label={`Execution Time: ${submission.executionTime}ms`} 
                      size={window.innerWidth < 600 ? 'small' : 'medium'}
                      sx={{ 
                        backgroundColor: '#E0F2FE',
                        color: '#003974',
                        fontWeight: 600,
                      }} 
                    />
                  )}
                </Box>
              </Box>
            ))}
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
            <Button onClick={() => setCodeDialogOpen(false)} fullWidth={window.innerWidth < 600}>Close</Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    );
  }

  // Teacher View
  return (
    <PageContainer title="Results Dashboard" description="View and manage exam results">
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #003974' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' }, mb: { xs: 0.5, md: 1 } }} gutterBottom sx={{ color: '#6B7280', fontWeight: 600 }}>
                Students
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, color: '#003974', fontWeight: 700 }}>{filteredResults.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #003974' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' }, mb: { xs: 0.5, md: 1 } }} gutterBottom sx={{ color: '#6B7280', fontWeight: 600 }}>
                Avg Score
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, color: '#003974', fontWeight: 700 }}>
                {filteredResults.length > 0
                  ? `${(
                      filteredResults.reduce((acc, curr) => acc + curr.percentage, 0) /
                      filteredResults.length
                    ).toFixed(1)}%`
                  : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #003974' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' }, mb: { xs: 0.5, md: 1 } }} gutterBottom sx={{ color: '#6B7280', fontWeight: 600 }}>
                Pass Rate
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, color: '#003974', fontWeight: 700 }}>
                {filteredResults.length > 0
                  ? `${((filteredResults.filter((r) => r.percentage >= 40).length / filteredResults.length) * 100).toFixed(1)}%`
                  : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #003974' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' }, mb: { xs: 0.5, md: 1 } }} gutterBottom sx={{ color: '#6B7280', fontWeight: 600 }}>
                Results
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, color: '#003974', fontWeight: 700 }}>
                {filteredResults.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Toggle */}
        <Grid item xs={12}>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => setShowAnalytics(!showAnalytics)}
            fullWidth
            sx={{
              borderColor: '#003974',
              color: '#003974',
              fontWeight: 600,
              py: { xs: 1, md: 1.5 },
              fontSize: { xs: '0.875rem', md: '1rem' },
              '&:hover': {
                backgroundColor: '#003974',
                color: '#FFFFFF',
                borderColor: '#003974',
              },
            }}
          >
            {showAnalytics ? 'Hide Analytics' : 'Show Detailed Analytics'}
          </Button>
        </Grid>

        {/* Analytics Section */}
        {showAnalytics && (
          <>
            {filteredResults.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">
                  No exam results available for the selected filters. Students need to complete exams first!
                </Alert>
              </Grid>
            ) : (
              <>
                {/* Detailed Score Analysis */}
                <Grid item xs={12} md={8}>
                  <DashboardCard title="Student Performance Comparison">
                    <ResponsiveContainer width="100%" height={{ xs: 250, md: 350 }}>
                      <BarChart data={getDetailedScoreAnalysis()} margin={{ top: 20, right: { xs: 10, md: 20 }, left: { xs: 10, md: 20 }, bottom: { xs: 20, md: 5 } }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="exam" 
                          angle={0} 
                          textAnchor="middle" 
                          height={{ xs: 50, md: 60 }}
                          interval={0}
                          tick={{ fontSize: { xs: 9, md: 11 } }}
                        />
                        <YAxis domain={[0, 100]} label={{ value: 'Score %', angle: -90, position: 'insideLeft', style: { fontSize: { xs: 10, md: 12 } } }} tick={{ fontSize: { xs: 10, md: 12 } }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }} />
                        <Bar dataKey="score" fill="#003974" name="Score %" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                </Grid>

                {/* Grade Distribution */}
                <Grid item xs={12} md={4}>
                  <DashboardCard title="Grade Distribution">
                    <ResponsiveContainer width="100%" height={{ xs: 250, md: 350 }}>
                      <PieChart>
                        <Pie
                          data={getGradeDistribution()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, count }) => `${name.split(' ')[0]}: ${count}`}
                          outerRadius={{ xs: 80, md: 100 }}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {getGradeDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                </Grid>

                {/* Performance Metrics Radar */}
                <Grid item xs={12} md={6}>
                  <DashboardCard title="Performance Metrics">
                    <ResponsiveContainer width="100%" height={{ xs: 250, md: 300 }}>
                      <RadarChart data={getPerformanceMetrics()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: { xs: 10, md: 12 } }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: { xs: 10, md: 12 } }} />
                        <Radar name="Performance" dataKey="value" stroke="#003974" fill="#003974" fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                </Grid>

                {/* Exam-wise Performance */}
                <Grid item xs={12} md={6}>
                  <DashboardCard title="Exam-wise Average Performance">
                    <ResponsiveContainer width="100%" height={{ xs: 250, md: 300 }}>
                      <BarChart data={getExamWisePerformance()} margin={{ top: 20, right: { xs: 10, md: 20 }, left: { xs: 10, md: 20 }, bottom: { xs: 20, md: 5 } }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={0} 
                          textAnchor="middle" 
                          height={{ xs: 50, md: 60 }}
                          interval={0}
                          tick={{ fontSize: { xs: 9, md: 11 } }}
                        />
                        <YAxis domain={[0, 100]} label={{ value: 'Avg Score %', angle: -90, position: 'insideLeft', style: { fontSize: { xs: 10, md: 12 } } }} tick={{ fontSize: { xs: 10, md: 12 } }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }} />
                        <Bar dataKey="avgScore" fill="#003974" name="Average Score %" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                </Grid>

                {/* Top Performers */}
                <Grid item xs={12} md={6}>
                  <DashboardCard title="Top 5 Performers">
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Rank</TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Name</TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Exam</TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getTopPerformers().map((performer) => (
                            <TableRow key={performer.rank}>
                              <TableCell>
                                <Chip
                                  label={`#${performer.rank}`}
                                  sx={{
                                    backgroundColor: performer.rank === 1 ? '#DCFCE7' : performer.rank === 2 ? '#E0F2FE' : '#F8F9FB',
                                    color: performer.rank === 1 ? '#166534' : performer.rank === 2 ? '#003974' : '#6B7280',
                                    fontWeight: 600,
                                  }}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}><strong>{performer.name}</strong></TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{performer.exam}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${performer.score}%`} 
                                  sx={{
                                    backgroundColor: '#E0F2FE',
                                    color: '#003974',
                                    fontWeight: 600,
                                  }}
                                  size="small" 
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </DashboardCard>
                </Grid>

                {/* Pass/Fail Distribution */}
                <Grid item xs={12} md={6}>
                  <DashboardCard title="Pass/Fail Distribution">
                    <ResponsiveContainer width="100%" height={{ xs: 250, md: 300 }}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pass (≥40%)', value: filteredResults.filter((r) => r.percentage >= 40).length },
                            { name: 'Fail (<40%)', value: filteredResults.filter((r) => r.percentage < 40).length },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={{ xs: 80, md: 100 }}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[0, 1].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#003974' : '#ED1C24'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                </Grid>
              </>
            )}
          </>
        )}

        {/* Results Table - Desktop View */}
        <Grid item xs={12} sx={{ display: { xs: 'none', md: 'block' } }}>
          <DashboardCard title="Exam Results">
            {/* Exam Filter and Search */}
            <Box mb={3} display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Select Exam</InputLabel>
                <Select
                  value={selectedExam}
                  onChange={(e) => handleExamChange(e.target.value)}
                  label="Select Exam"
                >
                  <MenuItem value="all">All Exams</MenuItem>
                  {exams.map((exam) => (
                    <MenuItem key={exam.examId} value={exam.examId}>
                      {exam.examName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Search Students"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={downloadCSV}
                  disabled={filteredResults.length === 0}
                  sx={{
                    borderColor: '#003974',
                    color: '#003974',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#003974',
                      color: '#FFFFFF',
                      borderColor: '#003974',
                    },
                  }}
                >
                  Download CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={downloadPDF}
                  disabled={filteredResults.length === 0}
                  sx={{
                    borderColor: '#ED1C24',
                    color: '#ED1C24',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#ED1C24',
                      color: '#FFFFFF',
                      borderColor: '#ED1C24',
                    },
                  }}
                >
                  Download PDF
                </Button>
              </Box>
            </Box>

            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              sx={{ 
                mb: 2,
                '& .MuiTab-root': {
                  color: '#6B7280',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '15px',
                },
                '& .Mui-selected': {
                  color: '#003974',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#ED1C24',
                  height: '3px',
                },
              }}
            >
              <Tab label="All Results" />
              <Tab label="MCQ Results" />
            </Tabs>

            <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F8F9FB' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#0F2242' }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F2242' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F2242' }}>Exam</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F2242' }}>Total Score</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F2242' }}>Coding Submissions</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F2242' }}>Total Score</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F2242' }}>Submission Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F2242' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow 
                      key={result._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#F8F9FB',
                        },
                      }}
                    >
                      <TableCell sx={{ color: '#0F2242' }}>{result.userId?.name}</TableCell>
                      <TableCell sx={{ color: '#6B7280' }}>{result.userId?.email}</TableCell>
                      <TableCell sx={{ color: '#0F2242' }}>
                        {exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || result.examId}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${result.percentage.toFixed(1)}%`}
                          sx={{
                            backgroundColor: result.percentage >= 70 ? '#DCFCE7' : '#FEF3C7',
                            color: result.percentage >= 70 ? '#166534' : '#92400E',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CheckCircle sx={{ color: '#003974' }} fontSize="small" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Total: {result.totalMarks}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#6B7280' }}>{new Date(result.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleToggleVisibility(result._id)}
                          sx={{
                            color: result.showToStudent ? '#003974' : '#6B7280',
                          }}
                        >
                          {result.showToStudent ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardCard>
        </Grid>

        {/* Results Cards - Mobile View */}
        <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
          <DashboardCard title="Exam Results">
            {/* Mobile Filters */}
            <Box mb={2} display="flex" flexDirection="column" gap={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Exam</InputLabel>
                <Select
                  value={selectedExam}
                  onChange={(e) => handleExamChange(e.target.value)}
                  label="Select Exam"
                >
                  <MenuItem value="all">All Exams</MenuItem>
                  {exams.map((exam) => (
                    <MenuItem key={exam.examId} value={exam.examId}>
                      {exam.examName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Search Students"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={downloadCSV}
                  disabled={filteredResults.length === 0}
                  sx={{
                    borderColor: '#003974',
                    color: '#003974',
                    fontWeight: 600,
                    flex: 1,
                    fontSize: '0.75rem',
                  }}
                >
                  CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PictureAsPdf />}
                  onClick={downloadPDF}
                  disabled={filteredResults.length === 0}
                  sx={{
                    borderColor: '#ED1C24',
                    color: '#ED1C24',
                    fontWeight: 600,
                    flex: 1,
                    fontSize: '0.75rem',
                  }}
                >
                  PDF
                </Button>
              </Box>
            </Box>

            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              sx={{ 
                mb: 2,
                '& .MuiTab-root': {
                  color: '#6B7280',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  minWidth: 'auto',
                  px: 2,
                },
                '& .Mui-selected': {
                  color: '#003974',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#ED1C24',
                  height: '3px',
                },
              }}
            >
              <Tab label="All Results" />
              <Tab label="MCQ Results" />
            </Tabs>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredResults.map((result) => (
                <Card key={result._id} sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <CardContent sx={{ p: 2 }}>
                    {/* Student Name */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '0.95rem' }}>
                          {result.userId?.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                          {result.userId?.email}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleVisibility(result._id)}
                        sx={{
                          color: result.showToStudent ? '#003974' : '#6B7280',
                        }}
                      >
                        {result.showToStudent ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                      </IconButton>
                    </Box>

                    {/* Exam Name */}
                    <Typography variant="body2" sx={{ mb: 1.5, color: '#003974', fontWeight: 600 }}>
                      {exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || result.examId}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Details Grid */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Score */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary">Score</Typography>
                        <Chip
                          size="small"
                          label={`${result.percentage.toFixed(1)}%`}
                          sx={{
                            backgroundColor: result.percentage >= 70 ? '#DCFCE7' : '#FEF3C7',
                            color: result.percentage >= 70 ? '#166534' : '#92400E',
                            fontWeight: 600,
                          }}
                        />
                      </Box>

                      {/* Coding Submission */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary">Coding</Typography>
                        <CheckCircle sx={{ color: '#003974' }} fontSize="small" />
                      </Box>

                      {/* Total Marks */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary">Total Marks</Typography>
                        <Typography variant="body2" fontWeight="600">{result.totalMarks}</Typography>
                      </Box>

                      {/* Date */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary">Date</Typography>
                        <Typography variant="body2">{new Date(result.createdAt).toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Code View Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={() => setCodeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={window.innerWidth < 600}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Student Code Submissions
          <IconButton
            aria-label="close"
            onClick={() => setCodeDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Code />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          {selectedResult?.codingSubmissions?.map((submission, index) => (
            <Box key={index} mb={3}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} gutterBottom>
                Question {index + 1}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Language: {submission.language}
              </Typography>
              <Box sx={{ 
                maxWidth: '100%', 
                overflow: 'auto',
                '& pre': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  margin: 0,
                }
              }}>
                <SyntaxHighlighter language={submission.language} style={docco}>
                  {submission.code}
                </SyntaxHighlighter>
              </Box>
              <Box mt={1} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<CheckCircle />} 
                  label="Success" 
                  size={window.innerWidth < 600 ? 'small' : 'medium'}
                  sx={{
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: '#166534',
                    }
                  }}
                />
                {submission.executionTime && (
                  <Chip 
                    label={`Execution Time: ${submission.executionTime}ms`} 
                    size={window.innerWidth < 600 ? 'small' : 'medium'}
                    sx={{ 
                      backgroundColor: '#E0F2FE',
                      color: '#003974',
                      fontWeight: 600,
                    }} 
                  />
                )}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
          <Button onClick={() => setCodeDialogOpen(false)} fullWidth={window.innerWidth < 600}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ResultPage;
