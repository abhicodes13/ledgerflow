import { Navigate, Outlet, useLocation } from "react-router-dom";

// Wraps every private route. Later, a subscription check goes here too:
//   if (!isSubscribed) return <Navigate to="/app/settings" replace />;
export function RequireAuth({ token }) {
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
