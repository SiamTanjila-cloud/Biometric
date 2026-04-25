'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, ShieldAlert, BadgeCheck, Shield, KeyRound, MonitorSmartphone } from 'lucide-react';

type UserData = {
  id: string;
  email: string;
  passkeyCount: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const resp = await fetch('/api/auth/me');
        if (resp.ok) {
          const data = await resp.json();
          setUser(data.user);
        } else {
          router.push('/');
        }
      } catch (e) {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null; // Will redirect

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 relative overflow-hidden">
      {/* Decorative bg */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      
      <header className="bg-[#09090b] border-b border-zinc-800/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold tracking-tight">
            <Shield className="w-5 h-5 text-indigo-400" />
            FORTRESS
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back,</h1>
          <p className="text-xl text-zinc-500 mt-1">{user.email}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-zinc-800 border border-zinc-700 text-indigo-400 rounded-xl flex items-center justify-center shadow-inner">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Account Profile</h2>
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold tracking-wider mt-0.5">
                  <BadgeCheck className="w-4 h-4" />
                  <span className="text-[10px] uppercase">Verified Active Session</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Internal ID</label>
                <p className="text-sm font-mono text-zinc-300 mt-1 truncate bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800">{user.id}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                <p className="text-sm text-zinc-300 mt-1 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 bg-zinc-800 border border-zinc-700 text-indigo-400 rounded-xl flex items-center justify-center shadow-inner">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Security & Credentials</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">Manage your simple webauthn devices</p>
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 flex items-start gap-4">
                <MonitorSmartphone className="w-8 h-8 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-indigo-300 text-sm">Registered Passkeys</h3>
                  <p className="text-indigo-400/80 text-sm mt-1 leading-relaxed">
                    You have <strong className="font-bold text-indigo-300">{user.passkeyCount}</strong> active passkey{user.passkeyCount === 1 ? '' : 's'} linked to your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/50 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
              <span className="text-emerald-500 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500" /> WebAuthn protected
              </span>
              <button 
                onClick={() => router.push('/')}
                className="text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
              >
                Register Device ++
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
