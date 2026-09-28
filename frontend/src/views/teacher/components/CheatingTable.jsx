import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, TextField, Select, MenuItem,
  CircularProgress, Dialog, DialogTitle, DialogContent, Grid,
  Card, CardMedia, CardContent, IconButton, Tooltip, Chip,
  Divider, Button, Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGetExamsQuery, useGetResultsByExamIdQuery } from 'src/slices/examApiSlice';
import { useGetCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import WarningIcon from '@mui/icons-material/Warning';
import AssessmentIcon from '@mui/icons-material/Assessment';

// ── helpers ──────────────────────────────────────────────────────────────────
const getViolationStyle = (count) => {
  if (count >= 10) return { bg: '#FFEBEE', color: '#ED1C24', border: '#ED1C24' };
  if (count > 5)  return { bg: '#FFEBEE', color: '#ED1C24', border: '#ED1C24' };
  if (count > 2)  return { bg: '#FFF3CD', color: '#856404', border: '#FFC107' };
  return                 { bg: '#E8F5E9', color: '#4CAF50', border: '#4CAF50' };
};

const getStatusChip = (log, result) => {
  if ((log?.totalViolations || 0) >= 10)
    return { label: 'Terminated', bg: '#FFEBEE', color: '#DC2626' };
  if (result)
    return { label: 'Completed',  bg: '#F0FDF4', color: '#16A34A' };
  return   { label: 'No Result',  bg: '#F8FAFC', color: '#64748B' };
};

export default function CheatingTable() {
  const navigate = useNavigate();
  const [filter, setFilter]             = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [cheatingLogs, setCheatingLogs] = useState([]);
  const [selectedLog, setSelectedLog]   = useState(null);
  const [openDialog, setOpenDialog]     = useState(false);

  const { data: examsData, isLoading: examsLoading, error: examsError } = useGetExamsQuery();
  const {
    data: cheatingLogsData,
    isLoading: logsLoading,
    error: logsError,
  } = useGetCheatingLogsQuery(selectedExamId, { skip: !selectedExamId });

  const {
    data: resultsData,
    isLoading: resultsLoading,
  } = useGetResultsByExamIdQuery(selectedExamId, { skip: !selectedExamId });

  // Auto-select first exam
  useEffect(() => {
    if (examsData?.length > 0 && !selectedExamId) {
      setSelectedExamId(examsData[0].examId);
    }
  }, [examsData]);

  useEffect(() => {
    if (cheatingLogsData) {
      setCheatingLogs(Array.isArray(cheatingLogsData) ? cheatingLogsData : []);
    }
  }, [cheatingLogsData]);

  // Build email→result lookup map
  const resultByEmail = useMemo(() => {
    const map = {};
    (resultsData?.data || []).forEach((r) => {
      if (r.userId?.email) map[r.userId.email.toLowerCase()] = r;
    });
    return map;
  }, [resultsData]);

  const filteredLogs = cheatingLogs.filter(
    (log) =>
      log.username?.toLowerCase().includes(filter.toLowerCase()) ||
      log.email?.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleViewReport = (log) => {
    navigate(`/proctoring-report/${selectedExamId}/${encodeURIComponent(log.email)}`);
  };

  const handleViewScreenshots = (log) => { setSelectedLog(log); setOpenDialog(true); };
  const handleCloseDialog     = ()    => { setOpenDialog(false); setSelectedLog(null); };

  // ── loading / error guards ────────────────────────────────────────────────
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

  const isDataLoading = logsLoading || resultsLoading;

  return (
    <Box>
      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', border: '1px solid #ECECEC' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Select
              value={selectedExamId || ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ECECEC' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#003974' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#003974' },
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
                  '& fieldset': { borderColor: '#ECECEC' },
                  '&:hover fieldset': { borderColor: '#003974' },
                  '&.Mui-focused fieldset': { borderColor: '#003974' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#003974' },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Table / cards ──────────────────────────────────────────────── */}
      {isDataLoading ? (
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
        <>
          {/* Desktop Table */}
          <TableContainer
            component={Paper}
            sx={{ borderRadius: '12px', border: '1px solid #ECECEC', display: { xs: 'none', md: 'block' } }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8F9FB' }}>
                  {['#', 'Student', 'Email', 'Score', 'Violations', 'Status', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#0F2242' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#6B7280' }}>
                      No cheating logs found for this exam
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const result       = resultByEmail[log.email?.toLowerCase()];
                    const vStyle       = getViolationStyle(log.totalViolations || 0);
                    const status       = getStatusChip(log, result);
                    const screenshotCount = log.screenshots?.length || 0;

                    return (
                      <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#F8F9FB' } }}>
                        <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>{idx + 1}</TableCell>

                        <TableCell sx={{ fontWeight: 600 }}>{log.username}</TableCell>

                        <TableCell sx={{ color: '#6B7280', fontSize: '0.85rem' }}>{log.email}</TableCell>

                        {/* Score */}
                        <TableCell>
                          {result ? (
                            <Stack spacing={0}>
                              <Typography variant="body2" fontWeight={700} color="#111827">
                                {result.totalMarks ?? 0} pts
                              </Typography>
                              <Typography variant="caption" color="#6B7280">
                                {(result.percentage ?? 0).toFixed(1)}%
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="#9CA3AF">—</Typography>
                          )}
                        </TableCell>

                        {/* Violations */}
                        <TableCell>
                          <Chip
                            icon={(log.totalViolations || 0) > 2 ? <WarningIcon sx={{ fontSize: '0.9rem' }} /> : undefined}
                            label={log.totalViolations || 0}
                            size="small"
                            sx={{
                              backgroundColor: vStyle.bg,
                              color: vStyle.color,
                              border: `1px solid ${vStyle.border}`,
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{
                              backgroundColor: status.bg,
                              color: status.color,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="View Proctoring Report">
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<AssessmentIcon sx={{ fontSize: '0.9rem' }} />}
                                onClick={() => handleViewReport(log)}
                                sx={{
                                  backgroundColor: '#003974',
                                  fontSize: '0.72rem',
                                  py: 0.5,
                                  px: 1.2,
                                  textTransform: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                  '&:hover': { backgroundColor: '#002a54' },
                                }}
                              >
                                View Report
                              </Button>
                            </Tooltip>
                            <Tooltip title={screenshotCount > 0 ? `${screenshotCount} screenshots (restricted)` : 'No evidence'}>
                              <span>
                                <IconButton
                                  onClick={() => handleViewScreenshots(log)}
                                  disabled={screenshotCount === 0}
                                  size="small"
                                  sx={{
                                    color: screenshotCount > 0 ? '#003974' : '#D1D5DB',
                                    '&:hover': { backgroundColor: '#F0F7FF' },
                                  }}
                                >
                                  <ImageIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {filteredLogs.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '12px', border: '1px solid #ECECEC' }}>
                <Typography color="textSecondary">No cheating logs found for this exam</Typography>
              </Paper>
            ) : (
              filteredLogs.map((log, idx) => {
                const result    = resultByEmail[log.email?.toLowerCase()];
                const vStyle    = getViolationStyle(log.totalViolations || 0);
                const status    = getStatusChip(log, result);
                const screenshotCount = log.screenshots?.length || 0;

                return (
                  <Card key={idx} sx={{ border: '1px solid #ECECEC', borderRadius: '12px' }}>
                    <CardContent sx={{ p: 2 }}>
                      {/* Header */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                        <Box flex={1}>
                          <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>#{idx + 1}</Typography>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '0.95rem' }}>{log.username}</Typography>
                          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>{log.email}</Typography>
                        </Box>
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{ backgroundColor: status.bg, color: status.color, fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      {/* Stats row */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Box>
                          <Typography variant="caption" color="#9CA3AF">Score</Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {result ? `${result.totalMarks ?? 0} pts · ${(result.percentage ?? 0).toFixed(0)}%` : '—'}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="caption" color="#9CA3AF">Violations</Typography>
                          <Box>
                            <Chip
                              label={log.totalViolations || 0}
                              size="small"
                              sx={{ backgroundColor: vStyle.bg, color: vStyle.color, border: `1px solid ${vStyle.border}`, fontWeight: 700 }}
                            />
                          </Box>
                        </Box>
                      </Stack>

                      {/* Action buttons */}
                      <Stack direction="row" spacing={1}>
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          startIcon={<AssessmentIcon sx={{ fontSize: '0.9rem' }} />}
                          onClick={() => handleViewReport(log)}
                          sx={{
                            backgroundColor: '#003974', fontSize: '0.75rem',
                            textTransform: 'none', borderRadius: '8px', fontWeight: 600,
                            '&:hover': { backgroundColor: '#002a54' },
                          }}
                        >
                          View Report
                        </Button>
                        <IconButton
                          onClick={() => handleViewScreenshots(log)}
                          disabled={screenshotCount === 0}
                          size="small"
                          sx={{
                            color: screenshotCount > 0 ? '#003974' : '#D1D5DB',
                            border: '1px solid',
                            borderColor: screenshotCount > 0 ? '#003974' : '#E5E7EB',
                            borderRadius: '8px',
                          }}
                        >
                          <ImageIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Box>
        </>
      )}

      {/* ── Screenshots dialog (restricted — stays as-is) ──────────────── */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={window.innerWidth < 600}
        PaperProps={{ sx: { borderRadius: { xs: 0, sm: '12px' }, m: { xs: 0, sm: 2 } } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #ECECEC', p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ color: '#003974', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Evidence — {selectedLog?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600 }}>
                🔒 Restricted to authorized personnel only
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: '#6B7280', '&:hover': { backgroundColor: '#F8F9FB' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
          {selectedLog?.screenshots?.length > 0 ? (
            <Grid container spacing={2}>
              {selectedLog.screenshots.map((screenshot, index) => {
                const imageUrl     = typeof screenshot === 'string' ? screenshot : screenshot.url;
                const violationType = screenshot.type || 'Unknown';
                const detectedTime  = screenshot.detectedAt
                  ? new Date(screenshot.detectedAt).toLocaleString()
                  : 'N/A';
                return (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card elevation={0} sx={{ border: '1px solid #ECECEC', borderRadius: '8px' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={imageUrl}
                        alt={`Violation — ${violationType}`}
                        sx={{ objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23f0f0f0"/><text x="50%25" y="50%25" font-size="14" text-anchor="middle" fill="%23999">Image unavailable</text></svg>';
                        }}
                      />
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#0F2242', fontWeight: 600, fontSize: '0.875rem' }}>
                          {violationType}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          {detectedTime}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">No screenshots available</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
