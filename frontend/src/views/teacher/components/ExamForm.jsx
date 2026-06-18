import React from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  OutlinedInput,
  Switch,
  FormControlLabel,
  Collapse,
  Divider,
} from '@mui/material';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'All'];
const CLASSES = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate', 'All'];
const PROGRAMMING_LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++', 'C', 'Go', 'Ruby'];

const CreateExam = ({ formik, title, subtitle, subtext }) => {
  const { values, errors, touched, handleChange, handleSubmit, setFieldValue } = formik;

  return (
    <>
      {title}
      {subtext}

      <Box component="form">
        <Stack spacing={3}>
          <CustomTextField
            id="examName"
            name="examName"
            label="Exam Name"
            variant="outlined"
            fullWidth
            value={values.examName}
            onChange={handleChange}
            error={touched.examName && Boolean(errors.examName)}
            helperText={touched.examName && errors.examName}
          />

          <CustomTextField
            id="totalQuestions"
            name="totalQuestions"
            label="Total Number of Questions"
            variant="outlined"
            fullWidth
            value={values.totalQuestions}
            onChange={handleChange}
            error={touched.totalQuestions && Boolean(errors.totalQuestions)}
            helperText={touched.totalQuestions && errors.totalQuestions}
          />

          <CustomTextField
            id="duration"
            name="duration"
            label="Exam Duration (minutes)"
            variant="outlined"
            fullWidth
            value={values.duration}
            onChange={handleChange}
            error={touched.duration && Boolean(errors.duration)}
            helperText={touched.duration && errors.duration}
          />

          {/* Coding Round Section */}
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={values.hasCodingRound || false}
                  onChange={(e) => setFieldValue('hasCodingRound', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#003974',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#003974',
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F2242' }}>
                    Enable Coding Round
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    Students will be able to write and submit code during the exam
                  </Typography>
                </Box>
              }
            />
            <Divider sx={{ mt: 2 }} />
          </Box>

          <FormControl fullWidth>
            <InputLabel id="departments-label">Allowed Departments</InputLabel>
            <Select
              labelId="departments-label"
              id="allowedDepartments"
              name="allowedDepartments"
              multiple
              value={values.allowedDepartments || ['All']}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('All') && !values.allowedDepartments?.includes('All')) {
                  setFieldValue('allowedDepartments', ['All']);
                } else if (value.includes('All')) {
                  setFieldValue('allowedDepartments', value.filter(v => v !== 'All'));
                } else {
                  setFieldValue('allowedDepartments', value);
                }
              }}
              input={<OutlinedInput label="Allowed Departments" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={value} 
                      size="small"
                      sx={{
                        backgroundColor: '#F0F7FF',
                        color: '#003974',
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  sx: {
                    '& .MuiMenuItem-root.Mui-selected': {
                      backgroundColor: '#F0F7FF',
                      '&:hover': {
                        backgroundColor: '#E1EFFF',
                      }
                    },
                    '& .MuiMenuItem-root:hover': {
                      backgroundColor: '#F8F9FB',
                    }
                  }
                }
              }}
            >
              {DEPARTMENTS.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="classes-label">Allowed Classes</InputLabel>
            <Select
              labelId="classes-label"
              id="allowedClasses"
              name="allowedClasses"
              multiple
              value={values.allowedClasses || ['All']}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('All') && !values.allowedClasses?.includes('All')) {
                  setFieldValue('allowedClasses', ['All']);
                } else if (value.includes('All')) {
                  setFieldValue('allowedClasses', value.filter(v => v !== 'All'));
                } else {
                  setFieldValue('allowedClasses', value);
                }
              }}
              input={<OutlinedInput label="Allowed Classes" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={value} 
                      size="small"
                      sx={{
                        backgroundColor: '#F0F7FF',
                        color: '#003974',
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  sx: {
                    '& .MuiMenuItem-root.Mui-selected': {
                      backgroundColor: '#F0F7FF',
                      '&:hover': {
                        backgroundColor: '#E1EFFF',
                      }
                    },
                    '& .MuiMenuItem-root:hover': {
                      backgroundColor: '#F8F9FB',
                    }
                  }
                }
              }}
            >
              {CLASSES.map((cls) => (
                <MenuItem key={cls} value={cls}>
                  {cls}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <CustomTextField
            id="liveDate"
            name="liveDate"
            label="Live Date and Time"
            type="datetime-local"
            variant="outlined"
            fullWidth
            value={values.liveDate}
            onChange={handleChange}
            error={touched.liveDate && Boolean(errors.liveDate)}
            helperText={touched.liveDate && errors.liveDate}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <CustomTextField
            id="deadDate"
            name="deadDate"
            label="Dead Date and Time"
            type="datetime-local"
            variant="outlined"
            fullWidth
            value={values.deadDate}
            onChange={handleChange}
            error={touched.deadDate && Boolean(errors.deadDate)}
            helperText={touched.deadDate && errors.deadDate}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            type="submit"
            disabled={formik.isSubmitting}
            onClick={handleSubmit}
            sx={{ 
              borderRadius: '8px', 
              mt: 2,
              backgroundColor: '#003974',
              color: '#FFFFFF',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              py: 1.5,
              '&:hover': {
                backgroundColor: '#002a54',
              },
              '&:disabled': {
                backgroundColor: '#ECECEC',
                color: '#6B7280',
              }
            }}
          >
            Create Exam
          </Button>
        </Stack>
      </Box>

      {subtitle}
    </>
  );
};

export default CreateExam;
