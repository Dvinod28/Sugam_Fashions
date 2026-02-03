import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import { isAdminUser, getUserRole } from "../../api/roles";

export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles = [] }) {
  const { currentUser, isAuthenticated } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuthorization() {
      console.log("ProtectedRoute check - currentUser:", currentUser?.uid, "requireAdmin:", requireAdmin, "allowedRoles:", allowedRoles, "userRole:", currentUser?.role);
      
      if (currentUser) {
        if (requireAdmin) {
          const isAdmin = await isAdminUser(currentUser);
          console.log("Admin check result:", isAdmin);
          setIsAuthorized(isAdmin);
        } else if (allowedRoles.length > 0) {
          // Use role from AuthContext if available, otherwise fetch it
          const userRole = currentUser.role || await getUserRole(currentUser.uid);
          console.log("User role check:", userRole, "Allowed roles:", allowedRoles, "Authorized:", allowedRoles.includes(userRole));
          setIsAuthorized(allowedRoles.includes(userRole));
        } else {
          setIsAuthorized(true); // No specific role required
        }
      } else {
        console.log("No current user found");
        setIsAuthorized(false);
      }
      setChecking(false);
    }
    
    checkAuthorization();
  }, [currentUser, requireAdmin, allowedRoles]);

  // While checking, render nothing (or a spinner)
  if (checking) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Not authenticated: redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Not authorized: show debug info and redirect to login
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-2">User ID: {currentUser?.uid}</p>
          <p className="text-gray-600 mb-2">User Role: {currentUser?.role || 'No role assigned'}</p>
          <p className="text-gray-600 mb-4">Required Roles: {allowedRoles.join(', ')}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Authorized: render children
  return children;
}


