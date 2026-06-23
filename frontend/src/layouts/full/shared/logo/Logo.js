import { Link } from 'react-router-dom';
import { styled, Typography, Box } from '@mui/material';

const LinkStyled = styled(Link)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  textDecoration: 'none',
  marginRight: '20px',
}));

const Logo = () => {
  return (
    <LinkStyled to="/">
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/logo.png"
          alt="ProctAI Logo"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#003974', letterSpacing: '-0.5px' }}>
        ProctAI
      </Typography>
    </LinkStyled>
  );
};

export default Logo;
