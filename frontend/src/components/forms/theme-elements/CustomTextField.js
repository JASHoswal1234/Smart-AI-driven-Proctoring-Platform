import React from 'react';
import { styled } from '@mui/material/styles';
import { TextField } from '@mui/material';

const CustomTextField = styled((props) => <TextField {...props} />)(({ theme }) => ({
  '& .MuiOutlinedInput-input::-webkit-input-placeholder': {
    color: theme.palette.text.secondary,
    opacity: '1',
  },
  '& .MuiOutlinedInput-input.Mui-disabled::-webkit-input-placeholder': {
    color: theme.palette.text.secondary,
    opacity: '1',
  },
  '& .Mui-disabled .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.grey[200],
  },
  // Add support for all browsers
  '& .MuiOutlinedInput-input::placeholder': {
    color: theme.palette.text.secondary,
    opacity: '1',
  },
  '& .MuiOutlinedInput-input:-ms-input-placeholder': {
    color: theme.palette.text.secondary,
    opacity: '1',
  },
  '& .MuiOutlinedInput-input::-ms-input-placeholder': {
    color: theme.palette.text.secondary,
    opacity: '1',
  },
}));

export default CustomTextField;
