import * as React from 'react';
import { Box, Typography, Stack, Button, Chip } from '@mui/material';
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

const PRIMARY = '#003974';

const StatusBadge = ({ status }) => {
  const map = {
    active:   { label: 'Active',   bg: 'rgba(255,255,255,0.18)', color: '#fff' },
    upcoming: { label: 'Upcoming', bg: 'rgba(255,255,255,0.18)', color: '#fff' },
    expired:  { label: 'Expired',  bg: 'rgba(255,255,255,0.18)', color: '#fff' },
  };
  const s = map[status] || map.active;
  return (
    <Chip label={s.label} size="small"
      sx={{ backgroundColor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.68rem', height: 20, borderRadius: '6px', border: '1px solid rgba(255,255,255,0.25)' }}
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
        border: '1px solid #e8eaf0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: isTeacher || isDisabled ? 'default' : 'pointer',
        opacity: isDisabled ? 0.72 : 1,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        '&:hover': {
          boxShadow: isTeacher || isDisabled ? '0 2px 8px rgba(0,0,0,0.06)' : '0 10px 28px rgba(0,0,0,0.12)',
          transform: isTeacher || isDisabled ? 'none' : 'translateY(-4px)',
        },
      }}
    >
      {/* ── Image header — cropped, no overlap ── */}
      <Box
        sx={{
          height: 130,
          backgroundImage: 'url(/card.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundColor: PRIMARY,
          position: 'relative',
          filter: isDisabled ? 'grayscale(60%) brightness(0.85)' : 'none',
        }}
      >
        {/* Overlay for readability */}
        <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,30,60,0.35)' }} />

        {/* Top row: number + status */}
        <Stack direction="row" alignItems="center" justifyContent="space-between"
          sx={{ position: 'absolute', top: 12, left: 14, right: 14 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem' }}>{serialNumber}</Typography>
          </Box>
          <StatusBadge status={isCompleted ? 'active' : status} />
        </Stack>
      </Box>

      {/* ── Content below image ── */}
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1, backgroundColor: '#fff' }}>
        {/* Title */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: isDisabled ? '#6B7280' : PRIMARY,
            fontSize: '0.95rem',
            lineHeight: 1.35,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {examName}
        </Typography>

        {/* Meta */}
        <Stack direction="row" spacing={2} mb={2}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <QuizIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.72rem' }}>
              {actualQuestionCount} Questions
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <AccessTimeIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.72rem' }}>
              {duration} min
            </Typography>
          </Stack>
        </Stack>

        {/* CTA */}
        <Box sx={{ mt: 'auto' }}>
          {isTeacher ? (
            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<EditIcon />}
                onClick={(e) => { e.stopPropagation(); localStorage.removeItem(`examDraft_${examId}`); localStorage.setItem('selectedExamId', examId); navigate(`/add-questions?examId=${examId}`); }}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', color: PRIMARY, px: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#EEF3FB' } }}>
                Edit
              </Button>
              <Button size="small" startIcon={<DeleteIcon />} disabled={isDeleting} onClick={handleDelete}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', color: '#dc2626', px: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#fee2e2' } }}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </Stack>
          ) : status === 'upcoming' ? (
            <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600, fontSize: '0.75rem' }}>
              Available {new Date(exam.liveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Typography>
          ) : status === 'expired' ? (
            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.75rem' }}>
              Exam ended
            </Typography>
          ) : isCompleted ? (
            <Button size="small" startIcon={<BarChartIcon />}
              onClick={(e) => { e.stopPropagation(); navigate(`/exam-analytics/${examId}`); }}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', color: PRIMARY, px: 0, '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}>
              View Results
            </Button>
          ) : (
            <Button size="small" variant="contained" startIcon={<PlayArrowIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', backgroundColor: PRIMARY, borderRadius: '8px', px: 2, boxShadow: 'none', '&:hover': { backgroundColor: '#002a54', boxShadow: 'none' } }}>
              Start Test
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
