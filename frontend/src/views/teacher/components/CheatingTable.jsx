import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { useGetCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import WarningIcon from '@mui/icons-material/Warning';

export default function CheatingTable() {
  const [filter, setFilter] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [cheatingLogs, setCheatingLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const { data: examsData, isLoading: examsLoading, error: examsError } = useGetExamsQuery();
  const {
    data: cheatingLogsData,
    isLoading: logsLoading,
    error: logsError,
  } = useGetCheatingLogsQuery(selectedExamId, {
    skip: !selectedExamId,
  });

  useEffect(() => {
    if (examsData && examsData.length > 0) {
      const firstExam = examsData[0];
      setSelectedExamId(firstExam.examId);
    }
  }, [examsData]);

  useEffect(() => {
    if (cheatingLogsData) {
      setCheatingLogs(Array.isArray(cheatingLogsData) ? cheatingLogsData : []);
    }
  }, [cheatingLogsData]);

  const filteredUsers = cheatingLogs.filter(
    (log) =>
      log.username?.toLowerCase().includes(filter.toLowerCase()) ||
      log.email?.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleViewScreenshots = (log) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLog(null);
  };

  const getViolationColor = (count) => {
    if (count > 5) return { bg: '#FFEBEE', color: '#ED1C24', border: '#ED1C24' };
    if (count > 2) return { bg: '#FFF3CD', color: '#856404', border: '#FFC107' };
    return { bg: '#E8F5E9', color: '#4CAF50', border: '#4CAF50' };
  };

  const getViolationIcon = (count) => {
    if (count > 5) return <WarningIcon sx={{ fontSize: '1rem' }} />;
    if (count > 2) return <WarningIcon sx={{ fontSize: '1rem' }} />;
    return null;
  };

  if (examsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (examsError) {
    return (
      <Box p={2}>
        <Typography color="error">
          Error loading exams: {examsError.data?.message || examsError.error || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  if (!examsData || examsData.length === 0) {
    return (
      <Box p={2}>
        <Typography>No exams available. Please create an exam first.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', border: '1px solid #ECECEC' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Select
              value={selectedExamId || ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ECECEC',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#003974',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#003974',
                }
              }}
            >
              {examsData.map((exam) => (
                <MenuItem key={exam.examId} value={exam.examId}>
                  {exam.examName || 'Unnamed Exam'}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Filter by Name or Email"
              variant="outlined"
              fullWidth
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#ECECEC',
                  },
                  '&:hover fieldset': {
                    borderColor: '#003974',
                  },
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
        </Grid>
      </Paper>

      {logsLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : logsError ? (
        <Box p={2}>
          <Typography color="error">
            Error loading logs: {logsError.data?.message || logsError.error || 'Unknown error'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8F9FB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#0F2242' }}>Sno</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0F2242' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0F2242' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0F2242' }}>Total Violations</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0F2242' }}>Screenshots</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#6B7280' }}>
                    No cheating logs found for this exam
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((log, index) => {
                  const violationStyle = getViolationColor(log.totalViolations || 0);
                  return (
                    <TableRow 
                      key={index}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#F8F9FB',
                        }
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{log.username}</TableCell>
                      <TableCell sx={{ color: '#6B7280' }}>{log.email}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getViolationIcon(log.totalViolations || 0)}
                          label={log.totalViolations || 0}
                          size="small"
                          sx={{
                            backgroundColor: violationStyle.bg,
                            color: violationStyle.color,
                            borderColor: violationStyle.border,
                            border: '1px solid',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Screenshots">
                          <IconButton
                            onClick={() => handleViewScreenshots(log)}
                            disabled={!log.screenshots?.length}
                            sx={{
                              color: log.screenshots?.length ? '#003974' : '#ECECEC',
                              '&:hover': {
                                backgroundColor: '#F0F7FF',
                              }
                            }}
                          >
                            <ImageIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Screenshots Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #ECECEC' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: '#003974', fontWeight: 600 }}>
              Screenshots - {selectedLog?.username}
            </Typography>
            <IconButton 
              onClick={handleCloseDialog}
              sx={{
                color: '#6B7280',
                '&:hover': {
                  backgroundColor: '#F8F9FB',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            {selectedLog?.screenshots?.map((screenshot, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  elevation={0}
                  sx={{ 
                    border: '1px solid #ECECEC',
                    borderRadius: '8px',
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={screenshot.url}
                    alt={`Violation - ${screenshot.type}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#0F2242', fontWeight: 600 }}>
                      Type: {screenshot.type}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                      Detected: {new Date(screenshot.detectedAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
