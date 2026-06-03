import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

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
    <div className="w-full max-w-md px-6 py-8 sm:px-8 bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl shadow-2xl transition-all duration-300 relative z-10 font-sans">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-pink to-peach-orange text-dark-navy font-black text-2xl mb-4 shadow-lg shadow-rose-pink/15">
          HK
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Welcome Back</h2>
        <p className="text-light-blush/60 text-xs mt-1.5">Sign in to manage your HisabKitab account</p>
      </div>

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
    </div>
  );
}
