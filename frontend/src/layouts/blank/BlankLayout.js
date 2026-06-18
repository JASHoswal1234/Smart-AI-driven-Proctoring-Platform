import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

const BlankLayout = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <>
      <Outlet key={location.pathname} />
    </>
  );
};

export default BlankLayout;
