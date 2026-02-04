import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the intended destination or default to home
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

    // If already logged in, redirect
    if (user) {
        navigate(from, { replace: true });
        return null;
    }

    const handleSuccess = (credentialResponse: { credential?: string }) => {
        if (credentialResponse.credential) {
            login(credentialResponse.credential);
            navigate(from, { replace: true });
        }
    };

    const handleError = () => {
        console.error('Login failed');
    };

    return (
        <div className="min-h-screen bg-mgs-black flex flex-col items-center justify-center p-4">
            {/* Logo and Title */}
            <div className="flex flex-col items-center mb-12">
                <img
                    src="/logo/android-chrome-512x512.png"
                    alt="Dough Hound Logo"
                    className="w-32 h-32 object-contain mb-4"
                />
                <h1 className="text-4xl sm:text-5xl font-orbitron text-mgs-green tracking-wider text-center">
                    DOUGH HOUND
                </h1>
                <h2 className="text-xl sm:text-2xl font-orbitron text-mgs-green tracking-wider text-center mt-2">
                    TACTICAL FINANCE
                </h2>
            </div>

            {/* Login Card */}
            <div className="border border-mgs-green bg-mgs-black/50 p-8 max-w-md w-full">
                <div className="border-b border-mgs-green pb-4 mb-6">
                    <h3 className="font-orbitron text-mgs-green text-lg text-center">
                        OPERATOR LOGIN
                    </h3>
                </div>

                <p className="text-mgs-lightgray text-sm text-center mb-8 font-mono">
                    Sign in with your Google account to access your tactical finance dashboard.
                </p>

                {/* Google Sign-In Button */}
                <div className="flex justify-center mb-6">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="filled_black"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        logo_alignment="left"
                    />
                </div>

                <p className="text-mgs-gray text-xs text-center font-mono">
                    Your data is stored in your own Google Sheet.
                    <br />
                    We never access your financial accounts.
                </p>
            </div>

            {/* Footer */}
            <footer className="mt-12 text-center text-xs text-mgs-lightgray">
                <span style={{ color: '#7dd3fc' }}>
                    built by{' '}
                    <a
                        href="https://breezblox.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                    >
                        BreezBlox
                    </a>
                </span>
            </footer>
        </div>
    );
}
