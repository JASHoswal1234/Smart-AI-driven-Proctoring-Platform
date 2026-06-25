import * as React from 'react';
import { Box, Typography, Chip, Stack, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import AccessTimeIcon from '@mui/icons-material/AccessTimeOutlined';
import QuizIcon from '@mui/icons-material/QuizOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BarChartIcon from '@mui/icons-material/BarChartOutlined';
import { useDeleteExamMutation } from 'src/slices/examApiSlice';
import { useGetCodingQuestionsQuery } from 'src/slices/codingQuestionApiSlice';
import axiosInstance from 'src/axios';

// Deterministic accent color per exam
const ACCENTS = ['#003974', '#6366f1', '#0891b2', '#16a34a', '#d97706', '#dc2626'];
const getAccent = (examId) => ACCENTS[(examId?.charCodeAt(0) || 0) % ACCENTS.length];

const StatusBadge = ({ status }) => {
  const map = {
    active:   { label: 'Active',   bg: '#dcfce7', color: '#166534' },
    upcoming: { label: 'Upcoming', bg: '#fef9c3', color: '#854d0e' },
    expired:  { label: 'Expired',  bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[status] || map.active;
  return (
    <Chip label={s.label} size="small"
      sx={{ backgroundColor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem', height: 22, borderRadius: '6px' }}
    />
  );
};

export default function ExamCard({ exam, isCompleted = false, status = 'active', serialNumber = 1 }) {
  const { examName, duration, totalQuestions, examId } = exam;
  const { userInfo } = useSelector((s) => s.auth);
  const isTeacher = userInfo?.role === 'teacher';
  const [actualQuestionCount, setActualQuestionCount] = React.useState(totalQuestions);
  const [deleteExam, { isLoading: isDeleting }] = useDeleteExamMutation();
  const navigate = useNavigate();

  const isDisabled = status === 'expired' || status === 'upcoming';
  const accent = getAccent(examId);

  const { data: codingQuestions } = useGetCodingQuestionsQuery(examId);

  React.useEffect(() => {
    axiosInstance.get(`/api/users/questions/exam/${examId}`)
      .then((res) => setActualQuestionCount(res.data.length + (codingQuestions?.length || 0)))
      .catch(() => {});
  }, [examId, codingQuestions]);

  const handleCardClick = () => {
    if (isTeacher || isDisabled) return;
    if (isCompleted) { navigate(`/exam-analytics/${examId}`); return; }
    navigate(`/exam/${examId}`);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${examName}"?`)) return;
    try {
      await deleteExam(examId).unwrap();
      toast.success('Exam deleted');
      window.location.reload();
    } catch { toast.error('Failed to delete exam'); }
  };

  return (
    <Box
      onClick={handleCardClick}
      sx={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: isDisabled ? '#f0f0f0' : '#e8eaf0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: isTeacher || isDisabled ? 'default' : 'pointer',
        opacity: isDisabled ? 0.72 : 1,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        '&:hover': {
          boxShadow: isTeacher || isDisabled ? '0 1px 4px rgba(0,0,0,0.05)' : '0 8px 24px rgba(0,0,0,0.1)',
          transform: isTeacher || isDisabled ? 'none' : 'translateY(-3px)',
        },
      }}
    >
      {/* Accent bar */}
      <Box sx={{ height: 4, backgroundColor: isDisabled ? '#e0e0e0' : accent }} />

      {/* Body */}
      <Box sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Header row */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
          {/* Number badge */}
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
            backgroundColor: isDisabled ? '#f3f4f6' : `${accent}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontWeight: 800, color: isDisabled ? '#9ca3af' : accent, fontSize: '0.9rem' }}>
              {serialNumber}
            </Typography>
          </Box>

          <StatusBadge status={isCompleted ? 'active' : status} />
        </Stack>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: isDisabled || isCompleted ? '#6B7280' : '#0F2242',
            fontSize: '1rem',
            lineHeight: 1.35,
            mb: 0.75,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {examName}
        </Typography>

        {/* Meta */}
        <Stack direction="row" spacing={2.5} mb={2.5}>
          <Stack direction="row" alignItems="center" spacing={0.6}>
            <QuizIcon sx={{ fontSize: 15, color: '#9ca3af' }} />
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.75rem' }}>
              {actualQuestionCount} Qs
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.6}>
            <AccessTimeIcon sx={{ fontSize: 15, color: '#9ca3af' }} />
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.75rem' }}>
              {duration} min
            </Typography>
          </Stack>
        </Stack>

        {/* CTA */}
        <Box sx={{ mt: 'auto' }}>
          {isTeacher ? (
            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<EditIcon />} onClick={(e) => { e.stopPropagation(); localStorage.removeItem(`examDraft_${examId}`); localStorage.setItem('selectedExamId', examId); navigate(`/add-questions?examId=${examId}`); }}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#003974', px: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#EEF3FB' } }}>
                Edit
              </Button>
              <Button size="small" startIcon={<DeleteIcon />} disabled={isDeleting} onClick={handleDelete}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#dc2626', px: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#fee2e2' } }}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </Stack>
          ) : status === 'upcoming' ? (
            <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600, fontSize: '0.78rem' }}>
              Available {new Date(exam.liveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Typography>
          ) : status === 'expired' ? (
            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.78rem' }}>
              Exam ended
            </Typography>
          ) : isCompleted ? (
            <Button size="small" startIcon={<BarChartIcon />} onClick={(e) => { e.stopPropagation(); navigate(`/exam-analytics/${examId}`); }}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', color: '#6366f1', px: 0, '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}>
              View Results
            </Button>
          ) : (
            <Button size="small" variant="contained" startIcon={<PlayArrowIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', backgroundColor: accent, borderRadius: '8px', px: 2, boxShadow: 'none', '&:hover': { boxShadow: 'none', filter: 'brightness(0.92)' } }}>
              Start Test
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
