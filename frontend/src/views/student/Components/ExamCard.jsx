import * as React from 'react';
import { Box, Typography, Chip, IconButton, LinearProgress, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizIcon from '@mui/icons-material/Quiz';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useDeleteExamMutation } from 'src/slices/examApiSlice';
import { useGetCodingQuestionsQuery } from 'src/slices/codingQuestionApiSlice';
import axiosInstance from 'src/axios';

// Import background images
import bg1 from '../../../assets/images/backgrounds/6.png'; // Blue
import bg2 from '../../../assets/images/backgrounds/2.png';
import bg3 from '../../../assets/images/backgrounds/3.png';
import bg4 from '../../../assets/images/backgrounds/4.png';
import bg5 from '../../../assets/images/backgrounds/5.png';
import bg6 from '../../../assets/images/backgrounds/1.png'; // Purple

const backgroundImages = [bg1, bg2, bg3, bg4, bg5, bg6];

// Difficulty levels
const difficultyLevels = ['Primary', 'Intermediate', 'Advanced', 'Master', 'Ph.D'];

export default function ExamCard({ exam, isCompleted = false, status = 'active', serialNumber = 1 }) {
  const { examName, duration, totalQuestions, examId } = exam;
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === 'teacher';
  const [actualQuestionCount, setActualQuestionCount] = React.useState(totalQuestions);
  const [completionPercentage] = React.useState(Math.floor(Math.random() * 30) + 70); // Mock data
  const [deleteExam, { isLoading: isDeleting }] = useDeleteExamMutation();

  const navigate = useNavigate();
  
  // Determine if card should be disabled
  const isDisabled = status === 'expired' || status === 'upcoming';

  // Fetch coding questions count
  const { data: codingQuestions } = useGetCodingQuestionsQuery(examId);

  // Fetch actual question count (MCQ + Coding)
  React.useEffect(() => {
    const fetchQuestionCount = async () => {
      try {
        const response = await axiosInstance.get(`/api/users/questions/exam/${examId}`);
        const mcqQuestions = response.data;
        const codingCount = codingQuestions?.length || 0;
        setActualQuestionCount(mcqQuestions.length + codingCount);
      } catch (error) {
        console.error('Error fetching question count:', error);
      }
    };
    fetchQuestionCount();
  }, [examId, codingQuestions]);

  const handleCardClick = () => {
    if (isTeacher || isDisabled) {
      // Teachers and disabled cards shouldn't navigate
      return;
    }
    if (isCompleted) {
      navigate(`/exam-analytics/${examId}`);
      return;
    }
    navigate(`/exam/${examId}`);
  };

  const handleDeleteExam = async (e) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${examName}"?`)) {
      return;
    }

    try {
      await deleteExam(examId).unwrap();
      toast.success('Exam deleted successfully');
      // Refresh the page to update the exam list
      window.location.reload();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete exam');
    }
  };

  // Select background image and difficulty based on exam
  const bgIndex = examId ? examId.charCodeAt(0) % backgroundImages.length : 0;
  const difficultyIndex = actualQuestionCount ? Math.min(Math.floor(actualQuestionCount / 10), 4) : 0;
  const selectedBg = backgroundImages[bgIndex];

  return (
    <Box
      sx={{
        backgroundColor: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: isDisabled ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: isTeacher || isDisabled ? 'default' : 'pointer',
        height: '100%',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        opacity: isDisabled ? 0.7 : 1,
        '&:hover': {
          transform: isTeacher || isDisabled ? 'none' : 'translateY(-8px)',
          boxShadow: isTeacher || isDisabled ? (isDisabled ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.1)') : '0 16px 32px rgba(0,0,0,0.18)',
        },
      }}
      onClick={handleCardClick}
    >
      {/* Background Image Header */}
      <Box
        sx={{
          height: '180px',
          backgroundImage: 'url(/card.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          p: 2,
          filter: isCompleted || isDisabled ? 'grayscale(100%)' : 'none',
          opacity: isCompleted || isDisabled ? 0.8 : 1,
        }}
      >
        {/* Status Badge for upcoming/expired */}
        {status === 'upcoming' && (
          <Chip
            label="Upcoming"
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
            }}
          />
        )}
        {status === 'expired' && (
          <Chip
            label="Expired"
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
            }}
          />
        )}
        
        {/* Only show serial number */}
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            color: '#003974',
            fontWeight: 700,
            fontSize: '18px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            position: 'absolute',
            top: 16,
            right: 16,
          }}
        >
          {serialNumber}
        </Box>
      </Box>

      {/* Card Content */}
      <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Exam Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: isCompleted ? '#6B7280' : '#003974',
            mb: 1.5,
            fontSize: '20px',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '52px',
            letterSpacing: '-0.2px'
          }}
        >
          {examName}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: '#6B7280',
            fontSize: '14px',
            mb: 2.5,
            fontWeight: 400,
          }}
        >
          Multiple choice questions exam
        </Typography>

        {/* Metadata Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            mb: 2,
            color: '#6B7280',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuizIcon sx={{ fontSize: '20px' }} />
            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600 }}>
              {actualQuestionCount} Questions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: '20px' }} />
            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600 }}>
              {duration} Minutes
            </Typography>
          </Box>
        </Box>

        {/* Status Section */}
        <Box sx={{ mt: 'auto' }}>
          {isTeacher ? (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                fullWidth={false}
                startIcon={<EditIcon />}
                sx={{
                  color: '#003974',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  p: 0,
                  justifyContent: 'flex-start',
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 57, 116, 0.08)',
                    color: '#003974',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Clear localStorage for the selected exam
                  localStorage.removeItem(`examDraft_${examId}`);
                  localStorage.setItem('selectedExamId', examId);
                  navigate(`/add-questions?examId=${examId}`);
                }}
              >
                Edit Exam
              </Button>
              <Button
                fullWidth={false}
                startIcon={<DeleteIcon />}
                disabled={isDeleting}
                sx={{
                  color: '#ED1C24',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  p: 0,
                  justifyContent: 'flex-start',
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'rgba(237, 28, 36, 0.08)',
                    color: '#ED1C24',
                  },
                  '&:disabled': {
                    color: '#9CA3AF',
                  },
                }}
                onClick={handleDeleteExam}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Box>
          ) : status === 'upcoming' ? (
            <Typography
              sx={{
                color: '#92400E',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Available on {new Date(exam.liveDate).toLocaleDateString()}
            </Typography>
          ) : status === 'expired' ? (
            <Typography
              sx={{
                color: '#991B1B',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Exam ended
            </Typography>
          ) : isCompleted ? (
            <Button
              size="small"
              sx={{
                color: '#003974',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '14px',
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/exam-analytics/${examId}`);
              }}
            >
              View Analytics →
            </Button>
          ) : (
            <Button
              fullWidth={false}
              sx={{
                color: '#003974',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '14px',
                p: 0,
                justifyContent: 'flex-start',
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              Start Test →
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
