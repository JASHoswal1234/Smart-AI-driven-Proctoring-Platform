import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Select,
  MenuItem,
  Paper,
  Typography,
  IconButton,
  Chip,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  OutlinedInput,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useCreateQuestionMutation, useGetExamsQuery, useGetQuestionsQuery } from 'src/slices/examApiSlice';
import { useCreateCodingQuestionMutation, useGetCodingQuestionsQuery } from 'src/slices/codingQuestionApiSlice';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import BulkImportModal from './BulkImportModal';

const AddQuestionFormRefactored = () => {
  // URL parameters
  const [searchParams] = useSearchParams();
  
  // Existing API hooks
  const [createQuestion] = useCreateQuestionMutation();
  const [createCodingQuestion] = useCreateCodingQuestionMutation();
  const { data: examsData } = useGetExamsQuery();

  // State management
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [selectedCodingQuestionId, setSelectedCodingQuestionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    id: null,
    question: '',
    questionType: 'mcq',
    ansmarks: 1,
    difficulty: 'medium',
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ],
    modelAnswer: '',
  });

  const [currentCodingQuestion, setCurrentCodingQuestion] = useState({
    id: null,
    question: '',
    ansmarks: 10,
    problemDescription: '',
    sampleInput: '',
    sampleOutput: '',
    allowedLanguages: ['JavaScript', 'Python'],
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadedFromDB, setLoadedFromDB] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  // Track which examId the currently loaded DB data belongs to
  // This prevents stale RTK Query data from a previous exam leaking into a new one
  const loadedExamIdRef = React.useRef(null);
  // Monotonic counter for local question IDs — avoids Date.now() collisions
  const questionIdCounter = React.useRef(Date.now());

  // Fetch existing questions from database
  const { data: dbQuestions, refetch: refetchQuestions } = useGetQuestionsQuery(selectedExamId, {
    skip: !selectedExamId,
  });

  // Fetch existing coding questions from database
  const { data: dbCodingQuestions, refetch: refetchCodingQuestions } = useGetCodingQuestionsQuery(selectedExamId, {
    skip: !selectedExamId,
  });

  // Clean up function when component unmounts or exam changes
  useEffect(() => {
    return () => {
      // Cleanup function - reset state when unmounting
      console.log('Cleanup: Resetting AddQuestions state');
    };
  }, []);

  // Initialize exam selection (check URL params first, then localStorage, then first exam)
  useEffect(() => {
    const examIdFromUrl = searchParams.get('examId');
    
    if (examIdFromUrl && examsData?.some(exam => exam.examId === examIdFromUrl)) {
      setSelectedExamId(examIdFromUrl);
      const exam = examsData.find(e => e.examId === examIdFromUrl);
      setSelectedExam(exam);
      localStorage.setItem('selectedExamId', examIdFromUrl);
      return;
    }
    
    const savedExamId = localStorage.getItem('selectedExamId');
    
    if (savedExamId && examsData?.some(exam => exam.examId === savedExamId)) {
      setSelectedExamId(savedExamId);
      const exam = examsData.find(e => e.examId === savedExamId);
      setSelectedExam(exam);
    } else if (examsData && examsData.length > 0) {
      setSelectedExamId(examsData[0].examId);
      setSelectedExam(examsData[0]);
      localStorage.setItem('selectedExamId', examsData[0].examId);
    }
  }, [examsData, searchParams]);

  // Save selected exam ID whenever it changes
  useEffect(() => {
    if (selectedExamId) {
      localStorage.setItem('selectedExamId', selectedExamId);
      const exam = examsData?.find(e => e.examId === selectedExamId);
      setSelectedExam(exam);
    }
  }, [selectedExamId, examsData]);

  // Load draft from localStorage when exam changes
  useEffect(() => {
    if (!selectedExamId) return;

    // CRITICAL: Always clear state first when exam changes
    setQuestions([]);
    setCodingQuestions([]);
    setLoadedFromDB(false); // Reset this flag so DB questions can load
    setHasUnsavedChanges(false);
    setCurrentQuestion({
      id: null,
      question: '',
      questionType: 'mcq',
      ansmarks: 1,
      difficulty: 'medium',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
      modelAnswer: '',
    });
    setCurrentCodingQuestion({
      id: null,
      question: '',
      ansmarks: 10,
      problemDescription: '',
      sampleInput: '',
      sampleOutput: '',
      allowedLanguages: ['JavaScript', 'Python'],
    });
    setSelectedQuestionId(null);
    setSelectedCodingQuestionId(null);

    const draftKey = `examDraft_${selectedExamId}`;
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Verify the draft belongs to the current exam
        if (draft.examId === selectedExamId) {
          if (draft.questions && draft.questions.length > 0) {
            setQuestions(draft.questions);
            setHasUnsavedChanges(true);
            setLoadedFromDB(true); // Draft loaded, don't load from DB
          }
          
          if (draft.codingQuestions && draft.codingQuestions.length > 0) {
            setCodingQuestions(draft.codingQuestions);
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [selectedExamId]);

  // Load existing questions from database if no draft exists
  useEffect(() => {
    // Guard: only load if the DB data actually belongs to the currently selected exam
    if (!selectedExamId || loadedFromDB || questions.length > 0 || codingQuestions.length > 0) return;
    if (!dbQuestions) return;
    // Stale check: RTK Query may still hold previous exam's data
    // We infer this by checking if ANY returned question has a different examId
    if (dbQuestions.length > 0 && dbQuestions[0].examId !== selectedExamId) return;

    if (dbQuestions.length > 0) {
      const transformedQuestions = dbQuestions.map((q) => ({
        id: q._id,
        question: q.question,
        questionType: q.questionType,
        ansmarks: q.ansmarks,
        difficulty: 'medium',
        options: q.options || [
          { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false },
        ],
        modelAnswer: q.modelAnswer || '',
      }));
      setQuestions(transformedQuestions);
      loadedExamIdRef.current = selectedExamId;
    }
    setLoadedFromDB(true);
  }, [dbQuestions, selectedExamId, loadedFromDB, questions.length, codingQuestions.length]);

  // Load existing coding questions from database if no draft exists
  useEffect(() => {
    if (!selectedExamId || loadedFromDB || questions.length > 0 || codingQuestions.length > 0) return;
    if (!dbCodingQuestions) return;
    // Stale check
    if (dbCodingQuestions.length > 0 && dbCodingQuestions[0].examId !== selectedExamId) return;

    if (dbCodingQuestions.length > 0) {
      const transformedCodingQuestions = dbCodingQuestions.map((q) => ({
        id: q._id,
        question: q.question,
        ansmarks: q.ansmarks,
        problemDescription: q.description || '',
        sampleInput: q.sampleInput || '',
        sampleOutput: q.sampleOutput || '',
        allowedLanguages: q.allowedLanguages || ['JavaScript', 'Python'],
      }));
      setCodingQuestions(transformedCodingQuestions);
    }
  }, [dbCodingQuestions, selectedExamId, loadedFromDB, questions.length, codingQuestions.length]);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!selectedExamId) return;

    const autoSaveInterval = setInterval(() => {
      if (questions.length > 0 || codingQuestions.length > 0) {
        const draftKey = `examDraft_${selectedExamId}`;
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            examId: selectedExamId,
            questions: questions,
            codingQuestions: codingQuestions,
            lastSaved: new Date().toISOString(),
          })
        );
        console.log('Auto-saved draft to localStorage');
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [questions, codingQuestions, selectedExamId]);

  // Warn before leaving page if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved questions. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Validation
  const validateQuestion = (q) => {
    const errors = {};
    
    if (!q.question.trim()) {
      errors.question = 'Question text is required';
    }
    
    if (q.ansmarks <= 0) {
      errors.ansmarks = 'Marks must be greater than 0';
    }
    
    if (q.questionType === 'mcq') {
      const filledOptions = q.options.filter(opt => opt.optionText.trim() !== '');
      if (filledOptions.length < 2) {
        errors.options = 'At least 2 options are required';
      }
      const hasCorrect = q.options.some(opt => opt.isCorrect && opt.optionText.trim() !== '');
      if (!hasCorrect) {
        errors.correctAnswer = 'Please select a correct answer';
      }
    } else if (q.questionType === 'subjective') {
      if (!q.modelAnswer.trim()) {
        errors.modelAnswer = 'Model answer is required for subjective questions';
      }
    }
    
    return errors;
  };

  // Validation for coding questions
  const validateCodingQuestion = (q) => {
    const errors = {};
    
    if (!q.question.trim()) {
      errors.question = 'Question title is required';
    }
    
    if (q.ansmarks <= 0) {
      errors.ansmarks = 'Marks must be greater than 0';
    }
    
    if (!q.problemDescription || !q.problemDescription.trim()) {
      errors.problemDescription = 'Problem description is required';
    }
    
    if (!q.allowedLanguages || q.allowedLanguages.length === 0) {
      errors.allowedLanguages = 'At least one programming language must be selected';
    }
    
    return errors;
  };

  // Handle option change
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...currentQuestion.options];
    if (field === 'isCorrect') {
      newOptions.forEach((opt, idx) => {
        opt.isCorrect = idx === index;
      });
    } else {
      newOptions[index][field] = value;
    }
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  // Add new option
  const handleAddOption = () => {
    if (currentQuestion.options.length < 8) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, { optionText: '', isCorrect: false }],
      });
    }
  };

  // Remove option
  const handleRemoveOption = (index) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, idx) => idx !== index);
      setCurrentQuestion({ ...currentQuestion, options: newOptions });
    }
  };

  // Save question to LOCAL STATE (not database yet)
  const handleSaveQuestion = () => {
    const errors = validateQuestion(currentQuestion);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix validation errors');
      return;
    }

    // Check if we've reached the total question limit
    const totalCurrentQuestions = questions.length + codingQuestions.length;
    const totalAllowed = selectedExam?.totalQuestions || 0;
    
    if (!currentQuestion.id && totalCurrentQuestions >= totalAllowed) {
      toast.error(`Cannot add more questions. Exam limit is ${totalAllowed} total questions (MCQ/Subjective + Coding combined).`);
      return;
    }

    if (currentQuestion.id) {
      setQuestions(questions.map(q => q.id === currentQuestion.id ? { ...currentQuestion } : q));
      toast.success('Question updated in draft');
    } else {
      const newQuestion = { ...currentQuestion, id: ++questionIdCounter.current };
      setQuestions([...questions, newQuestion]);
      toast.success('Question added to draft');
    }

    setHasUnsavedChanges(true);

    const draftKey = `examDraft_${selectedExamId}`;
    const updatedQuestions = currentQuestion.id 
      ? questions.map(q => q.id === currentQuestion.id ? { ...currentQuestion } : q)
      : [...questions, { ...currentQuestion, id: questionIdCounter.current }];
    
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        examId: selectedExamId,
        questions: updatedQuestions,
        codingQuestions: codingQuestions,
        lastSaved: new Date().toISOString(),
      })
    );

    setCurrentQuestion({
      id: null,
      question: '',
      questionType: 'mcq',
      ansmarks: 1,
      difficulty: 'medium',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
      modelAnswer: '',
    });
    setSelectedQuestionId(null);
    setValidationErrors({});
  };

  // Save coding question to LOCAL STATE
  const handleSaveCodingQuestion = () => {
    const errors = validateCodingQuestion(currentCodingQuestion);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix validation errors');
      return;
    }

    // Check if we've reached the total question limit
    const totalCurrentQuestions = questions.length + codingQuestions.length;
    const totalAllowed = selectedExam?.totalQuestions || 0;
    
    if (!currentCodingQuestion.id && totalCurrentQuestions >= totalAllowed) {
      toast.error(`Cannot add more questions. Exam limit is ${totalAllowed} total questions (MCQ/Subjective + Coding combined).`);
      return;
    }

    if (currentCodingQuestion.id) {
      setCodingQuestions(codingQuestions.map(q => q.id === currentCodingQuestion.id ? { ...currentCodingQuestion } : q));
      toast.success('Coding question updated in draft');
    } else {
      const newQuestion = { ...currentCodingQuestion, id: ++questionIdCounter.current };
      setCodingQuestions([...codingQuestions, newQuestion]);
      toast.success('Coding question added to draft');
    }

    setHasUnsavedChanges(true);

    const draftKey = `examDraft_${selectedExamId}`;
    const updatedCodingQuestions = currentCodingQuestion.id 
      ? codingQuestions.map(q => q.id === currentCodingQuestion.id ? { ...currentCodingQuestion } : q)
      : [...codingQuestions, { ...currentCodingQuestion, id: questionIdCounter.current }];
    
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        examId: selectedExamId,
        questions: questions,
        codingQuestions: updatedCodingQuestions,
        lastSaved: new Date().toISOString(),
      })
    );

    setCurrentCodingQuestion({
      id: null,
      question: '',
      ansmarks: 10,
      problemDescription: '',
      sampleInput: '',
      sampleOutput: '',
      allowedLanguages: ['JavaScript', 'Python'],
    });
    setSelectedCodingQuestionId(null);
    setValidationErrors({});
  };

  // Select question for editing
  const handleSelectQuestion = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setCurrentQuestion({ ...question });
      setSelectedQuestionId(questionId);
      setValidationErrors({});
    }
  };

  // Select coding question for editing
  const handleSelectCodingQuestion = (questionId) => {
    const question = codingQuestions.find(q => q.id === questionId);
    if (question) {
      setCurrentCodingQuestion({ ...question });
      setSelectedCodingQuestionId(questionId);
      setValidationErrors({});
    }
  };

  // Delete question
  const handleDeleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(null);
      setCurrentQuestion({
        id: null,
        question: '',
        questionType: 'mcq',
        ansmarks: 1,
        difficulty: 'medium',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
        modelAnswer: '',
      });
    }
    toast.info('Question deleted');
  };

  // Delete coding question
  const handleDeleteCodingQuestion = (questionId) => {
    setCodingQuestions(codingQuestions.filter(q => q.id !== questionId));
    if (selectedCodingQuestionId === questionId) {
      setSelectedCodingQuestionId(null);
      setCurrentCodingQuestion({
        id: null,
        question: '',
        ansmarks: 10,
        problemDescription: '',
        sampleInput: '',
        sampleOutput: '',
        allowedLanguages: ['JavaScript', 'Python'],
      });
    }
    toast.info('Coding question deleted');
  };

  // Create new question
  const handleNewQuestion = () => {
    setCurrentQuestion({
      id: null,
      question: '',
      questionType: 'mcq',
      ansmarks: 1,
      difficulty: 'medium',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
      modelAnswer: '',
    });
    setSelectedQuestionId(null);
    setValidationErrors({});
  };

  // Create new coding question
  const handleNewCodingQuestion = () => {
    setCurrentCodingQuestion({
      id: null,
      question: '',
      ansmarks: 10,
      problemDescription: '',
      sampleInput: '',
      sampleOutput: '',
      allowedLanguages: ['JavaScript', 'Python'],
    });
    setSelectedCodingQuestionId(null);
    setValidationErrors({});
  };

  // Publish all questions to database (BATCH SAVE — sequential to preserve order)
  const handleSaveExam = async () => {
    if (selectedExam?.hasCodingRound && codingQuestions.length === 0) {
      toast.error('This exam requires coding questions. Please add at least one coding question before publishing.');
      return;
    }

    if (questions.length === 0 && codingQuestions.length === 0) {
      toast.error('Please add at least one question before publishing');
      return;
    }

    setIsPublishing(true);

    try {
      // ── Save MCQ/subjective questions SEQUENTIALLY to preserve order ──────────
      // Promise.all fires in parallel → identical createdAt → random sort order.
      // Sequential awaits guarantee createdAt strictly increases per question.
      for (const [index, q] of questions.entries()) {
        const payload = {
          examId: selectedExamId,
          question: q.question,
          questionType: q.questionType,
          ansmarks: q.ansmarks,
          sequenceNo: index,
        };

        if (q.questionType === 'mcq') {
          payload.options = q.options
            .filter(opt => opt.optionText.trim() !== '')
            .map(opt => ({ optionText: opt.optionText, isCorrect: opt.isCorrect }));
        } else {
          payload.modelAnswer = q.modelAnswer;
        }

        await createQuestion(payload).unwrap();
      }

      // ── Save coding questions sequentially too ──────────────────────────────
      for (const [index, q] of codingQuestions.entries()) {
        await createCodingQuestion({
          examId: selectedExamId,
          question: q.question,
          description: q.problemDescription,
          ansmarks: q.ansmarks,
          sampleInput: q.sampleInput || '',
          sampleOutput: q.sampleOutput || '',
          allowedLanguages: q.allowedLanguages,
          sequenceNo: questions.length + index,
        }).unwrap();
      }

      const draftKey = `examDraft_${selectedExamId}`;
      localStorage.removeItem(draftKey);
      
      toast.success(`Exam published successfully! ${questions.length + codingQuestions.length} questions added.`);
      
      setHasUnsavedChanges(false);
      setQuestions([]);
      setCodingQuestions([]);
      setLoadedFromDB(false);
      setCurrentQuestion({
        id: null, question: '', questionType: 'mcq', ansmarks: 1, difficulty: 'medium',
        options: [
          { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false },
        ],
        modelAnswer: '',
      });
      setCurrentCodingQuestion({
        id: null, question: '', ansmarks: 10, problemDescription: '',
        sampleInput: '', sampleOutput: '', allowedLanguages: ['JavaScript', 'Python'],
      });
      setSelectedQuestionId(null);
      setSelectedCodingQuestionId(null);
      
      refetchQuestions();
      refetchCodingQuestions();
    } catch (error) {
      console.error('Failed to publish exam:', error);
      toast.error('Failed to publish exam. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Discard draft
  const handleDiscardDraft = () => {
    if (window.confirm('Are you sure you want to discard all unsaved questions?')) {
      const draftKey = `examDraft_${selectedExamId}`;
      localStorage.removeItem(draftKey);
      
      setQuestions([]);
      setCodingQuestions([]);
      setCurrentQuestion({
        id: null,
        question: '',
        questionType: 'mcq',
        ansmarks: 1,
        difficulty: 'medium',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
        modelAnswer: '',
      });
      setCurrentCodingQuestion({
        id: null,
        question: '',
        ansmarks: 10,
        problemDescription: '',
        sampleInput: '',
        sampleOutput: '',
        allowedLanguages: ['JavaScript', 'Python'],
      });
      setSelectedQuestionId(null);
      setSelectedCodingQuestionId(null);
      setHasUnsavedChanges(false);
      
      toast.info('Draft discarded');
    }
  };

  return (
    <Box sx={{ height: { xs: 'auto', md: 'calc(100vh - 200px)' }, display: 'flex', flexDirection: 'column', gap: 2, pb: { xs: 4, md: 0 }, maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #ECECEC' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5, fontSize: { xs: '1.25rem', md: '2.125rem' }, color: '#003974', fontWeight: 600 }}>
              Question Builder {hasUnsavedChanges && <Chip label="Draft" size="small" sx={{ ml: 1, backgroundColor: '#FFF3CD', color: '#856404', fontWeight: 600 }} />}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 300 } }}>
                <Select
                  value={selectedExamId}
                  onChange={(e) => {
                    const newExamId = e.target.value;
                    
                    // Immediately clear all state when switching exams
                    setLoadedFromDB(false);
                    setQuestions([]);
                    setCodingQuestions([]);
                    setCurrentQuestion({
                      id: null,
                      question: '',
                      questionType: 'mcq',
                      ansmarks: 1,
                      difficulty: 'medium',
                      options: [
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false },
                      ],
                      modelAnswer: '',
                    });
                    setCurrentCodingQuestion({
                      id: null,
                      question: '',
                      ansmarks: 10,
                      problemDescription: '',
                      sampleInput: '',
                      sampleOutput: '',
                      allowedLanguages: ['JavaScript', 'Python'],
                    });
                    setSelectedQuestionId(null);
                    setSelectedCodingQuestionId(null);
                    setValidationErrors({});
                    setHasUnsavedChanges(false);
                    
                    // Now set the new exam
                    setSelectedExamId(newExamId);
                  }}
                  displayEmpty
                >
                  {examsData?.map((exam) => (
                    <MenuItem key={exam.examId} value={exam.examId}>
                      {exam.examName}
                      {exam.hasCodingRound && (
                        <Chip 
                          label="Coding" 
                          size="small" 
                          sx={{ ml: 1, backgroundColor: '#E0F2FE', color: '#003974', fontSize: '0.7rem' }} 
                        />
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`${questions.length} Questions`}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: '#003974',
                    color: '#003974',
                    fontWeight: 600,
                  }}
                />
                {selectedExam?.hasCodingRound && (
                  <Chip
                    label={`${codingQuestions.length} Coding`}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: '#ED1C24',
                      color: '#ED1C24',
                      fontWeight: 600,
                    }}
                  />
                )}
                {selectedExam?.totalQuestions && (
                  <Chip
                    label={`${questions.length + codingQuestions.length}/${selectedExam.totalQuestions} Total`}
                    variant="filled"
                    size="small"
                    sx={{
                      backgroundColor: (questions.length + codingQuestions.length) >= selectedExam.totalQuestions ? '#4CAF50' : '#FFF3CD',
                      color: (questions.length + codingQuestions.length) >= selectedExam.totalQuestions ? '#FFFFFF' : '#856404',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Stack>
            </Stack>
          </Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            {hasUnsavedChanges && (
              <Button
                variant="outlined"
                onClick={handleDiscardDraft}
                disabled={isPublishing}
                fullWidth
                size="small"
                sx={{ 
                  borderRadius: '8px',
                  borderColor: '#ED1C24',
                  color: '#ED1C24',
                  '&:hover': {
                    borderColor: '#C41E3A',
                    backgroundColor: '#FFF5F5',
                  }
                }}
              >
                Discard Draft
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon />}
              onClick={() => setBulkImportOpen(true)}
              disabled={!selectedExamId}
              fullWidth
              sx={{
                borderRadius: '8px',
                borderColor: '#003974',
                color: '#003974',
                '&:hover': { backgroundColor: '#e8f0fe' },
              }}
            >
              Import Questions
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveExam}
              disabled={(questions.length === 0 && codingQuestions.length === 0) || isPublishing}
              fullWidth
              sx={{ 
                borderRadius: '8px',
                backgroundColor: '#003974',
                color: '#FFFFFF',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#002a54',
                },
                '&:disabled': {
                  backgroundColor: '#ECECEC',
                  color: '#6B7280',
                }
              }}
            >
              {isPublishing ? 'Publishing...' : 'Publish Exam'}
            </Button>
          </Stack>
        </Stack>

        {selectedExam?.hasCodingRound && codingQuestions.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This exam requires coding questions. Please add at least one coding question before publishing.
          </Alert>
        )}
      </Paper>

      {/* Main content - different layouts based on whether exam has coding round */}
      {selectedExam?.hasCodingRound ? (
        /* Tabbed layout for exams with coding round */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
          {/* Tab buttons */}
          <Paper elevation={0} sx={{ p: 1, borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #ECECEC' }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant={selectedCodingQuestionId === null && selectedQuestionId !== null ? "contained" : (selectedCodingQuestionId === null && selectedQuestionId === null && questions.length > 0 ? "contained" : "outlined")}
                onClick={() => {
                  console.log('MCQ Tab clicked');
                  console.log('Current state:', { selectedQuestionId, selectedCodingQuestionId, questionsLength: questions.length, codingQuestionsLength: codingQuestions.length });
                  setSelectedCodingQuestionId(null);
                  if (questions.length > 0) {
                    handleSelectQuestion(questions[0].id);
                  } else {
                    setSelectedQuestionId(null);
                    handleNewQuestion();
                  }
                }}
                sx={{
                  borderRadius: '8px',
                  flex: 1,
                  ...((selectedCodingQuestionId === null && (selectedQuestionId !== null || questions.length > 0)) ? {
                    backgroundColor: '#003974',
                    color: '#FFFFFF',
                    '&:hover': { backgroundColor: '#002a54' },
                  } : {
                    borderColor: '#003974',
                    color: '#003974',
                    '&:hover': { backgroundColor: '#F0F7FF' },
                  })
                }}
              >
                MCQ / Subjective Questions ({questions.length})
              </Button>
              <Button
                variant={selectedCodingQuestionId !== null || (selectedCodingQuestionId === null && selectedQuestionId === null && codingQuestions.length === 0 && questions.length === 0) ? "contained" : "outlined"}
                onClick={() => {
                  console.log('Coding Tab clicked');
                  console.log('Current state:', { selectedQuestionId, selectedCodingQuestionId, questionsLength: questions.length, codingQuestionsLength: codingQuestions.length });
                  setSelectedQuestionId(null);
                  // Always show the coding form when this tab is clicked
                  if (codingQuestions.length > 0) {
                    handleSelectCodingQuestion(codingQuestions[0].id);
                  } else {
                    // Create a temporary ID to force the tab to show
                    setSelectedCodingQuestionId('new');
                    handleNewCodingQuestion();
                  }
                }}
                sx={{
                  borderRadius: '8px',
                  flex: 1,
                  ...(selectedCodingQuestionId !== null || (selectedCodingQuestionId === null && selectedQuestionId === null && codingQuestions.length === 0 && questions.length === 0) ? {
                    backgroundColor: '#ED1C24',
                    color: '#FFFFFF',
                    '&:hover': { backgroundColor: '#C41E3A' },
                  } : {
                    borderColor: '#ED1C24',
                    color: '#ED1C24',
                    '&:hover': { backgroundColor: '#FFF5F5' },
                  })
                }}
              >
                Coding Questions ({codingQuestions.length})
                {codingQuestions.length === 0 && <Chip label="Required" size="small" sx={{ ml: 1, backgroundColor: '#FFF3CD', color: '#856404' }} />}
              </Button>
            </Stack>
          </Paper>

          {selectedCodingQuestionId !== null || (selectedCodingQuestionId === null && selectedQuestionId === null && codingQuestions.length === 0 && questions.length === 0) ? (
            /* Coding Questions Tab Content */
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, flex: 1, overflow: 'hidden' }}>
              {/* Coding Question List */}
              <Paper elevation={0} sx={{ width: { xs: '100%', md: '25%' }, p: 2, borderRadius: '12px', overflow: 'auto', maxHeight: { xs: '300px', md: 'none' }, bgcolor: 'background.paper' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, fontWeight: 600 }}>
                    Coding Questions
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleNewCodingQuestion}
                    sx={{ color: '#ED1C24' }}
                  >
                    New
                  </Button>
                </Stack>

                {codingQuestions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No coding questions yet. Click "New" to create one.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {codingQuestions.map((q, index) => (
                      <Card
                        key={q.id}
                        elevation={0}
                        sx={{
                          cursor: 'pointer',
                          border: selectedCodingQuestionId === q.id ? 2 : 1,
                          borderColor: selectedCodingQuestionId === q.id ? '#ED1C24' : '#ECECEC',
                          bgcolor: selectedCodingQuestionId === q.id ? '#FFF5F5' : '#FFFFFF',
                          borderRadius: '8px',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: selectedCodingQuestionId === q.id ? '#FFF5F5' : '#F8F9FB',
                          },
                        }}
                        onClick={() => handleSelectCodingQuestion(q.id)}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                C{index + 1}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                CODING • {q.ansmarks} {q.ansmarks === 1 ? 'Mark' : 'Marks'}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCodingQuestion(q.id);
                              }}
                              sx={{
                                color: '#ED1C24',
                                '&:hover': { backgroundColor: '#FFF5F5' }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>

              {/* Coding Question Editor */}
              <Paper elevation={0} sx={{ width: { xs: '100%', md: '75%' }, p: { xs: 2, md: 3 }, pb: { xs: 3, md: 4 }, borderRadius: '12px', overflow: 'auto', bgcolor: 'background.paper' }}>
                <Typography variant="h5" sx={{ mb: 3, fontSize: { xs: '1.25rem', md: '1.5rem' }, color: '#ED1C24', fontWeight: 600 }}>
                  {currentCodingQuestion.id ? 'Edit Coding Question' : 'Create New Coding Question'}
                </Typography>

                <Stack spacing={3}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Question Title"
                      value={currentCodingQuestion.question}
                      onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, question: e.target.value })}
                      error={!!validationErrors.question}
                      helperText={validationErrors.question}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Marks"
                      type="number"
                      value={currentCodingQuestion.ansmarks}
                      onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, ansmarks: Number(e.target.value) })}
                      error={!!validationErrors.ansmarks}
                      helperText={validationErrors.ansmarks}
                      sx={{ width: '150px' }}
                      inputProps={{ min: 1 }}
                    />
                  </Stack>

                  <TextField
                    label="Problem Description"
                    multiline
                    rows={6}
                    value={currentCodingQuestion.problemDescription}
                    onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, problemDescription: e.target.value })}
                    error={!!validationErrors.problemDescription}
                    helperText={validationErrors.problemDescription || "Provide a detailed description of the coding problem"}
                    fullWidth
                    required
                  />

                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Sample Input"
                      multiline
                      rows={4}
                      value={currentCodingQuestion.sampleInput}
                      onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, sampleInput: e.target.value })}
                      fullWidth
                      helperText="Example input for the problem"
                    />
                    <TextField
                      label="Sample Output"
                      multiline
                      rows={4}
                      value={currentCodingQuestion.sampleOutput}
                      onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, sampleOutput: e.target.value })}
                      fullWidth
                      helperText="Expected output for the sample input"
                    />
                  </Stack>

                  <FormControl fullWidth error={!!validationErrors.allowedLanguages}>
                    <InputLabel>Allowed Programming Languages</InputLabel>
                    <Select
                      multiple
                      value={currentCodingQuestion.allowedLanguages}
                      onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, allowedLanguages: e.target.value })}
                      input={<OutlinedInput label="Allowed Programming Languages" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={value}
                              size="small"
                              sx={{ backgroundColor: '#E0F2FE', color: '#003974', fontWeight: 500 }}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="JavaScript">JavaScript</MenuItem>
                      <MenuItem value="Python">Python</MenuItem>
                      <MenuItem value="Java">Java</MenuItem>
                      <MenuItem value="C++">C++</MenuItem>
                      <MenuItem value="C">C</MenuItem>
                    </Select>
                    {validationErrors.allowedLanguages && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {validationErrors.allowedLanguages}
                      </Typography>
                    )}
                  </FormControl>

                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleNewCodingQuestion}
                      sx={{ 
                        borderRadius: '8px',
                        borderColor: '#6B7280',
                        color: '#6B7280',
                        '&:hover': { borderColor: '#4B5563', backgroundColor: '#F8F9FB' }
                      }}
                    >
                      Clear Form
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveCodingQuestion}
                      startIcon={<CheckCircleIcon />}
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#ED1C24',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#C41E3A' }
                      }}
                    >
                      {currentCodingQuestion.id ? 'Update Coding Question' : 'Save Coding Question'}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          ) : (
            /* MCQ/Subjective Questions Tab */
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, flex: 1, overflow: { xs: 'auto', md: 'hidden' } }}>
              {/* Column 1: Question List */}
              <Paper elevation={0} sx={{ width: { xs: '100%', md: '20%' }, p: 2, borderRadius: '12px', overflow: 'auto', bgcolor: 'background.paper', maxHeight: { xs: '300px', md: 'none' } }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  Questions
                </Typography>

                {questions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No questions yet. Use the form to create your first question.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {questions.map((q, index) => (
                      <Card
                        key={q.id}
                        elevation={0}
                        sx={{
                          cursor: 'pointer',
                          border: selectedQuestionId === q.id ? 2 : 1,
                          borderColor: selectedQuestionId === q.id ? '#003974' : '#ECECEC',
                          bgcolor: selectedQuestionId === q.id ? '#F0F7FF' : '#FFFFFF',
                          borderRadius: '8px',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: selectedQuestionId === q.id ? '#F0F7FF' : '#F8F9FB' },
                        }}
                        onClick={() => handleSelectQuestion(q.id)}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                Q{index + 1}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {q.questionType.toUpperCase()} • {q.ansmarks} {q.ansmarks === 1 ? 'Mark' : 'Marks'}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestion(q.id);
                              }}
                              sx={{ color: '#ED1C24', '&:hover': { backgroundColor: '#FFF5F5' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>

              {/* Column 2: Question Editor */}
              <Paper elevation={0} sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 2, md: 3 }, pb: { xs: 3, md: 4 }, borderRadius: '12px', overflow: 'auto', bgcolor: 'background.paper', boxShadow: 'inset 0 -8px 10px -6px rgba(0, 0, 0, 0.15)' }}>
                <Typography variant="h5" sx={{ mb: { xs: 2, md: 3 }, color: '#003974', fontWeight: 600, fontSize: { xs: '1.125rem', md: '1.5rem' } }}>
                  {currentQuestion.id ? 'Edit Question' : 'Create New Question'}
                </Typography>

                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Question Type</InputLabel>
                      <Select
                        value={currentQuestion.questionType}
                        label="Question Type"
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionType: e.target.value })}
                      >
                        <MenuItem value="mcq">Multiple Choice (MCQ)</MenuItem>
                        <MenuItem value="subjective">Subjective (Essay)</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Marks"
                      type="number"
                      value={currentQuestion.ansmarks}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, ansmarks: Number(e.target.value) })}
                      error={!!validationErrors.ansmarks}
                      helperText={validationErrors.ansmarks}
                      sx={{ width: { xs: '100%', md: '150px' } }}
                      inputProps={{ min: 1 }}
                    />

                    <FormControl sx={{ width: { xs: '100%', md: '150px' } }}>
                      <InputLabel>Difficulty</InputLabel>
                      <Select
                        value={currentQuestion.difficulty}
                        label="Difficulty"
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })}
                      >
                        <MenuItem value="easy">Easy</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="hard">Hard</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>

                  <TextField
                    label="Question Text"
                    multiline
                    rows={4}
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                    error={!!validationErrors.question}
                    helperText={validationErrors.question}
                    fullWidth
                    required
                  />

                  {currentQuestion.questionType === 'mcq' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        Options (select the correct answer)
                      </Typography>
                      <Stack spacing={2}>
                        {currentQuestion.options.map((option, index) => (
                          <Stack
                            key={index}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{
                              p: 1.5,
                              borderRadius: '8px',
                              border: 1,
                              borderColor: option.isCorrect ? 'success.main' : 'divider',
                              bgcolor: option.isCorrect ? 'success.light' : 'transparent',
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: option.isCorrect ? 'success.light' : 'grey.100',
                              },
                            }}
                          >
                            <Radio
                              checked={option.isCorrect}
                              onChange={() => handleOptionChange(index, 'isCorrect', true)}
                              sx={{
                                color: option.isCorrect ? '#4CAF50' : 'default',
                                '&.Mui-checked': {
                                  color: '#4CAF50',
                                }
                              }}
                            />
                            <TextField
                              placeholder={`Option ${index + 1}`}
                              value={option.optionText}
                              onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                              fullWidth
                              size="small"
                              variant="outlined"
                            />
                            {option.isCorrect ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Correct Answer"
                                color="success"
                                size="small"
                                sx={{ minWidth: '140px' }}
                              />
                            ) : (
                              <Box
                                onClick={() => handleOptionChange(index, 'isCorrect', true)}
                                sx={{
                                  minWidth: '140px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  py: 0.5,
                                  px: 1,
                                  borderRadius: '4px',
                                  transition: 'all 0.2s',
                                  color: '#6B7280',
                                  '&:hover': {
                                    bgcolor: '#F0F7FF',
                                    color: '#003974',
                                  },
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="inherit"
                                  sx={{ fontWeight: 500 }}
                                >
                                  Mark as correct
                                </Typography>
                              </Box>
                            )}
                            {currentQuestion.options.length > 2 && (
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveOption(index)}
                                sx={{
                                  color: '#ED1C24',
                                  '&:hover': {
                                    backgroundColor: '#FFF5F5',
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Stack>
                        ))}
                      </Stack>

                      {validationErrors.options && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {validationErrors.options}
                        </Alert>
                      )}
                      {validationErrors.correctAnswer && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {validationErrors.correctAnswer}
                        </Alert>
                      )}

                      {currentQuestion.options.length < 8 && (
                        <Button
                          startIcon={<AddIcon />}
                          onClick={handleAddOption}
                          sx={{ 
                            mt: 2,
                            borderColor: '#003974',
                            color: '#003974',
                            '&:hover': {
                              borderColor: '#002a54',
                              backgroundColor: '#F0F7FF',
                            }
                          }}
                          variant="outlined"
                          size="small"
                        >
                          Add Option
                        </Button>
                      )}
                    </Box>
                  )}

                  {currentQuestion.questionType === 'subjective' && (
                    <TextField
                      label="Model Answer (for AI Grading)"
                      multiline
                      rows={6}
                      value={currentQuestion.modelAnswer}
                      onChange={(e) =>
                        setCurrentQuestion({ ...currentQuestion, modelAnswer: e.target.value })
                      }
                      error={!!validationErrors.modelAnswer}
                      helperText={validationErrors.modelAnswer}
                      fullWidth
                      required
                    />
                  )}

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="flex-end" sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleNewQuestion}
                      sx={{ 
                        borderRadius: '8px',
                        borderColor: '#6B7280',
                        color: '#6B7280',
                        minHeight: { xs: '44px', md: 'auto' },
                        width: { xs: '100%', md: 'auto' },
                        '&:hover': {
                          borderColor: '#4B5563',
                          backgroundColor: '#F8F9FB',
                        }
                      }}
                    >
                      Clear Form
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveQuestion}
                      startIcon={<CheckCircleIcon />}
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#003974',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        minHeight: { xs: '44px', md: 'auto' },
                        width: { xs: '100%', md: 'auto' },
                        '&:hover': {
                          backgroundColor: '#002a54',
                        }
                      }}
                    >
                      {currentQuestion.id ? 'Update Question' : 'Save Question'}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              {/* Column 3: Live Preview */}
              <Paper elevation={0} sx={{ width: { xs: '100%', md: '30%' }, p: { xs: 2, md: 3 }, borderRadius: '12px', overflow: 'auto', bgcolor: 'grey.100' }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', md: '1.25rem' }, color: '#003974', fontWeight: 600 }}>
                  Student View Preview
                </Typography>

                {currentQuestion.question ? (
                  <Card elevation={0} sx={{ borderRadius: '8px' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Chip
                              label={currentQuestion.questionType.toUpperCase()}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: '#003974',
                                color: '#003974',
                                fontWeight: 600,
                              }}
                            />
                            <Chip
                              label={`${currentQuestion.ansmarks} ${currentQuestion.ansmarks === 1 ? 'Mark' : 'Marks'}`}
                              size="small"
                              sx={{
                                backgroundColor: '#F0F7FF',
                                color: '#003974',
                                fontWeight: 600,
                              }}
                            />
                          </Stack>
                          <Typography variant="body1">{currentQuestion.question}</Typography>
                        </Box>

                        <Divider />

                        {currentQuestion.questionType === 'mcq' ? (
                          <RadioGroup>
                            {currentQuestion.options
                              .filter((opt) => opt.optionText.trim() !== '')
                              .map((option, index) => (
                                <FormControlLabel
                                  key={index}
                                  value={index}
                                  control={<Radio />}
                                  label={option.optionText}
                                />
                              ))}
                          </RadioGroup>
                        ) : (
                          <TextField
                            placeholder="Student will type their answer here..."
                            multiline
                            rows={6}
                            fullWidth
                            disabled
                          />
                        )}

                        <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="caption" color="text.secondary">
                            Estimated Time: {currentQuestion.questionType === 'mcq' ? '1-2' : '3-5'} min
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '200px',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Preview will appear here as you create your question
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      ) : (
        /* Standard 3-column layout for exams WITHOUT coding round */
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, flex: 1, overflow: { xs: 'auto', md: 'hidden' } }}>
          {/* Same 3-column layout as above */}
          <Paper elevation={0} sx={{ width: { xs: '100%', md: '20%' }, p: 2, borderRadius: '12px', overflow: 'auto', bgcolor: 'background.paper', maxHeight: { xs: '300px', md: 'none' } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Questions
            </Typography>

            {questions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No questions yet. Use the form to create your first question.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {questions.map((q, index) => (
                  <Card
                    key={q.id}
                    elevation={0}
                    sx={{
                      cursor: 'pointer',
                      border: selectedQuestionId === q.id ? 2 : 1,
                      borderColor: selectedQuestionId === q.id ? '#003974' : '#ECECEC',
                      bgcolor: selectedQuestionId === q.id ? '#F0F7FF' : '#FFFFFF',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: selectedQuestionId === q.id ? '#F0F7FF' : '#F8F9FB' },
                    }}
                    onClick={() => handleSelectQuestion(q.id)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Q{index + 1}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {q.questionType.toUpperCase()} • {q.ansmarks} {q.ansmarks === 1 ? 'Mark' : 'Marks'}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(q.id);
                          }}
                          sx={{ color: '#ED1C24', '&:hover': { backgroundColor: '#FFF5F5' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>

          <Paper elevation={0} sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 2, md: 3 }, pb: { xs: 3, md: 4 }, borderRadius: '12px', overflow: 'auto', bgcolor: 'background.paper', boxShadow: 'inset 0 -8px 10px -6px rgba(0, 0, 0, 0.15)' }}>
            <Typography variant="h5" sx={{ mb: 3, fontSize: { xs: '1.25rem', md: '1.5rem' }, color: '#003974', fontWeight: 600 }}>
              {currentQuestion.id ? 'Edit Question' : 'Create New Question'}
            </Typography>

            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Question Type</InputLabel>
                  <Select
                    value={currentQuestion.questionType}
                    label="Question Type"
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionType: e.target.value })}
                  >
                    <MenuItem value="mcq">Multiple Choice (MCQ)</MenuItem>
                    <MenuItem value="subjective">Subjective (Essay)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Marks"
                  type="number"
                  value={currentQuestion.ansmarks}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, ansmarks: Number(e.target.value) })}
                  error={!!validationErrors.ansmarks}
                  helperText={validationErrors.ansmarks}
                  sx={{ width: '150px' }}
                  inputProps={{ min: 1 }}
                />

                <FormControl sx={{ width: '150px' }}>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={currentQuestion.difficulty}
                    label="Difficulty"
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })}
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <TextField
                label="Question Text"
                multiline
                rows={4}
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                error={!!validationErrors.question}
                helperText={validationErrors.question}
                fullWidth
                required
              />

              {currentQuestion.questionType === 'mcq' && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Options (select the correct answer)
                  </Typography>
                  <Stack spacing={2}>
                    {currentQuestion.options.map((option, index) => (
                      <Stack
                        key={index}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                          p: 1.5,
                          borderRadius: '8px',
                          border: 1,
                          borderColor: option.isCorrect ? 'success.main' : 'divider',
                          bgcolor: option.isCorrect ? 'success.light' : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: option.isCorrect ? 'success.light' : 'grey.100',
                          },
                        }}
                      >
                        <Radio
                          checked={option.isCorrect}
                          onChange={() => handleOptionChange(index, 'isCorrect', true)}
                          sx={{
                            color: option.isCorrect ? '#4CAF50' : 'default',
                            '&.Mui-checked': {
                              color: '#4CAF50',
                            }
                          }}
                        />
                        <TextField
                          placeholder={`Option ${index + 1}`}
                          value={option.optionText}
                          onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                          fullWidth
                          size="small"
                          variant="outlined"
                        />
                        {option.isCorrect ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Correct Answer"
                            color="success"
                            size="small"
                            sx={{ minWidth: '140px' }}
                          />
                        ) : (
                          <Box
                            onClick={() => handleOptionChange(index, 'isCorrect', true)}
                            sx={{
                              minWidth: '140px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              py: 0.5,
                              px: 1,
                              borderRadius: '4px',
                              transition: 'all 0.2s',
                              color: '#6B7280',
                              '&:hover': {
                                bgcolor: '#F0F7FF',
                                color: '#003974',
                              },
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="inherit"
                              sx={{ fontWeight: 500 }}
                            >
                              Mark as correct
                            </Typography>
                          </Box>
                        )}
                        {currentQuestion.options.length > 2 && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveOption(index)}
                            sx={{
                              color: '#ED1C24',
                              '&:hover': {
                                backgroundColor: '#FFF5F5',
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Stack>
                    ))}
                  </Stack>

                  {validationErrors.options && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {validationErrors.options}
                    </Alert>
                  )}
                  {validationErrors.correctAnswer && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {validationErrors.correctAnswer}
                    </Alert>
                  )}

                  {currentQuestion.options.length < 8 && (
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddOption}
                      sx={{ 
                        mt: 2,
                        minHeight: { xs: '44px', md: 'auto' },
                        width: '100%',
                        borderColor: '#003974',
                        color: '#003974',
                        '&:hover': {
                          borderColor: '#002a54',
                          backgroundColor: '#F0F7FF',
                        }
                      }}
                      variant="outlined"
                      size="small"
                    >
                      Add Option
                    </Button>
                  )}
                </Box>
              )}

              {currentQuestion.questionType === 'subjective' && (
                <TextField
                  label="Model Answer (for AI Grading)"
                  multiline
                  rows={6}
                  value={currentQuestion.modelAnswer}
                  onChange={(e) =>
                    setCurrentQuestion({ ...currentQuestion, modelAnswer: e.target.value })
                  }
                  error={!!validationErrors.modelAnswer}
                  helperText={validationErrors.modelAnswer}
                  fullWidth
                  required
                />
              )}

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="flex-end" sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Button 
                  variant="outlined" 
                  onClick={handleNewQuestion}
                  sx={{ 
                    borderRadius: '8px',
                    borderColor: '#6B7280',
                    color: '#6B7280',
                    minHeight: { xs: '44px', md: 'auto' },
                    width: { xs: '100%', md: 'auto' },
                    '&:hover': {
                      borderColor: '#4B5563',
                      backgroundColor: '#F8F9FB',
                    }
                  }}
                >
                  Clear Form
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveQuestion}
                  startIcon={<CheckCircleIcon />}
                  sx={{ 
                    borderRadius: '8px',
                    backgroundColor: '#003974',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    minHeight: { xs: '44px', md: 'auto' },
                    width: { xs: '100%', md: 'auto' },
                    '&:hover': {
                      backgroundColor: '#002a54',
                    }
                  }}
                >
                  {currentQuestion.id ? 'Update Question' : 'Save Question'}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ width: { xs: '100%', md: '30%' }, p: { xs: 2, md: 3 }, borderRadius: '12px', overflow: 'auto', bgcolor: 'grey.100' }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', md: '1.25rem' }, color: '#003974', fontWeight: 600 }}>
              Student View Preview
            </Typography>

            {currentQuestion.question ? (
              <Card elevation={0} sx={{ borderRadius: '8px' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Chip
                          label={currentQuestion.questionType.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: '#003974',
                            color: '#003974',
                            fontWeight: 600,
                          }}
                        />
                        <Chip
                          label={`${currentQuestion.ansmarks} ${currentQuestion.ansmarks === 1 ? 'Mark' : 'Marks'}`}
                          size="small"
                          sx={{
                            backgroundColor: '#F0F7FF',
                            color: '#003974',
                            fontWeight: 600,
                          }}
                        />
                      </Stack>
                      <Typography variant="body1">{currentQuestion.question}</Typography>
                    </Box>

                    <Divider />

                    {currentQuestion.questionType === 'mcq' ? (
                      <RadioGroup>
                        {currentQuestion.options
                          .filter((opt) => opt.optionText.trim() !== '')
                          .map((option, index) => (
                            <FormControlLabel
                              key={index}
                              value={index}
                              control={<Radio />}
                              label={option.optionText}
                            />
                          ))}
                      </RadioGroup>
                    ) : (
                      <TextField
                        placeholder="Student will type their answer here..."
                        multiline
                        rows={6}
                        fullWidth
                        disabled
                      />
                    )}

                    <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        Estimated Time: {currentQuestion.questionType === 'mcq' ? '1-2' : '3-5'} min
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Preview will appear here as you create your question
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        examId={selectedExamId}
        onImported={() => {
          setLoadedFromDB(false);
          refetchQuestions();
          refetchCodingQuestions();
        }}
      />
    </Box>
  );
};

export default AddQuestionFormRefactored;
