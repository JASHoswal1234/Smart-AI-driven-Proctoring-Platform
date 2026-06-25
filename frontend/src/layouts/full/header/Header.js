import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  styled,
  Stack,
  IconButton,
  Badge,
  Button,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import _ from 'lodash';

// components
import Profile from './Profile';
import { IconBellRinging, IconMenu } from '@tabler/icons-react';
import { useSelector } from 'react-redux';

const Header = (props) => {
  // const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  // const lgDown = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const { userInfo } = useSelector((state) => state.auth);

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    background: '#003974',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    [theme.breakpoints.up('lg')]: {
      minHeight: '70px',
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: '#FFFFFF',
  }));

  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={props.toggleMobileSidebar}
          sx={{
            display: {
              lg: 'none',
              xs: 'inline',
            },
            color: '#FFFFFF',
          }}
        >
          <IconMenu width="20" height="20" />
        </IconButton>

        <IconButton
          size="large"
          aria-label="show 11 new notifications"
          aria-controls="msgs-menu"
          aria-haspopup="true"
          sx={{
            color: '#FFFFFF',
            ...(typeof anchorEl2 === 'object' && {
              color: '#FFFFFF',
            }),
          }}
        >
          <Badge variant="dot" color="error" sx={{ '& .MuiBadge-dot': { backgroundColor: '#ED1C24' } }}>
            <IconBellRinging size="21" stroke="1.5" />
          </Badge>
        </IconButton>
        <Box flexGrow={1} />
        <Stack spacing={1} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
            {_.startCase(userInfo.name)}
          </Typography>
          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
