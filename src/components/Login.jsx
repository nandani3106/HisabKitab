import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import usePWAInstall from '../hooks/usePWAInstall';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { showPrompt, triggerInstall, dismissPrompt } = usePWAInstall();
  const navigate = useNavigate();

  const handleInstall = async () => {
    const result = await triggerInstall();
    if (result.success) {
      setSuccess('HisabKitab installed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="w-full max-w-md px-6 py-5 bg-deep-purple/95 backdrop-blur-2xl border-t border-x border-purple-rose/85 rounded-t-[32px] rounded-b-none shadow-2xl transition-all duration-300 relative z-10 font-sans pb-10 animate-in slide-in-from-bottom duration-300 overflow-visible">
      {/* Sitting Cat Mascot */}
      <img 
        src={password ? "/eyesclosed-cat.png" : email ? "/happy-cat.png" : "/cat.png"} 
        alt="Mascot" 
        className="absolute bottom-full left-1/2 w-36 h-auto pointer-events-none select-none animate-cat-sit" 
      />

      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-light-blush/80 text-xs font-bold uppercase tracking-wider">Sign in to HisabKitab</p>
      </div>

      {success && (
        <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs text-center font-semibold animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 bg-rose-pink/10 border border-rose-pink/30 text-rose-pink rounded-xl text-xs text-center font-semibold">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-light-blush text-[10px] font-bold uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-pink focus:ring-1 focus:ring-rose-pink/30 transition-all placeholder:text-light-blush/30 font-medium"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-light-blush text-[10px] font-bold uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-pink focus:ring-1 focus:ring-rose-pink/30 transition-all placeholder:text-light-blush/30 font-medium"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-rose-pink to-peach-orange hover:opacity-90 text-dark-navy font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-rose-pink/10 active:scale-[0.98] transition-all duration-300 text-xs uppercase tracking-wider mt-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Navigation to Signup */}
      <div className="mt-8 text-center border-t border-purple-rose/30 pt-6">
        <p className="text-xs text-light-blush/60 font-medium">
          New to HisabKitab?{' '}
          <Link
            to="/signup"
            className="text-peach-orange hover:text-light-blush underline font-bold transition-colors ml-1"
          >
            Create an Account
          </Link>
        </p>
      </div>

      {/* PWA Installation Modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-navy/80 backdrop-blur-md px-4">
          <div className="w-full max-w-sm px-6 py-6 bg-deep-purple/90 backdrop-blur-2xl border border-purple-rose/85 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="flex flex-col items-center pointer-events-none select-none origin-top animate-sway mb-4">
                {/* Two Hanging Wires */}
                <div className="flex gap-10 relative">
                  <div className="w-[1px] h-6 bg-black" />
                  <div className="w-[1px] h-6 bg-black" />
                </div>

                {/* The Logo Board */}
                <div className="w-16 h-16 bg-gradient-to-br from-deep-purple/95 to-dark-navy/95 border border-purple-rose/85 rounded-2xl shadow-xl flex flex-col items-center justify-center p-1 -mt-0.5 relative">
                  {/* Metal ring connectors */}
                  <div className="absolute -top-1 left-3 w-1.5 h-1.5 rounded-full border border-purple-rose/85 bg-dark-navy flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-purple-rose/45" />
                  </div>
                  <div className="absolute -top-1 right-3 w-1.5 h-1.5 rounded-full border border-purple-rose/85 bg-dark-navy flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-purple-rose/45" />
                  </div>

                  {/* Simple HK Logo */}
                  <div className="w-11 h-11 bg-gradient-to-tr from-rose-pink to-peach-orange text-dark-navy rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-rose-pink/15">
                    HK
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">Install HisabKitab</h3>
              <p className="text-light-blush/70 text-xs leading-relaxed">
                Install HisabKitab on your device for faster access and a better app experience.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-rose-pink to-peach-orange hover:opacity-90 text-dark-navy font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-rose-pink/10 active:scale-[0.98] transition-all duration-200 text-xs uppercase tracking-wider cursor-pointer"
              >
                Install Now
              </button>
              <button
                onClick={dismissPrompt}
                className="w-full bg-dark-navy/60 hover:bg-dark-navy/80 border border-purple-rose/50 text-light-blush font-extrabold py-2.5 px-4 rounded-xl active:scale-[0.98] transition-all duration-200 text-xs uppercase tracking-wider cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
