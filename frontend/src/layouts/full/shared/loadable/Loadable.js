import { Suspense, lazy } from 'react';
import { CircularProgress, Box } from '@mui/material';

const Loader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    }}
  >
    <CircularProgress />
  </Box>
);

// ✅ Simplified Loadable - no retry logic that could hang
const Loadable = (importFunc) => {
  const LazyComponent = lazy(importFunc);
  
  return function LoadableComponent(props) {
    return (
      <Suspense fallback={<Loader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
};

export default Loadable;
