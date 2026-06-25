import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Typography, Stack, CircularProgress,
  Divider, useMediaQuery, useTheme,
  Button, InputAdornment, Select, MenuItem, FormControl,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from '../../components/forms/theme-elements/CustomTextField';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation } from './../../slices/usersApiSlice';
import { setCredentials } from './../../slices/authSlice';
import { toast } from 'react-toastify';
import { fieldSx, labelSx, AuthFooter, MobileLogo } from './Login';

const FEATURES = [
  {
    icon: ShieldOutlinedIcon,
    title: 'AI Proctoring',
    desc: 'Real-time monitoring to maintain examination integrity.',
  },
  {
    icon: AutoAwesomeOutlinedIcon,
    title: 'Automated Evaluation',
    desc: 'Instant assessment and intelligent answer evaluation.',
  },
  {
    icon: BarChartOutlinedIcon,
    title: 'Performance Analytics',
    desc: 'Comprehensive reports and detailed candidate insights.',
  },
];

// ── Left panel — Register (features) ─────────────────────────────────────────
const RegisterLeftPanel = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  return (
    <Grid item md={5} lg={5}
      sx={{
        backgroundColor: '#003974',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        p: { md: 6, lg: 8 },
        position: 'relative', overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: -100, left: -60, width: 360, height: 360, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

      <Box
        sx={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {/* Logo */}
        <Stack direction="row" alignItems="center" spacing={2} mb={6}>
          <Box sx={{ width: 64, height: 64, borderRadius: '14px', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="ProctAI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: '2rem', letterSpacing: '-1px', lineHeight: 1 }}>
              ProctAI
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
              AI-Powered Assessment Platform
            </Typography>
          </Box>
        </Stack>

        <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem', mb: 4, color: 'rgba(255,255,255,0.85)' }}>
          Everything you need for secure, smart assessments
        </Typography>

        {/* Feature cards */}
        <Stack spacing={2.5}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Box
              key={title}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                p: 2.5,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                  <Icon sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#fff" mb={0.4}>{title}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{desc}</Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>

       
      </Box>
    </Grid>
  );
};

// ── Validation ────────────────────────────────────────────────────────────────
const validationSchema = yup.object({
  name: yup.string().min(2).max(25).required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  confirm_password: yup.string().required('Please confirm your password')
    .oneOf([yup.ref('password'), null], 'Passwords must match'),
  role: yup.string().oneOf(['student', 'teacher']).required('Role is required'),
});

// ── Register page ─────────────────────────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [register, { isLoading }] = useRegisterMutation();
  const { userInfo } = useSelector((s) => s.auth);

  useEffect(() => { if (userInfo) navigate('/'); }, [navigate, userInfo]);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', confirm_password: '', role: 'student' },
    validationSchema,
    onSubmit: async ({ name, email, password, confirm_password, role }) => {
      if (password !== confirm_password) { toast.error('Passwords do not match'); return; }
      try {
        const res = await register({ name, email, password, role }).unwrap();
        dispatch(setCredentials({ ...res }));
        formik.resetForm();
        navigate('/auth/login');
      } catch (err) {
        toast.error(err?.data?.message || err.error || 'Registration failed');
      }
    },
  });

  return (
    <PageContainer title="Create Account — ProctAI" description="Register to ProctAI">
      <Grid container sx={{ minHeight: '100vh' }}>
        {!isMobile && <RegisterLeftPanel />}

        {/* Right — form */}
        <Grid item xs={12} md={7} lg={7}
          sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            p: { xs: 3, sm: 5, md: 6 },
            backgroundColor: '#fff',
            overflowY: 'auto',
          }}
        >
          {isMobile && <MobileLogo />}

          <Box sx={{ width: '100%', maxWidth: 420 }}>
            <Box mb={4}>
              <Typography variant="h4" fontWeight={800} color="#0F2242" mb={0.5}>Create account</Typography>
              <Typography variant="body2" color="text.secondary">Sign up to get started with ProctAI.</Typography>
            </Box>

            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={2.5}>

                {/* Name */}
                <Box>
                  <Typography component="label" htmlFor="name" sx={labelSx}>Full Name</Typography>
                  <CustomTextField
                    id="name" name="name" placeholder="John Doe"
                    value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    fullWidth sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                  />
                </Box>

                {/* Email */}
                <Box>
                  <Typography component="label" htmlFor="reg-email" sx={labelSx}>Email Address</Typography>
                  <CustomTextField
                    id="reg-email" name="email" type="email" placeholder="you@example.com"
                    value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    fullWidth sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                  />
                </Box>

                {/* Password */}
                <Box>
                  <Typography component="label" htmlFor="reg-password" sx={labelSx}>Password</Typography>
                  <CustomTextField
                    id="reg-password" name="password" type="password" placeholder="Min. 6 characters"
                    value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    fullWidth sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                  />
                </Box>

                {/* Confirm password */}
                <Box>
                  <Typography component="label" htmlFor="confirm_password" sx={labelSx}>Confirm Password</Typography>
                  <CustomTextField
                    id="confirm_password" name="confirm_password" type="password" placeholder="Re-enter password"
                    value={formik.values.confirm_password} onChange={formik.handleChange} onBlur={formik.handleBlur}
                    error={formik.touched.confirm_password && Boolean(formik.errors.confirm_password)}
                    helperText={formik.touched.confirm_password && formik.errors.confirm_password}
                    fullWidth sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                  />
                </Box>

                {/* Role */}
                <Box>
                  <Typography component="label" htmlFor="role" sx={labelSx}>I am a</Typography>
                  <FormControl fullWidth>
                    <Select
                      id="role" name="role"
                      value={formik.values.role}
                      onChange={formik.handleChange}
                      startAdornment={<InputAdornment position="start"><BadgeOutlinedIcon sx={{ fontSize: 18, color: '#9ca3af', ml: 0.5 }} /></InputAdornment>}
                      sx={{
                        borderRadius: '10px',
                        backgroundColor: '#f9fafb',
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#003974' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#003974', borderWidth: '1.5px' },
                      }}
                    >
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="teacher">Teacher / Educator</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Submit */}
                <Button
                  type="submit" variant="contained" fullWidth disabled={isLoading}
                  sx={{
                    backgroundColor: '#003974', borderRadius: '10px', py: 1.4,
                    fontWeight: 700, fontSize: '0.95rem', textTransform: 'none', boxShadow: 'none',
                    '&:hover': { backgroundColor: '#002a54', boxShadow: 'none' },
                  }}
                >
                  {isLoading
                    ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={18} sx={{ color: '#fff' }} /><span>Creating account...</span></Stack>
                    : 'Create Account'
                  }
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 3, borderColor: '#f0f0f0' }} />
            <Stack direction="row" spacing={0.75} justifyContent="center">
              <Typography variant="body2" color="text.secondary">Already have an account?</Typography>
              <Typography component={Link} to="/auth/login" variant="body2"
                sx={{ color: '#003974', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Sign in
              </Typography>
            </Stack>

            <AuthFooter />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Register;
