import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const registerResult = await register(name, email, password);
    
    if (registerResult.success) {
      // Auto login user after registration
      const loginResult = await login(email, password);
      setLoading(false);
      if (loginResult.success) {
        navigate('/');
      } else {
        setError('Registered successfully, but auto-login failed. Please sign in manually.');
      }
    } else {
      setLoading(false);
      setError(registerResult.message);
    }
  };

  return (
    <div className="w-full max-w-xs px-5 py-4 bg-deep-purple/95 backdrop-blur-2xl border-t border-x border-purple-rose/85 rounded-t-[32px] rounded-b-none shadow-2xl transition-all duration-300 relative z-10 font-sans pb-4 animate-in slide-in-from-bottom duration-300 overflow-visible">
      {/* Sitting Cat Mascot */}
      <img 
        src={(password || confirmPassword) ? "/eyesclosed-cat.png" : email ? "/happy-cat.png" : "/cat.png"} 
        alt="Mascot" 
        className="absolute bottom-full left-1/2 w-32 h-auto pointer-events-none select-none animate-cat-sit" 
      />

      {/* Header */}
      <div className="text-center mb-3.5">
        <p className="text-light-blush/80 text-[10px] font-bold uppercase tracking-wider">Join HisabKitab</p>
      </div>

      {error && (
        <div className="mb-3.5 p-2.5 bg-rose-pink/10 border border-rose-pink/30 text-rose-pink rounded-xl text-xs text-center font-semibold">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-light-blush text-[9px] font-bold uppercase tracking-wider mb-0.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-rose-pink focus:ring-1 focus:ring-rose-pink/30 transition-all placeholder:text-light-blush/30 font-medium"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-light-blush text-[9px] font-bold uppercase tracking-wider mb-0.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-rose-pink focus:ring-1 focus:ring-rose-pink/30 transition-all placeholder:text-light-blush/30 font-medium"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-light-blush text-[9px] font-bold uppercase tracking-wider mb-0.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-rose-pink focus:ring-1 focus:ring-rose-pink/30 transition-all placeholder:text-light-blush/30 font-medium"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-light-blush text-[9px] font-bold uppercase tracking-wider mb-0.5">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-rose-pink focus:ring-1 focus:ring-rose-pink/30 transition-all placeholder:text-light-blush/30 font-medium"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-rose-pink to-peach-orange hover:opacity-90 text-dark-navy font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-rose-pink/10 active:scale-[0.98] transition-all duration-300 text-xs uppercase tracking-wider mt-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
