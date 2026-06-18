import React from 'react';
import { Button, Box } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const FlowButton = ({ text = "Create Exam", onClick, startIcon }) => {
  return (
    <Button
      onClick={onClick}
      startIcon={startIcon}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        overflow: 'hidden',
        borderRadius: '100px',
        border: '1.5px solid rgba(237, 28, 36, 0.6)',
        backgroundColor: 'transparent',
        px: 2.5,
        py: 1,
        fontSize: '14px',
        fontWeight: 600,
        color: '#ED1C24',
        cursor: 'pointer',
        textTransform: 'none',
        transition: 'all 600ms cubic-bezier(0.23, 1, 0.32, 1)',
        '&:hover': {
          borderColor: 'transparent',
          color: 'white',
          borderRadius: '10px',
          '& .flow-text': {
            transform: 'translateX(8px)',
          },
          '& .flow-circle': {
            width: '180px',
            height: '180px',
            opacity: 1,
          },
          '& .flow-icon': {
            transform: 'translateX(3px)',
            color: 'white',
          },
        },
        '&:active': {
          transform: 'scale(0.95)',
        },
        '& .MuiButton-startIcon': {
          marginRight: '6px',
          marginLeft: 0,
          position: 'relative',
          zIndex: 2,
          transition: 'all 800ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
      }}
    >
      {/* Expanding circle background */}
      <Box
        className="flow-circle"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '16px',
          height: '16px',
          backgroundColor: '#ED1C24',
          borderRadius: '50%',
          opacity: 0,
          transition: 'all 800ms cubic-bezier(0.19, 1, 0.22, 1)',
          zIndex: 0,
        }}
      />
      
      {/* Text */}
      <Box
        component="span"
        className="flow-text"
        sx={{
          position: 'relative',
          zIndex: 1,
          transform: 'translateX(-8px)',
          transition: 'all 800ms ease-out',
        }}
      >
        {text}
      </Box>
    </Button>
  );
};

export default FlowButton;
