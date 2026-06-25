import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Typography, Stack, CircularProgress,
  Divider, useMediaQuery, useTheme,
  Button, FormGroup, FormControlLabel, Checkbox, InputAdornment,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from '../../components/forms/theme-elements/CustomTextField';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from './../../slices/usersApiSlice';
import { setCredentials } from './../../slices/authSlice';
import { toast } from 'react-toastify';

// ── Quotes ────────────────────────────────────────────────────────────────────
const QUOTES = [
  {
    bold: '"Every great achievement begins with an honest attempt."',
    sub: 'Your knowledge, preparation, and integrity define your success.\nWe wish you the very best for your assessment.',
  },
  {
    bold: '"Success is earned through preparation and integrity."',
    sub: 'Focus on giving your best — we\'ll take care of providing a secure,\nfair, and distraction-free examination experience.',
  },
  {
    bold: '"The future belongs to those who are prepared for it today."',
    sub: 'Approach every examination with confidence, honesty,\nand determination. Wishing you success.',
  },
  {
    bold: '"Integrity. Knowledge. Excellence."',
    sub: 'Every honest attempt is another step toward building your future.',
  },
  {
    bold: '"Believe in your preparation. Give your best."',
    sub: 'Trust your learning, stay focused, and let your hard work speak for itself.',
  },
  {
    bold: '"Stay calm. Stay focused. Trust your preparation."',
    sub: 'Every examination is an opportunity to learn, grow,\nand move one step closer to your goals.',
  },
  {
    bold: '"Excellence is not achieved by chance — it is earned through consistent effort."',
    sub: 'Your dedication today shapes the opportunities of tomorrow.',
  },
  {
    bold: '"Your integrity is as important as your knowledge."',
    sub: 'Every honest examination reflects your true potential and character.',
  },
];

// ── Shared styles (exported for Register) ─────────────────────────────────────
export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#f9fafb',
    '&:hover fieldset': { borderColor: '#003974' },
    '&.Mui-focused fieldset': { borderColor: '#003974', borderWidth: '1.5px' },
  },
};

export const labelSx = {
  display: 'block',
  mb: 0.75,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#374151',
};

export const AuthFooter = () => (
  <Stack direction="row" spacing={2} justifyContent="center" mt={5}>
    {['© ProctAI', 'Privacy Policy', 'Terms of Service'].map((item, i) => (
      <Typography key={item} variant="caption"
        sx={{ color: '#9ca3af', cursor: i > 0 ? 'pointer' : 'default', '&:hover': i > 0 ? { color: '#003974' } : {} }}>
        {item}
      </Typography>
    ))}
  </Stack>
);

// ── Left panel — Login (motivational quote) ────────────────────────────────────
export const LoginLeftPanel = () => {
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);
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
      {/* Subtle bg circles */}
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
        <Stack direction="row" alignItems="center" spacing={2} mb={7}>
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

        {/* Quote */}
        <Box sx={{ borderLeft: '3px solid rgba(255,255,255,0.25)', pl: 3 }}>
          <Typography
            sx={{
              fontWeight: 800,
              color: '#fff',
              fontSize: { md: '1.15rem', lg: '1.3rem' },
              lineHeight: 1.45,
              mb: 2,
              fontStyle: 'italic',
            }}
          >
            {quote.bold}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
            }}
          >
            {quote.sub}
          </Typography>
        </Box>

        {/* Trust line */}
       
      </Box>
    </Grid>
  );
};

// ── Mobile logo ───────────────────────────────────────────────────────────────
export const MobileLogo = () => (
  <Stack direction="row" alignItems="center" spacing={1.5} mb={4}>
    <Box sx={{ width: 38, height: 38, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e8eaf0' }}>
      <img src="/logo.png" alt="ProctAI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </Box>
    <Typography fontWeight={900} color="#003974" sx={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>ProctAI</Typography>
  </Stack>
);

// ── Validation ────────────────────────────────────────────────────────────────
const validationSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

// ── Login page ────────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [login, { isLoading }] = useLoginMutation();
  const { userInfo } = useSelector((s) => s.auth);

  useEffect(() => { if (userInfo) navigate('/'); }, [navigate, userInfo]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async ({ email, password }) => {
      try {
        const res = await login({ email, password }).unwrap();
        dispatch(setCredentials({ ...res }));
        formik.resetForm();
        const redirect = JSON.parse(localStorage.getItem('redirectLocation'));
        if (redirect) { localStorage.removeItem('redirectLocation'); navigate(redirect.pathname); }
        else navigate('/');
      } catch (err) {
        toast.error(err?.data?.message || err.error || 'Login failed');
      }
    },
  });

  return (
    <PageContainer title="Sign In — ProctAI" description="Login to ProctAI">
      <Grid container sx={{ minHeight: '100vh' }}>
        {!isMobile && <LoginLeftPanel />}

        {/* Right — form */}
        <Grid item xs={12} md={7} lg={7}
          sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            p: { xs: 3, sm: 5, md: 6 },
            backgroundColor: '#fff',
          }}
        >
          {isMobile && <MobileLogo />}

          <Box sx={{ width: '100%', maxWidth: 420 }}>
            <Box mb={4}>
              <Typography variant="h4" fontWeight={800} color="#0F2242" mb={0.5}>Welcome back</Typography>
              <Typography variant="body2" color="text.secondary">Sign in to continue to ProctAI.</Typography>
            </Box>

            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography component="label" htmlFor="email" sx={labelSx}>Email Address</Typography>
                  <CustomTextField
                    id="email" name="email" type="email" placeholder="you@example.com"
                    value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    fullWidth sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                  />
                </Box>

                <Box>
                  <Typography component="label" htmlFor="password" sx={labelSx}>Password</Typography>
                  <CustomTextField
                    id="password" name="password" type="password" placeholder="••••••••"
                    value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    fullWidth sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                  />
                </Box>

                <FormGroup>
                  <FormControlLabel
                    control={<Checkbox defaultChecked size="small" sx={{ color: '#003974', '&.Mui-checked': { color: '#003974' } }} />}
                    label={<Typography variant="body2" color="text.secondary">Remember this device</Typography>}
                  />
                </FormGroup>

                <Button
                  type="submit" variant="contained" fullWidth disabled={isLoading}
                  sx={{
                    backgroundColor: '#003974', borderRadius: '10px', py: 1.4,
                    fontWeight: 700, fontSize: '0.95rem', textTransform: 'none', boxShadow: 'none',
                    '&:hover': { backgroundColor: '#002a54', boxShadow: 'none' },
                  }}
                >
                  {isLoading
                    ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={18} sx={{ color: '#fff' }} /><span>Signing in...</span></Stack>
                    : 'Sign In'
                  }
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 3, borderColor: '#f0f0f0' }} />
            <Stack direction="row" spacing={0.75} justifyContent="center">
              <Typography variant="body2" color="text.secondary">New to ProctAI?</Typography>
              <Typography component={Link} to="/auth/register" variant="body2"
                sx={{ color: '#003974', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Create an account
              </Typography>
            </Stack>

            <AuthFooter />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Login;
