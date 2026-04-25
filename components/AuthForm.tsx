'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { Fingerprint, Mail, KeyRound, Loader2, ArrowRight, ShieldCheck, MailCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'register' | 'otp';

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportsWebAuthn, setSupportsWebAuthn] = useState(true);
  const [otpSentDevVal, setOtpSentDevVal] = useState<string | null>(null); // For demo visualization
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Avoid synchronous state updates in effects to prevent cascading renders
    const timer = setTimeout(() => {
      setSupportsWebAuthn(browserSupportsWebAuthn());
      try {
        if (window.self !== window.top) {
          setIsInIframe(true);
        }
      } catch (e) {
        setIsInIframe(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleWebAuthnLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/auth/webauthn/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!resp.ok) {
        if (resp.status === 404) {
          setError('User not found. Try registering first.');
        } else {
          setError('Failed to initiate login.');
        }
        setIsLoading(false);
        return;
      }
      const options = await resp.json();

      let asseResp;
      try {
        asseResp = await startAuthentication({ optionsJSON: options });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Authentication canceled.');
        } else {
          setError(err.message || 'Error communicating with authenticator.');
        }
        setIsLoading(false);
        return;
      }

      const verificationResp = await fetch('/api/auth/webauthn/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, response: asseResp }),
      });

      const verificationJSON = await verificationResp.json();
      if (verificationJSON.verified) {
        router.push('/dashboard');
      } else {
        setError(verificationJSON.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    }
    setIsLoading(false);
  };

  const handleWebAuthnRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      setError('Please enter your email to register.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!resp.ok) {
        const d = await resp.json();
        setError(d.error || 'Failed to initialize registration');
        setIsLoading(false);
        return;
      }
      const options = await resp.json();

      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Registration canceled.');
        } else {
          setError(err.message || 'Authenticator error.');
        }
        setIsLoading(false);
        return;
      }

      const verificationResp = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, response: attResp }),
      });
      
      const verificationJSON = await verificationResp.json();
      if (verificationJSON.verified) {
        router.push('/dashboard');
      } else {
        setError(verificationJSON.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
    setIsLoading(false);
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setMode('otp');
        setOtpSentDevVal(data._dev_otp);
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError('An error occurred while sending OTP.');
    }
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Please enter the OTP code.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await resp.json();
      if (data.verified) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setError('Failed to verify OTP.');
    }
    setIsLoading(false);
  };

  return (
    <div id="auth-form-container" className="w-full max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl relative z-10 flex flex-col">
      <div className="p-8">
        <div id="auth-icon" className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center shadow-inner">
            <Fingerprint className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white tracking-tight">
          {mode === 'otp' ? 'Check your email' : 'Sign In'}
        </h2>
        <p className="text-center text-zinc-500 mt-1 text-sm">
          {mode === 'otp' 
            ? `We sent a temporary code to ${email}` 
            : 'Verify your identity to continue'}
        </p>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-3 bg-red-500/10 text-red-500 text-sm rounded-xl border border-red-500/20 text-center"
            >
              {error}
            </motion.div>
          )}

          {otpSentDevVal && mode === 'otp' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 bg-yellow-500/10 text-yellow-500 text-sm rounded-xl border border-yellow-500/20"
            >
              <div className="font-semibold flex items-center gap-2 mb-1">
                <span className="bg-yellow-500/20 text-yellow-300 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Demo Mode</span>
              </div>
              Your OTP is: <strong className="text-lg tracking-wider text-yellow-400">{otpSentDevVal}</strong>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          {mode !== 'otp' ? (
            <form onSubmit={mode === 'login' ? handleWebAuthnLogin : handleWebAuthnRegister} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[11px] font-bold text-zinc-400 uppercase tracking-tight mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {supportsWebAuthn ? (
                <>
                  {isInIframe && (
                    <div className="p-3 bg-red-500/10 text-red-400 text-[11px] font-medium rounded-xl border border-red-500/20 text-center mb-2">
                      ⚠️ Browsers block WebAuthn inside iframes. 
                      <br/>Please open this app in a <strong>new tab</strong> to use passkeys.
                    </div>
                  )}
                  <button
                    id="webauthn-submit-button"
                    type="submit"
                    disabled={isLoading || isInIframe}
                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? <Fingerprint className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    {mode === 'login' ? 'Authenticate with Passkey' : 'Register Passkey'}
                  </button>
                </>
              ) : (
                <div className="p-4 bg-amber-500/10 text-amber-500 text-sm rounded-xl border border-amber-500/20 flex gap-3 items-start">
                  <span className="block mt-0.5">⚠️</span>
                  <p>Your browser or device doesn&apos;t seem to support Passkeys. Please use the Email OTP fallback below.</p>
                </div>
              )}
              
              <div className="relative py-2 mt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  <span className="px-3 bg-zinc-900">Fallback</span>
                </div>
              </div>

              <button
                id="otp-fallback-button"
                type="button"
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <MailCheck className="w-4 h-4" />
                Sign in with Email OTP
              </button>
            </form>
          ) : (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleVerifyOTP} 
              className="space-y-4"
            >
              <div>
                <label htmlFor="otp" className="block text-[11px] font-bold text-zinc-400 uppercase tracking-tight mb-1.5 ml-1">
                  One-Time Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-all font-mono tracking-widest text-lg"
                    placeholder="123456"
                    required
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button
                id="otp-verify-button"
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
              
              <button
                id="back-to-login-button"
                type="button"
                onClick={() => { setMode('login'); setOtpCode(''); setError(null); setOtpSentDevVal(null); }}
                className="w-full text-center text-sm text-zinc-500 hover:text-white transition-colors py-2"
              >
                Back to Login
              </button>
            </motion.form>
          )}
        </div>
      </div>
      
      {mode !== 'otp' && (
        <div className="bg-[#070708] px-8 py-5 border-t border-zinc-800/50 flex justify-center items-center rounded-b-2xl mb-0 pb-5">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button 
              id="switch-mode-button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} 
              className="ml-2 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {mode === 'login' ? 'REGISTER HERE' : 'SIGN IN HERE'}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
