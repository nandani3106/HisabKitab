import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Trash2, Globe, WifiOff, Smartphone, Pencil, Check, X, Search } from 'lucide-react';

export default function Home({ blocks, onAddBlock, onUpdateBlock, onDeleteBlock }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState('both'); // offline, online, both
  const [initialBalance, setInitialBalance] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Block States
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMode, setEditMode] = useState('both');
  const [editColor, setEditColor] = useState('rosePink');
  const [editBalance, setEditBalance] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Automatically assign a random color theme to keep dashboards vibrant
    const colorNames = ['rosePink', 'peachOrange', 'lightBlush', 'purpleRose', 'deepPurple'];
    const randomColor = colorNames[Math.floor(Math.random() * colorNames.length)];

    onAddBlock({
      name: name.trim(),
      mode,
      color: randomColor,
      balance: Number(initialBalance) || 0,
    });

    setName('');
    setMode('both');
    setInitialBalance('');
    setShowAddForm(false);
  };

  const startEdit = (block) => {
    setEditingBlockId(block.id);
    setEditName(block.name);
    setEditMode(block.mode);
    setEditColor(block.color);
    setEditBalance(block.balance.toString());
  };

  const handleEditSubmit = (e, blockId) => {
    e.preventDefault();
    if (!editName.trim()) return;

    onUpdateBlock(blockId, {
      name: editName.trim(),
      mode: editMode,
      color: editColor,
      balance: Number(editBalance) || 0
    });

    setEditingBlockId(null);
  };

  const colorOptions = [
    { name: 'rosePink', bg: 'bg-rose-pink/10', border: 'border-rose-pink/30', text: 'text-rose-pink', fill: 'bg-rose-pink' },
    { name: 'peachOrange', bg: 'bg-peach-orange/10', border: 'border-peach-orange/30', text: 'text-peach-orange', fill: 'bg-peach-orange' },
    { name: 'lightBlush', bg: 'bg-light-blush/10', border: 'border-light-blush/30', text: 'text-light-blush', fill: 'bg-light-blush' },
    { name: 'purpleRose', bg: 'bg-purple-rose/10', border: 'border-purple-rose/30', text: 'text-purple-rose', fill: 'bg-purple-rose' },
    { name: 'deepPurple', bg: 'bg-deep-purple/10', border: 'border-deep-purple/30', text: 'text-deep-purple', fill: 'bg-deep-purple' },
  ];

  const getModeBadge = (blockMode) => {
    switch (blockMode) {
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-peach-orange/10 text-peach-orange border border-peach-orange/20">
            <WifiOff className="w-2.5 h-2.5" /> Offline
          </span>
        );
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-light-blush/15 text-light-blush border border-light-blush/20">
            <Globe className="w-2.5 h-2.5" /> Online
          </span>
        );
      case 'both':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-rose-pink/10 text-rose-pink border border-rose-pink/20">
            <Smartphone className="w-2.5 h-2.5" /> Both
          </span>
        );
    }
  };

  const getBlockColorClasses = (colorName) => {
    return colorOptions.find(c => c.name === colorName) || colorOptions[0];
  };

  // Helper to dynamically calculate detailed offline, online and total balances
  const calculateBalances = (block) => {
    const txs = block.transactions || [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    // Filter to current calendar month
    const currentMonthTxs = txs.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum;
    });

    let offlineTrans = 0;
    let onlineTrans = 0;

    currentMonthTxs.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.mode === 'online') {
        onlineTrans += amt;
      } else {
        offlineTrans += amt;
      }
    });

    const base = Number(block.balance || 0);
    let offlineBalance = 0;
    let onlineBalance = 0;

    if (block.mode === 'both') {
      offlineBalance = base + offlineTrans;
      onlineBalance = onlineTrans;
    } else if (block.mode === 'offline') {
      offlineBalance = base + offlineTrans;
      onlineBalance = 0;
    } else { // 'online'
      offlineBalance = 0;
      onlineBalance = base + onlineTrans;
    }

    return {
      offline: offlineBalance,
      online: onlineBalance,
      total: offlineBalance + onlineBalance
    };
  };

  // Filter blocks by search query (checks block name, initial balance, transaction descriptions, transaction amounts, dates, and modes)
  const filteredBlocks = blocks.filter(block => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // 1. Check Block Name
    if (block.name.toLowerCase().includes(query)) return true;

    // 2. Check Block Initial Balance
    if (block.balance && block.balance.toString().includes(query)) return true;

    // 3. Check Nested Transactions (description, amount, date, mode)
    const txs = block.transactions || [];
    return txs.some(tx => {
      const descMatch = tx.description && tx.description.toLowerCase().includes(query);
      const amtMatch = tx.amount && tx.amount.toString().includes(query);
      const modeMatch = tx.mode && tx.mode.toLowerCase().includes(query);
      const dateMatch = tx.date && tx.date.includes(query);
      return descMatch || amtMatch || modeMatch || dateMatch;
    });
  });

  return (
    <div className="w-full space-y-6">
      {/* Overview Header / Add Actions */}
      <div className="flex justify-between items-center bg-deep-purple/40 p-4 border border-purple-rose/85 rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">Your Blocks</h2>
            <p className="text-[10px] text-light-blush/60">Select a block to add or view entries</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingBlockId(null);
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[10px] uppercase tracking-wider transition-all duration-300 shadow active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Block
        </button>
      </div>

      {/* Add Block Form */}
      {showAddForm && (
        <form 
          onSubmit={handleAddSubmit} 
          className="bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-light-blush">Create New Block</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-light-blush/70 text-[9px] font-bold uppercase tracking-wider mb-1">Block Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Household, Business..."
                className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-pink transition-all font-semibold placeholder:text-light-blush/25"
                required
              />
            </div>

            <div>
              <label className="block text-light-blush/70 text-[9px] font-bold uppercase tracking-wider mb-1">Initial Balance (₹)</label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-pink transition-all font-semibold placeholder:text-light-blush/25"
              />
            </div>

            <div>
              <label className="block text-light-blush/70 text-[9px] font-bold uppercase tracking-wider mb-1">Mode Type</label>
              <div className="grid grid-cols-3 gap-1 bg-dark-navy p-1 rounded-xl border border-purple-rose/65">
                {['offline', 'online', 'both'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-1 rounded-lg text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                      mode === m
                        ? 'bg-rose-pink/15 text-rose-pink border border-rose-pink/20'
                        : 'text-light-blush/40 hover:text-light-blush/80'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-purple-rose/30">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-[10px] font-bold text-light-blush/50 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[10px] uppercase tracking-wider transition-all shadow active:scale-95 cursor-pointer"
            >
              Save Block
            </button>
          </div>
        </form>
      )}


      {/* Grid of Blocks */}
      {blocks.length === 0 ? (
        <div className="text-center py-20 bg-deep-purple/20 border border-dashed border-purple-rose/65 rounded-3xl p-6">
          <Layers className="w-10 h-10 text-light-blush/40 mx-auto mb-3 opacity-55" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Blocks Created</h4>
          <p className="text-xs text-light-blush/50 mt-1.5">Tap 'Add Block' above to build your first tracker ledger.</p>
        </div>
      ) : filteredBlocks.length === 0 ? (
        <div className="text-center py-16 bg-deep-purple/20 border border-dashed border-purple-rose/65 rounded-3xl p-6">
          <Search className="w-8 h-8 text-light-blush/30 mx-auto mb-2 opacity-50" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Results Found</h4>
          <p className="text-[10px] text-light-blush/50 mt-1">No blocks match "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredBlocks.map((block) => {
            const colorStyles = getBlockColorClasses(block.color);
            const balances = calculateBalances(block);

            // Inline edit view for block card
            if (editingBlockId === block.id) {
              return (
                <form
                  key={block.id}
                  onSubmit={(e) => handleEditSubmit(e, block.id)}
                  className="wooden-board brightness-110 p-4 shadow-2xl flex flex-col justify-between relative overflow-hidden space-y-3 animate-in zoom-in-95 duration-200"
                >

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-rose-pink">Editing</span>
                      <div className="flex gap-1.5">
                        <button
                          type="submit"
                          className="p-1 bg-rose-pink/15 hover:bg-rose-pink hover:text-dark-navy text-rose-pink rounded transition-colors cursor-pointer"
                          title="Save Changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBlockId(null)}
                          className="p-1 bg-dark-navy hover:text-white text-light-blush/50 rounded transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-light-blush/60 text-[8px] font-bold uppercase mb-0.5">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-dark-navy border border-purple-rose/65 rounded-lg px-2 py-1 text-white text-[11px] font-bold focus:outline-none focus:border-rose-pink"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-light-blush/60 text-[8px] font-bold uppercase mb-0.5">Initial Bal (₹)</label>
                      <input
                        type="number"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value)}
                        className="w-full bg-dark-navy border border-purple-rose/65 rounded-lg px-2 py-0.5 text-white text-[11px] font-bold focus:outline-none focus:border-rose-pink"
                      />
                    </div>

                    <div>
                      <label className="block text-light-blush/60 text-[8px] font-bold uppercase mb-0.5">Mode</label>
                      <div className="grid grid-cols-3 gap-0.5 bg-dark-navy p-0.5 rounded-lg border border-purple-rose/65">
                        {['offline', 'online', 'both'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setEditMode(m)}
                            className={`py-0.5 rounded text-[7px] font-extrabold uppercase transition-all cursor-pointer ${
                              editMode === m
                                ? 'bg-rose-pink/20 text-rose-pink border border-rose-pink/10'
                                : 'text-light-blush/40'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-light-blush/60 text-[8px] font-bold uppercase mb-0.5">Color</label>
                      <div className="flex gap-1 justify-center py-0.5">
                        {colorOptions.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setEditColor(c.name)}
                            className={`w-3.5 h-3.5 rounded-full ${c.fill} transition-all cursor-pointer ${
                              editColor === c.name 
                                ? 'ring-1 ring-white ring-offset-1 ring-offset-dark-navy scale-110' 
                                : 'opacity-60'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              );
            }

            // Normal Block card view
            return (
              <div
                key={block.id}
                className="wooden-board p-4 flex flex-col justify-between transition-all group duration-300 hover:scale-[1.03] hover:shadow-2xl relative overflow-hidden"
              >

                <div>
                  <div className="flex justify-between items-start mb-3">
                    {getModeBadge(block.mode)}
                    
                    <div className="flex items-center gap-1 z-20">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          startEdit(block);
                        }}
                        className="p-1 text-white/50 hover:text-white hover:bg-black/35 rounded-lg transition-all md:opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Edit Block"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onDeleteBlock(block.id);
                        }}
                        className="p-1 text-white/50 hover:text-red-400 hover:bg-black/35 rounded-lg transition-all md:opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete Block"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <Link
                    to={`/block/${block.id}`}
                    className="block group-hover:brightness-110 transition-all z-10 relative"
                  >
                    <h3 className="text-sm font-black text-white hover:text-white truncate">
                      {block.name}
                    </h3>
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-black/20 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-[#C0CDE6] font-semibold">
                    <span>Online:</span>
                    <span className="font-extrabold text-white">₹{balances.online.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#C0CDE6] font-semibold">
                    <span>Offline:</span>
                    <span className="font-extrabold text-white">₹{balances.offline.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#FAFDFD] font-black border-t border-black/25 pt-2 mt-2 text-sm">
                    <span className="uppercase tracking-wider">Total:</span>
                    <span className="text-[#ABC4E6] font-extrabold">₹{balances.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
