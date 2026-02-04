import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Show loading state while checking auth
        return (
            <div className="min-h-screen bg-mgs-black flex items-center justify-center">
                <div className="text-mgs-green font-orbitron text-xl animate-pulse">
                    AUTHENTICATING...
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login, preserving the intended destination
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
