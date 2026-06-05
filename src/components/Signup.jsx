import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { translations } from '../utils/translations';
import { Eye, EyeOff } from 'lucide-react';

export default function Signup({ language = 'en' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError(language === 'en' ? 'Please fill in all fields.' : 'कृपया सभी फ़ील्ड भरें।');
      return;
    }

    if (password !== confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match.' : 'पासवर्ड मेल नहीं खाते हैं।');
      return;
    }

    if (password.length < 6) {
      setError(language === 'en' ? 'Password must be at least 6 characters long.' : 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
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
        setError(language === 'en' 
          ? 'Registered successfully, but auto-login failed. Please sign in manually.' 
          : 'सफलतापूर्वक पंजीकरण हो गया, लेकिन ऑटो-लॉगिन विफल रहा। कृपया मैन्युअल रूप से साइन इन करें।');
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
        <p className="text-light-blush/80 text-[10px] font-bold uppercase tracking-wider">
          {translations[language]?.signupSubtitle || "Sign up to start tracking ledgers"}
        </p>
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
            {translations[language]?.nameLabel || "Full Name"}
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
            {translations[language]?.emailLabel || "Email Address"}
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
            {translations[language]?.passwordLabel || "Password"}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl pl-3.5 pr-10 py-2 text-white text-xs focus:outline-none focus:border-rose-pink focus:ring-1 focus:ring-rose-pink/30 transition-all placeholder:text-light-blush/30 font-medium"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-light-blush/50 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-light-blush text-[9px] font-bold uppercase tracking-wider mb-0.5">
            {language === 'en' ? 'Confirm Password' : 'पासवर्ड की पुष्टि करें'}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl pl-3.5 pr-10 py-2 text-white text-xs focus:outline-none focus:border-rose-pink focus:ring-1 focus:ring-rose-pink/30 transition-all placeholder:text-light-blush/30 font-medium"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-light-blush/50 hover:text-white transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-rose-pink to-peach-orange hover:opacity-90 text-dark-navy font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-rose-pink/10 active:scale-[0.98] transition-all duration-300 text-xs uppercase tracking-wider mt-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? (language === 'en' ? 'Creating...' : 'खाता बनाया जा रहा है...') : (translations[language]?.signupBtn || 'Register Now')}
        </button>
      </form>
    </div>
  );
}
