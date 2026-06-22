import React from 'react';
import Menuitems, { BottomMenuItems } from './MenuItems';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, List } from '@mui/material';
import NavItem from './NavItem';
import NavGroup from './NavGroup/NavGroup';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../slices/authSlice';
import { useLogoutMutation } from '../../../slices/usersApiSlice';

const SidebarItems = ({ isBottomMenu = false, onSidebarClose }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const { pathname } = useLocation();
  const pathDirect = pathname;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoutApiCall] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(logout());
      navigate('/auth/login');
      // Close sidebar on mobile after logout
      if (onSidebarClose) {
        onSidebarClose();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleItemClick = (item) => {
    if (item.isLogout) {
      handleLogout();
    } else {
      // Close sidebar on mobile after navigation
      if (onSidebarClose) {
        onSidebarClose();
      }
    }
  };

  const menuItems = isBottomMenu ? BottomMenuItems : Menuitems;

  return (
    <Box sx={{ px: 3, py: isBottomMenu ? 0 : 2 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {menuItems.map((item) => {
          // Check if the user is a student and if the item should be hidden
          if (
            userInfo.role === 'student' &&
            ['Create Exam', 'Add Questions', 'Exam Logs'].includes(item.title)
          ) {
            return null; // Don't render this menu item for students
          }
          // {/********SubHeader**********/}
          if (item.subheader) {
            // Check if the user is a student and if the subheader should be hidden
            if (userInfo.role === 'student' && item.subheader === 'Teacher') {
              return null; // Don't render the "Teacher" subheader for students
            }

            return <NavGroup item={item} key={item.subheader} />;

            // {/********If Sub Menu**********/}
            /* eslint no-else-return: "off" */
          } else {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
                onClick={() => handleItemClick(item)}
              />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;
