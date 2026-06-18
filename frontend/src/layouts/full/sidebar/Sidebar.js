import { useMediaQuery, Box, Drawer, Typography } from '@mui/material';
import Logo from '../shared/logo/Logo';
import SidebarItems from './SidebarItems';

const Sidebar = (props) => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const sidebarWidth = '270px';

  if (lgUp) {
    return (
      <Box
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
        }}
      >
        {/* ------------------------------------------- */}
        {/* Sidebar for desktop */}
        {/* ------------------------------------------- */}
        <Drawer
          anchor="left"
          open={props.isSidebarOpen}
          variant="permanent"
          PaperProps={{
            sx: {
              width: sidebarWidth,
              boxSizing: 'border-box',
              backgroundColor: '#FFFFFF',
              borderRight: '1px solid #ECECEC',
            },
          }}
        >
          {/* ------------------------------------------- */}
          {/* Sidebar Box */}
          {/* ------------------------------------------- */}
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ------------------------------------------- */}
            {/* Logo */}
            {/* ------------------------------------------- */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 3,
                width: '100%',
                borderBottom: '1px solid #ECECEC',
                height: '70px',
              }}
            >
              <Logo />

              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: '2.0rem',
                  color: 'primary.main',
                  whiteSpace: 'nowrap',
                  mr: 5,
                }}
              >
              </Typography>
            </Box>

            {/* ------------------------------------------- */}
            {/* Main Menu Items */}
            {/* ------------------------------------------- */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <SidebarItems />
            </Box>

            {/* ------------------------------------------- */}
            {/* Bottom Menu Items (Settings & Logout) */}
            {/* ------------------------------------------- */}
            <Box sx={{ borderTop: '1px solid #ECECEC', pt: 2, pb: 2 }}>
              <SidebarItems isBottomMenu={true} />
            </Box>
          </Box>
        </Drawer>
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={props.isMobileSidebarOpen}
      onClose={props.onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: sidebarWidth,
          boxShadow: (theme) => theme.shadows[8],
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #ECECEC',
        },
      }}
    >
      {/* ------------------------------------------- */}
      {/* Sidebar Box */}
      {/* ------------------------------------------- */}
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ------------------------------------------- */}
        {/* Logo */}
        {/* ------------------------------------------- */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 3,
            width: '100%',
            borderBottom: '1px solid #ECECEC',
            height: '70px',
          }}
        >
          <Logo />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: '2.0rem',
              color: 'primary.main',
              whiteSpace: 'nowrap',
              mr: 5,
            }}
          >
          </Typography>
        </Box>

        {/* ------------------------------------------- */}
        {/* Main Menu Items */}
        {/* ------------------------------------------- */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <SidebarItems />
        </Box>

        {/* ------------------------------------------- */}
        {/* Bottom Menu Items (Settings & Logout) */}
        {/* ------------------------------------------- */}
        <Box sx={{ borderTop: '1px solid #ECECEC', pt: 2, pb: 2 }}>
          <SidebarItems isBottomMenu={true} />
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
