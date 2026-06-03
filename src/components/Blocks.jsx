import { useState } from 'react';
import { Layers, Plus, Trash2, Globe, WifiOff, Smartphone } from 'lucide-react';

export default function Blocks() {
  const [blocks, setBlocks] = useState(() => {
    const saved = localStorage.getItem('hk_blocks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState('both'); // offline, online, both
  const [color, setColor] = useState('emerald');
  const [initialBalance, setInitialBalance] = useState('');

  const saveBlocks = (updatedBlocks) => {
    setBlocks(updatedBlocks);
    localStorage.setItem('hk_blocks', JSON.stringify(updatedBlocks));
  };

  const handleAddBlock = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newBlock = {
      id: `b_${Date.now()}`,
      name: name.trim(),
      mode,
      color,
      balance: Number(initialBalance) || 0
    };

    const updated = [...blocks, newBlock];
    saveBlocks(updated);

    // Reset Form
    setName('');
    setMode('both');
    setColor('emerald');
    setInitialBalance('');
    setShowAddForm(false);
  };

  const handleDeleteBlock = (id) => {
    const updated = blocks.filter(b => b.id !== id);
    saveBlocks(updated);
  };

  const colorOptions = [
    { name: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', fill: 'bg-emerald-500' },
    { name: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', fill: 'bg-blue-500' },
    { name: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', fill: 'bg-amber-500' },
    { name: 'purple', bg: 'bg-purple-500/10', border: 'border-slate-800/80', text: 'text-purple-400', fill: 'bg-purple-500' },
    { name: 'rose', bg: 'bg-rose-500/10', border: 'border-slate-800/80', text: 'text-rose-400', fill: 'bg-rose-500' },
  ];

  const getModeBadge = (blockMode) => {
    switch (blockMode) {
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <WifiOff className="w-3 h-3" />
            Offline Block
          </span>
        );
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Globe className="w-3 h-3" />
            Online Block
          </span>
        );
      case 'both':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Smartphone className="w-3 h-3" />
            Online & Offline
          </span>
        );
    }
  };

  const getBlockColorClasses = (colorName) => {
    return colorOptions.find(c => c.name === colorName) || colorOptions[0];
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800/80 rounded-3xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Account Blocks</h2>
            <p className="text-xs text-slate-400">Manage multiple business or personal ledger blocks</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-emerald-500/15 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Block
        </button>
      </div>

      {/* Add Block Form */}
      {showAddForm && (
        <form 
          onSubmit={handleAddBlock} 
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Create New Block</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Block Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Household, Business A..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-700"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Initial Balance ($)</label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Ledger Mode Type</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  {['offline', 'online', 'both'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                        mode === m
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Color Accent</label>
                <div className="flex items-center gap-2 py-1.5">
                  {colorOptions.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.name)}
                      className={`w-6 h-6 rounded-full ${c.fill} transition-all relative cursor-pointer ${
                        color === c.name 
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow active:scale-95 cursor-pointer"
            >
              Save Block
            </button>
          </div>
        </form>
      )}

      {/* Grid List */}
      {blocks.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-6">
          <Layers className="w-10 h-10 text-slate-700 mx-auto mb-3 opacity-55" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Blocks Created</h4>
          <p className="text-xs text-slate-500 mt-1.5">Tap 'Add Block' above to build your first tracker ledger.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blocks.map((block) => {
            const colorStyles = getBlockColorClasses(block.color);
            return (
              <div
                key={block.id}
                className="bg-slate-905/40 border border-slate-800/80 rounded-3xl p-5 shadow flex flex-col justify-between transition-all group duration-300 hover:shadow-xl hover:border-slate-700 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorStyles.fill} opacity-50`} />

                <div>
                  <div className="flex justify-between items-start mb-4">
                    {getModeBadge(block.mode)}
                    
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-slate-950 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-black text-white hover:text-emerald-400 transition-colors truncate">
                    {block.name}
                  </h3>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Initial Base</span>
                  <span className="text-sm font-extrabold text-white">
                    ${Number(block.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
