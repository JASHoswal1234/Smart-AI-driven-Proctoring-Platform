import React from 'react';
import { Grid, Box, Card, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import ExamForm from './components/ExamForm';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCreateExamMutation } from '../../slices/examApiSlice.js';

const examValidationSchema = yup.object({
  examName: yup.string().required('Exam Name is required'),
  totalQuestions: yup
    .number()
    .typeError('Total Number of Questions must be a number')
    .integer('Total Number of Questions must be an integer')
    .positive('Total Number of Questions must be positive')
    .required('Total Number of Questions is required'),
  duration: yup
    .number()
    .typeError('Exam Duration must be a number')
    .integer('Exam Duration must be an integer')
    .min(1, 'Exam Duration must be at least 1 minute')
    .required('Exam Duration is required'),
  liveDate: yup.date().required('Live Date and Time is required'),
  deadDate: yup.date().required('Dead Date and Time is required'),
});

const CreateExamPage = () => {
  const [createExam] = useCreateExamMutation();

  const initialExamValues = {
    examName: '',
    totalQuestions: '',
    duration: '',
    liveDate: '',
    deadDate: '',
    allowedDepartments: ['All'],
    allowedClasses: ['All'],
    hasCodingRound: false,
  };

  const handleSubmit = async (values) => {
    try {
      // Normalize dates: liveDate starts at 00:00:00 local time, deadDate ends at 23:59:59 local time
      // This ensures "June 25" means the exam is available ALL of June 25 regardless of timezone
      const normalizeStart = (dateStr) => {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      };
      const normalizeEnd = (dateStr) => {
        const d = new Date(dateStr);
        d.setHours(23, 59, 59, 999);
        return d.toISOString();
      };

      const payload = {
        ...values,
        liveDate: normalizeStart(values.liveDate),
        deadDate: normalizeEnd(values.deadDate),
      };

      const examResponse = await createExam(payload).unwrap();
      console.log('Exam Response:', examResponse);

      if (examResponse) {
        toast.success('Exam created successfully');
        formik.resetForm();
      }
    } catch (err) {
      console.error('Exam Creation Error:', err);
      toast.error(err?.data?.message || err.error || 'Failed to create exam');
    }
  };

  const formik = useFormik({
    initialValues: initialExamValues,
    validationSchema: examValidationSchema,
    onSubmit: handleSubmit,
  });

  return (
    <PageContainer title="Create Exam" description="Create a new exam">
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', p: 3 }}>
        <Card 
          elevation={0} 
          sx={{ 
            p: 4, 
            width: '100%', 
            maxWidth: '700px',
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            backgroundColor: '#FFFFFF'
          }}
        >
          <ExamForm
            formik={formik}
            title={
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#003974',
                  fontWeight: 600,
                  mb: 3 
                }}
              >
                Create New Exam
              </Typography>
            }
          />
        </Card>
      </Box>
    </PageContainer>
  );
};

export default CreateExamPage;
