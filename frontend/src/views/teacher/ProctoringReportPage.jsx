import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Paper, Typography, Chip, Divider, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LockIcon from '@mui/icons-material/Lock';
import PageContainer from 'src/components/container/PageContainer';
import { useGetStudentCheatingLogQuery } from 'src/slices/cheatingLogApiSlice';
import { useGetResultsByExamIdQuery, useGetExamsQuery } from 'src/slices/examApiSlice';

// ── Violation display config ────────────────────────────────────────────────
const VIOLATION_META = {
  noFace:           { label: 'No Face Detected',    color: '#dc2626', bg: '#fef2f2' },
  multipleFace:     { label: 'Multiple Faces',       color: '#7c3aed', bg: '#f5f3ff' },
  cellPhone:        { label: 'Mobile Phone',         color: '#d97706', bg: '#fffbeb' },
  prohibitedObject: { label: 'Prohibited Object',    color: '#c2410c', bg: '#fff7ed' },
  lookingAway:      { label: 'Looking Away',         color: '#0369a1', bg: '#f0f9ff' },
  suspiciousAudio:  { label: 'Suspicious Audio',     color: '#059669', bg: '#f0fdf4' },
  tabSwitch:        { label: 'Tab Switch',            color: '#475569', bg: '#f8fafc' },
};

const meta = (type) =>
  VIOLATION_META[type] || { label: type, color: '#374151', bg: '#f9fafb' };

// ── Small stat card ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5, borderRadius: '12px',
        border: `1px solid ${accent}33`,
        backgroundColor: `${accent}0d`,
        height: '100%',
      }}
    >
      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color: accent, fontWeight: 800, mt: 0.5, lineHeight: 1.1 }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: '#6b7280', mt: 0.5, display: 'block' }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ProctoringReportPage() {
  const { examId, email } = useParams();
  const navigate = useNavigate();
  const decodedEmail = decodeURIComponent(email);

  // Inject print-specific styles once on mount — hides all UI chrome,
  // sidebar, nav, buttons and shows only the report content.
  useEffect(() => {
    const styleId = 'proctoring-report-print-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @media print {
          /* Hide everything by default */
          body > * { display: none !important; }

          /* Show only the root app mount */
          #root { display: block !important; }

          /* Hide sidebar, topbar, and any layout chrome rendered by FullLayout */
          header, nav, aside,
          [class*="sidebar"], [class*="Sidebar"],
          [class*="topbar"], [class*="Topbar"],
          [class*="header"], [class*="Header"],
          [class*="navbar"], [class*="Navbar"],
          [data-print-hide] { display: none !important; }

          /* Show only the report content area */
          [data-print-content] { display: block !important; }
          [data-print-content] * { visibility: visible !important; }

          /* Reset page margins */
          @page { margin: 1.5cm; }
          body { margin: 0; background: #fff; }

          /* Ensure colors print correctly */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          /* Avoid breaking inside rows or cards */
          tr, .MuiCard-root, .MuiPaper-root { page-break-inside: avoid; }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // Fetch data in parallel
  const {
    data: logData,
    isLoading: logLoading,
    isError: logError,
  } = useGetStudentCheatingLogQuery({ examId, email: decodedEmail });

  const {
    data: resultsData,
    isLoading: resultsLoading,
    isError: resultsError,
  } = useGetResultsByExamIdQuery(examId);

  const {
    data: examsData,
    isLoading: examsLoading,
  } = useGetExamsQuery();

  const isLoading = logLoading || resultsLoading || examsLoading;
  const isError   = logError   || resultsError;

  // ── Derived values ─────────────────────────────────────────────────────────
  const exam = useMemo(
    () => examsData?.find((e) => e.examId === examId) || null,
    [examsData, examId],
  );

  const studentResult = useMemo(() => {
    if (!resultsData?.data) return null;
    return resultsData.data.find(
      (r) => r.userId?.email?.toLowerCase() === decodedEmail.toLowerCase(),
    ) || null;
  }, [resultsData, decodedEmail]);

  // Screenshots array — each entry has { url, type, detectedAt }
  const screenshots = useMemo(() => logData?.screenshots || [], [logData]);

  // Build per-type violation counts from screenshots (ground truth with timestamps)
  const violationBreakdown = useMemo(() => {
    const counts = {};
    screenshots.forEach(({ type }) => {
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [screenshots]);

  // Chronological violation timeline
  const timeline = useMemo(
    () =>
      [...screenshots]
        .sort((a, b) => new Date(a.detectedAt) - new Date(b.detectedAt))
        .map((s, i) => ({ ...s, index: i + 1 })),
    [screenshots],
  );

  const totalViolations = logData?.totalViolations || 0;
  const wasTerminated   = totalViolations >= 10;
  const hasEvidence     = screenshots.length > 0;

  // Exam status helpers
  const examDate  = exam ? new Date(exam.liveDate) : null;
  const submittedAt = studentResult ? new Date(studentResult.createdAt) : null;

  // ── Loading / error guards ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#003974' }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={4}>
        <Alert severity="error">Failed to load proctoring report. Please try again.</Alert>
      </Box>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = (date) =>
    date
      ? new Intl.DateTimeFormat('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: true,
        }).format(date)
      : '—';

  const fmtTime = (date) =>
    date
      ? new Intl.DateTimeFormat('en-IN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }).format(date)
      : '—';

  const fmtDate = (date) =>
    date
      ? new Intl.DateTimeFormat('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        }).format(date)
      : '—';

  const scoreLabel = studentResult
    ? `${studentResult.totalMarks ?? 0} pts · ${(studentResult.percentage ?? 0).toFixed(1)}%`
    : 'N/A';

  const statusColor  = wasTerminated ? '#dc2626' : totalViolations > 5 ? '#d97706' : '#16a34a';
  const statusBg     = wasTerminated ? '#fef2f2' : totalViolations > 5 ? '#fffbeb' : '#f0fdf4';
  const statusLabel  = wasTerminated ? 'Terminated' : studentResult ? 'Completed' : 'No Result';
  const StatusIcon   = wasTerminated ? CancelOutlinedIcon : CheckCircleOutlineIcon;

  return (
    <PageContainer title="Proctoring Report" description="Student proctoring report">
      <Box sx={{ pb: 4 }} data-print-content>

        {/* ── Header bar ────────────────────────────────────────────────── */}
        <Box
          data-print-hide
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 2, mb: 3,
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/exam-log')}
            sx={{ color: '#003974', fontWeight: 600, textTransform: 'none', px: 0 }}
          >
            Back to Exam Logs
          </Button>
          <Button
            startIcon={<PrintIcon />}
            variant="outlined"
            onClick={() => window.print()}
            sx={{
              borderColor: '#003974', color: '#003974', fontWeight: 600,
              textTransform: 'none', borderRadius: '8px',
              '&:hover': { backgroundColor: '#f0f7ff' },
            }}
          >
            Print / Export PDF
          </Button>
        </Box>

        {/* ── Title block ───────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{ p: 3, mb: 3, borderRadius: '14px', border: '1px solid #e8eaf0', backgroundColor: '#003974' }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em' }}>
                Proctoring Report
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', mt: 0.25 }}>
                {logData?.username || studentResult?.userId?.name || decodedEmail}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
                {decodedEmail}
              </Typography>
            </Box>
            <Chip
              icon={<StatusIcon sx={{ fontSize: '1rem !important', color: `${statusColor} !important` }} />}
              label={statusLabel}
              sx={{
                backgroundColor: statusBg,
                color: statusColor,
                fontWeight: 700,
                fontSize: '0.85rem',
                border: `1px solid ${statusColor}44`,
                px: 1,
              }}
            />
          </Stack>
        </Paper>

        {/* ── Exam + student details ─────────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '14px', border: '1px solid #e8eaf0' }}>
          <Typography variant="subtitle1" fontWeight={700} color="#003974" mb={2}>
            Exam Details
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Exam Name',    value: exam?.examName || '—' },
              { label: 'Exam Date',    value: fmtDate(examDate) },
              { label: 'Duration',     value: exam ? `${exam.duration} minutes` : '—' },
              { label: 'Submitted At', value: fmt(submittedAt) },
              { label: 'Score',        value: scoreLabel },
              { label: 'Status',       value: statusLabel },
            ].map(({ label, value }) => (
              <Grid item xs={12} sm={6} md={4} key={label}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="#111827" sx={{ mt: 0.25 }}>
                    {value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* ── Stat cards ────────────────────────────────────────────────── */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatCard
              label="Total Violations"
              value={totalViolations}
              sub={wasTerminated ? 'Exam terminated' : 'Out of 10 max'}
              accent={statusColor}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label="Evidence Captured"
              value={hasEvidence ? screenshots.length : '0'}
              sub={hasEvidence ? 'Items recorded' : 'No evidence'}
              accent="#0369a1"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label="Score"
              value={studentResult ? `${(studentResult.percentage ?? 0).toFixed(0)}%` : '—'}
              sub={studentResult ? `${studentResult.totalMarks ?? 0} marks` : 'No result'}
              accent="#16a34a"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label="Violation Types"
              value={Object.keys(violationBreakdown).length}
              sub="Distinct categories"
              accent="#7c3aed"
            />
          </Grid>
        </Grid>

        {/* ── Termination banner ────────────────────────────────────────── */}
        {wasTerminated && (
          <Alert
            severity="error"
            icon={<CancelOutlinedIcon />}
            sx={{ mb: 3, borderRadius: '12px', fontWeight: 600 }}
          >
            This exam was <strong>terminated</strong> — the student reached 10 violations.
          </Alert>
        )}

        {/* ── Violation summary breakdown ───────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '14px', border: '1px solid #e8eaf0' }}>
          <Typography variant="subtitle1" fontWeight={700} color="#003974" mb={2}>
            Violation Summary
          </Typography>

          {Object.keys(violationBreakdown).length === 0 ? (
            <Typography variant="body2" color="#6b7280">
              No violations recorded for this student.
            </Typography>
          ) : (
            <Grid container spacing={1.5}>
              {Object.entries(violationBreakdown).map(([type, count]) => {
                const m = meta(type);
                return (
                  <Grid item xs={12} sm={6} md={4} key={type}>
                    <Box
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        p: 1.5, borderRadius: '10px',
                        backgroundColor: m.bg,
                        border: `1px solid ${m.color}22`,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <WarningAmberIcon sx={{ fontSize: '1rem', color: m.color }} />
                        <Typography variant="body2" fontWeight={600} color={m.color}>
                          {m.label}
                        </Typography>
                      </Stack>
                      <Chip
                        label={count}
                        size="small"
                        sx={{
                          backgroundColor: m.color, color: '#fff',
                          fontWeight: 700, minWidth: 28,
                        }}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>

        {/* ── Chronological violation timeline ─────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '14px', border: '1px solid #e8eaf0' }}>
          <Typography variant="subtitle1" fontWeight={700} color="#003974" mb={2}>
            Violation Timeline
          </Typography>

          {timeline.length === 0 ? (
            <Typography variant="body2" color="#6b7280">
              No violation events recorded.
            </Typography>
          ) : (
            <>
              {/* Desktop table */}
              <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8faff' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#003974', width: 48 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#003974', width: 160 }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#003974', width: 200 }}>Violation Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#003974' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#003974', width: 140 }}>Evidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeline.map((item) => {
                      const m = meta(item.type);
                      return (
                        <TableRow
                          key={item.index}
                          sx={{ '&:hover': { backgroundColor: '#f8f9fb' } }}
                        >
                          <TableCell sx={{ color: '#9ca3af', fontWeight: 600 }}>{item.index}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={600} color="#111827">
                              {fmtTime(new Date(item.detectedAt))}
                            </Typography>
                            <Typography variant="caption" color="#9ca3af">
                              {fmtDate(new Date(item.detectedAt))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={m.label}
                              size="small"
                              sx={{
                                backgroundColor: m.bg,
                                color: m.color,
                                fontWeight: 600,
                                border: `1px solid ${m.color}33`,
                                fontSize: '0.75rem',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="#374151">
                              {m.label} detected during exam session.
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<LockIcon sx={{ fontSize: '0.75rem !important' }} />}
                              label="Evidence captured"
                              size="small"
                              sx={{
                                backgroundColor: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Mobile timeline list */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
                {timeline.map((item) => {
                  const m = meta(item.type);
                  return (
                    <Box
                      key={item.index}
                      sx={{
                        display: 'flex', alignItems: 'flex-start', gap: 1.5,
                        p: 1.5, borderRadius: '10px',
                        border: `1px solid ${m.color}22`,
                        backgroundColor: m.bg,
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 24, height: 24, borderRadius: '50%',
                          backgroundColor: m.color, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', mt: 0.25,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.65rem' }}>
                          {item.index}
                        </Typography>
                      </Box>
                      <Box flex={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="body2" fontWeight={700} color={m.color}>
                            {m.label}
                          </Typography>
                          <Typography variant="caption" fontFamily="monospace" color="#6b7280">
                            {fmtTime(new Date(item.detectedAt))}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="#6b7280">
                          {fmtDate(new Date(item.detectedAt))} · Evidence captured
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </Paper>

        {/* ── Privacy / security notice ─────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5, borderRadius: '12px',
            border: '1px solid #fed7aa',
            backgroundColor: '#fff7ed',
            display: 'flex', alignItems: 'flex-start', gap: 1.5,
          }}
        >
          <LockIcon sx={{ color: '#c2410c', mt: 0.25, flexShrink: 0 }} />
          <Box>
            <Typography variant="body2" fontWeight={700} color="#c2410c" mb={0.5}>
              Evidence Access — Restricted
            </Typography>
            <Typography variant="body2" color="#9a3412" lineHeight={1.6}>
              Proctoring evidence (screenshots and recordings) is restricted to authorized personnel
              and should be accessed only when required for investigation or review of a specific
              incident. Evidence is not displayed in this report.
            </Typography>
          </Box>
        </Paper>

      </Box>
    </PageContainer>
  );
}
