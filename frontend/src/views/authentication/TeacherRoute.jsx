import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const TeacherRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  if (!userInfo) return <Navigate to="/auth/login" replace />;
  const isTeacher = userInfo.role === 'teacher';
  return isTeacher ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
export default TeacherRoute;
