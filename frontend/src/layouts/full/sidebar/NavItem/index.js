import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
// mui imports
import {
  ListItemIcon,
  ListItem,
  List,
  styled,
  ListItemText,
  useTheme
} from '@mui/material';

const NavItem = ({ item, level, pathDirect, onClick }) => {
  const Icon = item.icon;
  const theme = useTheme();
  const itemIcon = <Icon stroke={1.5} size="1.3rem" />;
  const isActive = pathDirect === item.href;

  const ListItemStyled = styled(ListItem)(() => ({
    whiteSpace: 'nowrap',
    marginBottom: '4px',
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#0F2242',
    paddingLeft: '16px',
    position: 'relative',
    transition: 'all 0.2s ease',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '3px',
      backgroundColor: isActive ? '#ED1C24' : 'transparent',
      borderRadius: '0 4px 4px 0',
    },
    '&:hover': {
      backgroundColor: '#F0F7FF',
      color: '#003974',
      '& .MuiListItemIcon-root': {
        color: '#003974',
      },
    },
    '&.Mui-selected': {
      color: '#003974',
      backgroundColor: '#F0F7FF',
      '& .MuiListItemIcon-root': {
        color: '#003974',
      },
      '&:hover': {
        backgroundColor: '#F0F7FF',
        color: '#003974',
      },
    },
  }));

  return (
    <List component="li" disablePadding key={item.id}>
      <ListItemStyled
        button
        component={item.isLogout ? 'div' : (item.external ? 'a' : NavLink)}
        to={!item.isLogout && !item.external ? item.href : undefined}
        href={item.external ? item.href : undefined}
        disabled={item.disabled}
        selected={isActive}
        target={item.external ? '_blank' : ''}
        onClick={onClick}
        sx={{
          cursor: 'pointer',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: '36px',
            p: '3px 0',
            color: isActive ? '#003974' : '#6B7280',
          }}
        >
          {itemIcon}
        </ListItemIcon>
        <ListItemText
          sx={{
            '& .MuiTypography-root': {
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.95rem',
            }
          }}
        >
          <>{item.title}</>
        </ListItemText>
      </ListItemStyled>
    </List>
  );
};

NavItem.propTypes = {
  item: PropTypes.object,
  level: PropTypes.number,
  pathDirect: PropTypes.any,
};

export default NavItem;
