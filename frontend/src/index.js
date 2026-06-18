import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CircularProgress, Box } from '@mui/material';

const Loader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Suspense fallback={<Loader />}>
    <App />
  </Suspense>,
);
