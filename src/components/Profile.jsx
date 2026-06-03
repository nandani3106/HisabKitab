import { User, Key, Mail, ShieldAlert } from 'lucide-react';

export default function Profile({ currentUser }) {
  return (
    <div className="w-full max-w-md mx-auto bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-14 h-14 bg-gradient-to-tr from-rose-pink to-peach-orange text-dark-navy rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-md">
        HK
      </div>
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Profile Summary</h2>
        <p className="text-light-blush/60 text-xs mt-1">Status details for your personal account</p>
      </div>

      <div className="space-y-3 text-left">
        <div className="p-3 bg-dark-navy rounded-2xl border border-purple-rose/65 flex items-center gap-3">
          <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-lg">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] text-light-blush/50 font-bold uppercase">Full Name</p>
            <p className="text-xs font-semibold text-white">{currentUser.name}</p>
          </div>
        </div>

        <div className="p-3 bg-dark-navy rounded-2xl border border-purple-rose/65 flex items-center gap-3">
          <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-lg">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] text-light-blush/50 font-bold uppercase">Email Address</p>
            <p className="text-xs font-semibold text-white">{currentUser.email}</p>
          </div>
        </div>

        <div className="p-3 bg-dark-navy rounded-2xl border border-purple-rose/65 flex items-center gap-3">
          <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-lg">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] text-light-blush/50 font-bold uppercase">User ID Token</p>
            <p className="text-[10px] font-mono text-light-blush/80 truncate w-48">{currentUser.id}</p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-peach-orange/10 border border-peach-orange/20 text-peach-orange rounded-xl text-[10px] text-center font-bold flex items-center justify-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5" />
        All storage is locked & encrypted locally on device
      </div>
    </div>
  );
}
