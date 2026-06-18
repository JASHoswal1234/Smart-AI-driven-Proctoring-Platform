import React, { Suspense, lazy } from 'react';
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

// ✅ Wraps lazy() with automatic retry on chunk load failure
const lazyWithRetry = (importFn) =>
  lazy(() =>
    importFn().catch((error) => {
      // Chunk failed — likely stale cache after redeployment
      // Reload once to get fresh chunks; avoid infinite reload loop
      const hasReloaded = sessionStorage.getItem('chunk_reload_attempted');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload_attempted', 'true');
        window.location.reload();
        return { default: () => null };
      }
      // Already tried reloading — throw so an error boundary can catch it
      throw error;
    })
  );

const Loadable = (importFn) => {
  const Component = lazyWithRetry(importFn);

  function LoadableComponent(props) {
    return (
      <Suspense fallback={<Loader />}>
        <Component {...props} />
      </Suspense>
    );
  }

  return LoadableComponent;
};

export default Loadable;
