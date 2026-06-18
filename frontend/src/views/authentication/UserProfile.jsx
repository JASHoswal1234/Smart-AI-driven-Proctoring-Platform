import React, { useEffect, useState } from 'react';
import {
  Grid,
  Box,
  Card,
  Typography,
  Stack,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useSelector, useDispatch } from 'react-redux';
import PageContainer from 'src/components/container/PageContainer';
import { IconMail, IconUser, IconSchool, IconTrophy, IconEdit, IconDeviceFloppy, IconLock, IconKey } from '@tabler/icons-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { setCredentials } from 'src/slices/authSlice';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const CLASSES = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate'];

const UserProfile = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileData, setProfileData] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    department: userInfo?.department || 'Computer Science',
    class: userInfo?.class || 'First Year',
    rollNo: userInfo?.rollNo || '',
    college: userInfo?.college || '',
  });

  useEffect(() => {
    const fetchUserResults = async () => {
      try {
        setLoading(true);
        
        // Fetch user results
        const { data: resultsData } = await axios.get('/api/users/results/user');
        
        // Fetch all exams to get exam names
        const { data: examsData } = await axios.get('/api/users/exam');
        
        // Create a map of examId (UUID) to exam details
        const examMap = {};
        examsData.forEach((exam) => {
          examMap[exam.examId] = exam;
        });
        
        setExams(examMap);
        setResults(resultsData.data || []);
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error('Failed to load exam results');
      } finally {
        setLoading(false);
      }
    };

    fetchUserResults();
  }, []);

  const handleSaveProfile = async () => {
    try {
      console.log('💾 Saving profile data:', profileData);
      const response = await axios.put('/api/users/profile', {
        _id: userInfo._id,
        ...profileData,
      });
      
      console.log('✅ Profile saved successfully:', response.data);
      dispatch(setCredentials(response.data));
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      await axios.put('/api/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Password changed successfully!');
      setPasswordChangeMode(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('❌ Error changing password:', error);
      toast.error(error?.response?.data?.message || 'Failed to change password');
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'primary';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <PageContainer title="User Profile" description="View your profile and exam history">
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Profile Card */}
        <Card elevation={0} sx={{ p: 4, mb: 4, border: '1px solid #ECECEC', borderRadius: '12px' }}>
          <Stack direction="row" spacing={3} alignItems="flex-start">
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: '#9CA3AF',
                fontSize: '2.5rem',
              }}
            >
              <PersonIcon sx={{ fontSize: '3.5rem', color: '#FFFFFF' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              {!editMode ? (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h3" sx={{ color: '#0F2242', fontWeight: 600 }}>
                      {userInfo?.name}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<IconEdit />}
                      onClick={() => setEditMode(true)}
                      sx={{
                        borderColor: '#003974',
                        color: '#003974',
                        borderRadius: '8px',
                        '&:hover': {
                          borderColor: '#002a54',
                          backgroundColor: '#F0F7FF',
                        }
                      }}
                    >
                      Edit Profile
                    </Button>
                  </Stack>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconMail size={20} />
                      <Typography variant="body1" color="textSecondary">
                        {userInfo?.email}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconSchool size={20} color="#003974" />
                      <Typography variant="body1" color="textSecondary" component="div">
                        Role: <Chip 
                          label={userInfo?.role} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#F0F7FF', 
                            color: '#003974', 
                            fontWeight: 600 
                          }} 
                        />
                      </Typography>
                    </Stack>
                    {userInfo?.role === 'student' && (
                      <>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" color="textSecondary">
                            Department: <strong>{userInfo?.department || 'Not set'}</strong>
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" color="textSecondary">
                            Class: <strong>{userInfo?.class || 'Not set'}</strong>
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" color="textSecondary">
                            Roll No: <strong>{userInfo?.rollNo || 'Not set'}</strong>
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" color="textSecondary">
                            College: <strong>{userInfo?.college || 'Not set'}</strong>
                          </Typography>
                        </Stack>
                      </>
                    )}
                  </Stack>
                </>
              ) : (
                <Box>
                  <Typography variant="h4" mb={3} sx={{ color: '#003974', fontWeight: 600 }}>
                    Edit Profile
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profileData.email}
                        disabled
                      />
                    </Grid>
                    {userInfo?.role === 'student' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Department</InputLabel>
                            <Select
                              value={profileData.department}
                              label="Department"
                              onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                            >
                              {DEPARTMENTS.map((dept) => (
                                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Class</InputLabel>
                            <Select
                              value={profileData.class}
                              label="Class"
                              onChange={(e) => setProfileData({ ...profileData, class: e.target.value })}
                            >
                              {CLASSES.map((cls) => (
                                <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Roll Number"
                            value={profileData.rollNo}
                            onChange={(e) => setProfileData({ ...profileData, rollNo: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="College"
                            value={profileData.college}
                            onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={<IconDeviceFloppy />}
                          onClick={handleSaveProfile}
                          sx={{
                            backgroundColor: '#003974',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            borderRadius: '8px',
                            '&:hover': {
                              backgroundColor: '#002a54',
                            }
                          }}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setEditMode(false)}
                          sx={{
                            borderColor: '#6B7280',
                            color: '#6B7280',
                            borderRadius: '8px',
                            '&:hover': {
                              borderColor: '#4B5563',
                              backgroundColor: '#F8F9FB',
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Stack>
        </Card>

        {/* Password & Security Section */}
        <Card elevation={0} sx={{ p: 4, mb: 4, border: '1px solid #ECECEC', borderRadius: '12px' }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <IconLock size={28} color="#003974" />
            <Typography variant="h4" sx={{ color: '#003974', fontWeight: 600 }}>
              Password & Security
            </Typography>
          </Stack>
          <Divider sx={{ mb: 3 }} />

          {!passwordChangeMode ? (
            <Box>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <IconKey size={20} color="#6B7280" />
                  <Typography variant="body1" color="textSecondary">
                    Last password change: {new Date().toLocaleDateString()}
                  </Typography>
                </Stack>
                <Button
                  variant="contained"
                  startIcon={<IconLock />}
                  onClick={() => setPasswordChangeMode(true)}
                  sx={{
                    alignSelf: 'flex-start',
                    backgroundColor: '#003974',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: '#002a54',
                    }
                  }}
                >
                  Change Password
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#003974',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#003974',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    helperText="Minimum 6 characters"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#003974',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#003974',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#003974',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#003974',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<IconDeviceFloppy />}
                      onClick={handleChangePassword}
                      sx={{
                        backgroundColor: '#003974',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: '#002a54',
                        }
                      }}
                    >
                      Save New Password
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setPasswordChangeMode(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                      sx={{
                        borderColor: '#6B7280',
                        color: '#6B7280',
                        borderRadius: '8px',
                        '&:hover': {
                          borderColor: '#4B5563',
                          backgroundColor: '#F8F9FB',
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}
        </Card>

        {/* Exam Results Section */}
        {userInfo?.role === 'student' && (
          <Card elevation={0} sx={{ p: 4, border: '1px solid #ECECEC', borderRadius: '12px' }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
              <IconTrophy size={28} color="#003974" />
              <Typography variant="h4" sx={{ color: '#003974', fontWeight: 600 }}>
                Exam History
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : results.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="h6" color="textSecondary">
                  No exam results yet
                </Typography>
                <Typography variant="body2" color="textSecondary" mt={1}>
                  Your completed exams will appear here
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.light' }}>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Exam Name
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Score
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Percentage
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Grade
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Date
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => {
                      const exam = exams[result.examId];
                      const percentage = result.percentage || 0;
                      
                      return (
                        <TableRow key={result._id} hover>
                          <TableCell>
                            <Typography variant="body1" fontWeight={500}>
                              {exam?.examName || 'Unknown Exam'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body1">
                              {result.totalMarks?.toFixed(2) || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${percentage.toFixed(2)}%`}
                              color={getGradeColor(percentage)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={getGrade(percentage)}
                              color={getGradeColor(percentage)}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="textSecondary">
                              {new Date(result.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}
      </Box>
    </PageContainer>
  );
};

export default UserProfile;
