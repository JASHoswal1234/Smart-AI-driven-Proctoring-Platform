import {
  IconLayoutDashboard,
  IconFileText,
  IconClipboardList,
  IconCirclePlus,
  IconList,
  IconChartBar,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },

  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    navlabel: true,
    subheader: 'Student',
  },
  {
    id: uniqueId(),
    title: 'Exams',
    icon: IconFileText,
    href: '/exam',
  },
  {
    id: uniqueId(),
    title: 'Result',
    icon: IconClipboardList,
    href: '/result',
  },
  {
    navlabel: true,
    subheader: 'Teacher',
  },
  {
    id: uniqueId(),
    title: 'Create Exam',
    icon: IconCirclePlus,
    href: '/create-exam',
  },
  {
    id: uniqueId(),
    title: 'Add Questions',
    icon: IconList,
    href: '/add-questions',
  },
  {
    id: uniqueId(),
    title: 'Exam Logs',
    icon: IconChartBar,
    href: '/exam-log',
  },
];

// Bottom menu items (Settings and Logout)
export const BottomMenuItems = [
  {
    id: uniqueId(),
    title: 'Settings',
    icon: IconSettings,
    href: '/user/profile',
  },
  {
    id: uniqueId(),
    title: 'Logout',
    icon: IconLogout,
    href: '/auth/login',
    isLogout: true,
  },
];

export default Menuitems;
