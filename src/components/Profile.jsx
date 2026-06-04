import { User, Key, Mail, ShieldAlert } from 'lucide-react';
import { translations } from '../utils/translations';

export default function Profile({ currentUser, language = 'en' }) {
  return (
    <div className="w-full max-w-md mx-auto bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-14 h-14 bg-gradient-to-tr from-rose-pink to-peach-orange text-dark-navy rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-md">
        HK
      </div>
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">
          {translations[language]?.profileTitle || "Profile Summary"}
        </h2>
        <p className="text-light-blush/60 text-xs mt-1">
          {language === 'en' ? 'Status details for your personal account' : 'आपके व्यक्तिगत खाते का विवरण'}
        </p>
      </div>

      <div className="space-y-3 text-left">
        <div className="p-3 bg-dark-navy rounded-2xl border border-purple-rose/65 flex items-center gap-3">
          <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-lg">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] text-light-blush/50 font-bold uppercase">
              {language === 'en' ? 'Full Name' : 'पूरा नाम'}
            </p>
            <p className="text-xs font-semibold text-white">{currentUser.name}</p>
          </div>
        </div>

        <div className="p-3 bg-dark-navy rounded-2xl border border-purple-rose/65 flex items-center gap-3">
          <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-lg">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] text-light-blush/50 font-bold uppercase">
              {language === 'en' ? 'Email Address' : 'ईमेल पता'}
            </p>
            <p className="text-xs font-semibold text-white">{currentUser.email}</p>
          </div>
        </div>

        <div className="p-3 bg-dark-navy rounded-2xl border border-purple-rose/65 flex items-center gap-3">
          <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-lg">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] text-light-blush/50 font-bold uppercase">
              {language === 'en' ? 'User ID Token' : 'यूज़र आईडी टोकन'}
            </p>
            <p className="text-[10px] font-mono text-light-blush/80 truncate w-48">{currentUser.id}</p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-peach-orange/10 border border-peach-orange/20 text-peach-orange rounded-xl text-[10px] text-center font-bold flex items-center justify-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5" />
        {language === 'en' ? 'All storage is locked & encrypted locally on device' : 'सभी डेटा सुरक्षित और स्थानीय रूप से एन्क्रिप्टेड है'}
      </div>

      <div className="pt-3 border-t border-purple-rose/25 text-[9px] font-bold text-light-blush/40 flex flex-col items-center gap-0.5">
        <span>powered by</span>
        <span className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-pink via-peach-orange to-light-blush tracking-wider uppercase">Nandani Sankhla</span>
      </div>
    </div>
  );
}
