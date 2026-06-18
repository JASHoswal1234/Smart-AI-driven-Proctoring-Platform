import { Link } from 'react-router-dom';
import { styled, Typography, Box } from '@mui/material';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

const LinkStyled = styled(Link)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textDecoration: 'none',
  marginRight: '20px',
}));

const Logo = () => {
  return (
    <LinkStyled to="/">
      <Box sx={{ 
        width: '40px', 
        height: '40px', 
        borderRadius: '50%', 
        bgcolor: '#003974',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <RemoveRedEyeIcon sx={{ color: 'white', fontSize: '24px' }} />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#003974', letterSpacing: '-0.5px' }}>
        ProctAI
      </Typography>
    </LinkStyled>
  );
};

export default Logo;
