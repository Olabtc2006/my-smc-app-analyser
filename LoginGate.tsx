import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Fingerprint
} from 'lucide-react';

interface LoginGateProps {
  onLogin: (user: { email: string; name?: string }) => void;
  metadataUserEmail?: string;
}

export default function LoginGate({ onLogin, metadataUserEmail = 'olaniyilawalazeez@gmail.com' }: LoginGateProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Authenticate user
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Dynamic delay for realism
    setTimeout(() => {
      try {
        if (!email || !password) {
          throw new Error('Please fill in all security clearance inputs.');
        }

        if (password.length < 6) {
          throw new Error('Clearing Key is insufficient. Needs at least 6 characters.');
        }

        const registeredUsersKey = 'smc_registered_users_registry';
        const users = JSON.parse(localStorage.getItem(registeredUsersKey) || '[]');

        if (isRegistering) {
          // Register flow
          const userExists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (userExists) {
            throw new Error('Clearing ID already registered in terminal database.');
          }

          // Automatically designate olaniyilawalazeez@gmail.com as the Elite SMC Director
          const isUserAdmin = email.toLowerCase() === metadataUserEmail.toLowerCase();
          const finalName = isUserAdmin ? (name || 'Elite SMC Director') : (name || 'Guest Trader');

          const newUser = { 
            email: email.toLowerCase(), 
            password, 
            name: finalName,
            role: isUserAdmin ? 'ADMIN' : 'TRADER'
          };
          users.push(newUser);
          localStorage.setItem(registeredUsersKey, JSON.stringify(users));

          setSuccessMsg(`Clearing Key registered! Assigned Clearance: ${isUserAdmin ? 'Elite SMC Director (Admin)' : 'Trader'}. Please authenticate now.`);
          setIsRegistering(false);
          setPassword('');
        } else {
          // Login flow
          // Built-in credential checks
          const personalizedOwner = { email: metadataUserEmail.toLowerCase(), password: 'password123', name: 'Elite SMC Director', role: 'ADMIN' };
          
          let authenticatedUser = null;
          
          if (email.toLowerCase() === personalizedOwner.email && password === personalizedOwner.password) {
            authenticatedUser = personalizedOwner;
          } else {
            // Check local items
            const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            if (found) {
              authenticatedUser = found;
            }
          }

          if (!authenticatedUser) {
            throw new Error('Access Denied. Verification failed for the provided credentials.');
          }

          // Complete login
          const loggedSession = { 
            email: authenticatedUser.email, 
            name: authenticatedUser.name || (authenticatedUser.email.toLowerCase() === metadataUserEmail.toLowerCase() ? 'Elite SMC Director' : 'Guest Trader'),
            role: authenticatedUser.role || (authenticatedUser.email.toLowerCase() === metadataUserEmail.toLowerCase() ? 'ADMIN' : 'TRADER')
          };
          localStorage.setItem('smc_current_user', JSON.stringify(loggedSession));
          onLogin(loggedSession);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'System error. Security shield locked.');
      } finally {
        setIsLoading(false);
      }
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none antialiased selection:bg-sky-500/30">
      
      {/* Decorative Cybernetic Grid lines and Ambient glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>

      {/* Main Auth Container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-slate-900 shadow-2xl overflow-hidden relative p-8">
          
          {/* Diagnostic Corner Accent lines */}
          <div className="absolute top-0 left-0 w-8 h-[1px] bg-sky-500/40"></div>
          <div className="absolute top-0 left-0 w-[1px] h-8 bg-sky-500/40"></div>
          <div className="absolute top-0 right-0 w-8 h-[1px] bg-sky-500/40"></div>
          <div className="absolute top-0 right-0 w-[1px] h-8 bg-sky-500/40"></div>
          
          {/* Header Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
              <TrendingUp className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h2 className="text-lg font-black tracking-tight text-white uppercase font-mono">ELITE AI SMC GATE</h2>
              <span className="bg-sky-500/10 text-sky-400 text-[8px] px-1.5 py-0.5 rounded font-extrabold font-mono border border-sky-500/20 uppercase tracking-wider">SECURE</span>
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">Institutional Order Flow System</p>
          </div>

          {/* Form Message Prompts */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-mono flex items-start gap-2.5 mb-6"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-mono flex items-start gap-2.5 mb-6"
              >
                <Fingerprint className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs header */}
          <div className="flex w-full bg-slate-900/40 p-1.5 rounded-xl border border-slate-900 mb-6 font-mono text-[10px] uppercase font-bold tracking-wider">
            <button
              onClick={() => { setIsRegistering(false); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-center rounded-lg transition-all ${!isRegistering ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign In Terminal
            </button>
            <button
              onClick={() => { setIsRegistering(true); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-center rounded-lg transition-all ${isRegistering ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Register ID
            </button>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Trader Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-slate-950/80 border border-slate-900 rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
                    required={isRegistering}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Clearing ID (Email)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. trader@smc.com"
                  className="w-full bg-slate-950/80 border border-slate-900 rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Security Password</label>
                {!isRegistering && (
                  <span className="text-[9px] text-sky-400/80 hover:text-sky-400 transition cursor-pointer font-mono font-semibold">Self-managed Key</span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  className="w-full bg-slate-950/80 border border-slate-900 rounded-xl py-3 pl-11 pr-11 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isLoading 
                  ? 'bg-slate-900 text-slate-500 border border-slate-850 cursor-not-allowed'
                  : 'bg-gradient-to-tr from-sky-400 to-indigo-500 text-slate-950 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-white rounded-full animate-spin"></span>
                  DECIPHERING ACCESS KEY...
                </>
              ) : (
                <>
                  {isRegistering ? 'Register Clearing ID' : 'Authorize Secure Access'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>



          {/* Footer Clearance Warning banner */}
          <div className="mt-6 flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-rose-500/10 text-slate-500 font-mono text-[8px] uppercase tracking-wider leading-relaxed">
            <KeyRound className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Clearing access logged by IP proxy server. Unauthorized access strictly audited under SMC-3.0 rules.</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
