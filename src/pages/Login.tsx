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

    const handleLogin = async () => {
        await login();
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

                {/* Custom Google Sign-In Button */}
                <div className="flex justify-center mb-6">
                    <button
                        onClick={handleLogin}
                        className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded shadow hover:bg-gray-100 transition-colors font-medium text-sm font-sans"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>
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
