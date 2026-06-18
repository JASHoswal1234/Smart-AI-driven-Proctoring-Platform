import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const location = useLocation();
  
  console.log('🔒 PrivateRoute rendering, location:', location.pathname, 'authenticated:', !!userInfo);
  
  return userInfo ? <Outlet /> : <Navigate to="/auth/login" replace />;
};
export default PrivateRoute;
