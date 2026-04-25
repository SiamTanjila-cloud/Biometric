import { AuthForm } from '@/components/AuthForm';
import { Fingerprint } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen relative overflow-hidden bg-[#09090b]">
      
      {/* Decorative background blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full flex-grow flex flex-col justify-center relative z-10 z-[1] max-w-7xl mx-auto items-center">
        <div className="text-center mb-10 mt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 flex items-center justify-center gap-3">
            <Fingerprint className="w-10 h-10 text-indigo-400" />
            Biometric Auth
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Experience seamless, high-security authentication using device-native biometrics. No passwords, no phish, no compromise.
          </p>
        </div>

        <div className="w-full">
          <AuthForm />
        </div>
      </div>
      
      <div className="mt-auto py-8 text-center text-xs font-mono text-zinc-600 relative z-10">
        <p>Built with Next.js, SimpleWebAuthn, and Tailwind CSS.</p>
      </div>
    </main>
  );
}
