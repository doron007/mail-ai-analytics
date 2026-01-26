'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type AuthState = 'idle' | 'sending' | 'sent' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: 'Invalid login link. Please request a new one.',
  invalid_or_expired: 'This login link has expired. Please request a new one.',
  verification_failed: 'Verification failed. Please try again.',
};

function AuthContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<AuthState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [maskedEmail, setMaskedEmail] = useState<string>('');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setState('error');
      setErrorMessage(ERROR_MESSAGES[error] || 'An error occurred. Please try again.');
    }
  }, [searchParams]);

  const requestMagicLink = async () => {
    setState('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/request', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send login link');
      }

      setMaskedEmail(data.email);
      setState('sent');
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send login link');
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-xl">
      {/* Logo/Title */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Mail AI Analytics</h1>
        <p className="text-gray-400 mt-2">Private access only</p>
      </div>

      {/* Idle State - Request Link */}
      {state === 'idle' && (
        <div className="space-y-4">
          <p className="text-gray-300 text-center text-sm">
            Click below to receive a secure login link via email.
          </p>
          <button
            onClick={requestMagicLink}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Send Login Link
          </button>
        </div>
      )}

      {/* Sending State */}
      {state === 'sending' && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-300">Sending login link...</p>
        </div>
      )}

      {/* Sent State - Check Email */}
      {state === 'sent' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-600/20 rounded-full mx-auto flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Check your email</h2>
            <p className="text-gray-400 mt-2">
              We sent a login link to <span className="text-blue-400">{maskedEmail}</span>
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
            <p>Click the link in the email to sign in.</p>
            <p className="text-gray-500 mt-1">The link expires in 15 minutes.</p>
          </div>
          <button
            onClick={() => setState('idle')}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            Didn&apos;t receive it? Send again
          </button>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-600/20 rounded-full mx-auto flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
            <p className="text-gray-400 mt-2">{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              setState('idle');
              setErrorMessage('');
              window.history.replaceState({}, '', '/auth');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-xl">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Mail AI Analytics</h1>
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mt-6" />
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<AuthLoading />}>
          <AuthContent />
        </Suspense>
        <p className="text-center text-gray-600 text-xs mt-6">
          This application is for authorized users only.
        </p>
      </div>
    </div>
  );
}
