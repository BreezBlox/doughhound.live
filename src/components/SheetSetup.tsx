import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { extractSheetId, initializeSheet, testSheetAccess } from '@/services/sheetsService';

interface SheetSetupProps {
    onComplete: () => void;
}

export default function SheetSetup({ onComplete }: SheetSetupProps) {
    const { user, accessToken, setSheetId } = useAuth();
    const [sheetUrl, setSheetUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Extract sheet ID from URL
            const extractedId = extractSheetId(sheetUrl);

            if (!extractedId) {
                setError('Invalid Google Sheets URL. Please paste the full URL from your browser.');
                setIsLoading(false);
                return;
            }

            if (!accessToken) {
                setError('Authentication error. Please sign out and sign in again.');
                setIsLoading(false);
                return;
            }

            // Test if we can access the sheet
            const canAccess = await testSheetAccess({
                accessToken,
                sheetId: extractedId,
            });

            if (!canAccess) {
                setError('Cannot access this sheet. Make sure you have edit access to it.');
                setIsLoading(false);
                return;
            }

            // Initialize the sheet with headers
            const initialized = await initializeSheet({
                accessToken,
                sheetId: extractedId,
            });

            if (!initialized) {
                setError('Failed to set up the sheet. Please try again.');
                setIsLoading(false);
                return;
            }

            // Save the sheet ID to user profile
            setSheetId(extractedId);
            onComplete();
        } catch (err) {
            console.error('Sheet setup error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mgs-black flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
                <img
                    src="/logo/android-chrome-512x512.png"
                    alt="Dough Hound Logo"
                    className="w-24 h-24 object-contain mb-4"
                />
                <h1 className="text-3xl font-orbitron text-mgs-green tracking-wider text-center">
                    CONNECT YOUR DATA
                </h1>
            </div>

            {/* Welcome message */}
            <div className="text-center mb-8 max-w-md">
                <p className="text-mgs-lightgray font-mono text-sm mb-2">
                    Welcome, <span className="text-mgs-green">{user?.name || 'Operator'}</span>
                </p>
                <p className="text-mgs-gray font-mono text-xs">
                    Link a blank Google Sheet to store your financial data.
                    Your data stays in your own Google Drive.
                </p>
            </div>

            {/* Setup Card */}
            <div className="border border-mgs-green bg-mgs-black/50 p-6 max-w-lg w-full">
                <div className="border-b border-mgs-green pb-3 mb-6">
                    <h3 className="font-orbitron text-mgs-green text-sm text-center">
                        SHEET CONFIGURATION
                    </h3>
                </div>

                {/* Instructions */}
                <div className="mb-6 text-xs text-mgs-lightgray font-mono space-y-2">
                    <p className="flex items-start gap-2">
                        <span className="text-mgs-green">1.</span>
                        <span>Create a new blank Google Sheet</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="text-mgs-green">2.</span>
                        <span>Copy the URL from your browser's address bar</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="text-mgs-green">3.</span>
                        <span>Paste it below and click Connect</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-mgs-gray font-mono mb-2">
                            GOOGLE SHEET URL
                        </label>
                        <input
                            type="url"
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full bg-mgs-black border border-mgs-green text-mgs-green font-mono text-sm px-3 py-2 focus:outline-none focus:border-mgs-lightgreen placeholder:text-mgs-gray/50"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs font-mono bg-red-500/10 border border-red-500/30 p-3">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !sheetUrl}
                        className="w-full py-3 font-orbitron text-sm border border-mgs-green bg-mgs-green text-mgs-black hover:bg-mgs-darkgreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'CONNECTING...' : 'CONNECT SHEET'}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-mgs-gray/30 flex flex-col gap-2">
                    <p className="text-xs text-mgs-gray font-mono text-center">
                        💡 Create a new sheet at{' '}
                        <a
                            href="https://sheets.new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-mgs-green hover:underline"
                        >
                            sheets.new
                        </a>
                    </p>

                    <button
                        onClick={() => {
                            // Clear everything and force reload to clear auth state
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                        className="text-[10px] text-mgs-gray hover:text-red-400 font-mono text-center underline mt-2"
                        type="button"
                    >
                        Wrong account? Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
