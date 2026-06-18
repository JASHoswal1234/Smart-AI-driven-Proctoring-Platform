import React, { useState, useEffect } from 'react';
import { styled, Container, Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';

import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';

const MainWrapper = styled('div')(() => ({
  // display: 'flex',
  // minHeight: '100vh',
  // width: '100%',
}));

const PageWrapper = styled('div')(() => ({
  // display: 'flex',
  // flexGrow: 1,
  // paddingBottom: '60px',
  // flexDirection: 'column',
  // zIndex: 1,
  // backgroundColor: 'black',
}));

const ExamLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  // const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

  return (
    <Box>
      {/* ------------------------------------------- */}
      {/* ------------------------------------------- */}
      {/* Main Wrapper */}
      {/* ------------------------------------------- */}
      <PageWrapper>
        {/* ------------------------------------------- */}
        {/* Header */}
        {/* ------------------------------------------- */}
        <Header
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          toggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        {/* ------------------------------------------- */}
        {/* PageContent */}
        {/* ------------------------------------------- */}
        <Outlet key={location.pathname} />
      </PageWrapper>
    </Box>
  );
};

export default ExamLayout;
