import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, WifiOff, Globe, Plus, Trash2, Calendar, Pencil, Check, X } from 'lucide-react';

export default function BlockDetail({ blocks, onAddTransaction, onUpdateTransaction, onDeleteTransaction }) {
  const { id } = useParams();
  const block = blocks.find(b => b.id === id);

  // Set the default sub-block tab based on block type configuration (safely handled via optional chaining)
  const defaultTab = block?.mode === 'online' ? 'online' : 'offline';
  
  // React hook declarations
  const [activeTab, setActiveTab] = useState(defaultTab); // 'offline' or 'online'
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Transaction Editing State
  const [editingTxId, setEditingTxId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');

  // Early return redirect if block doesn't exist
  if (!block) {
    return <Navigate to="/" replace />;
  }

  // Filter transactions for this block matching activeTab and current calendar month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth();

  const blockTransactions = block.transactions || [];
  const filteredTxs = blockTransactions.filter(tx => {
    if (tx.mode !== activeTab) return false;
    const txDate = new Date(tx.date);
    return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum;
  });

  // Group transactions by date
  const groupedTransactions = filteredTxs.reduce((groups, tx) => {
    const key = tx.date;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(tx);
    return groups;
  }, {});

  // Sort dates descending
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim()) return;

    onAddTransaction(block.id, {
      amount: Number(amount),
      description: description.trim(),
      date,
      mode: activeTab // 'offline' or 'online'
    });

    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(false);
  };

  const startEditTx = (tx) => {
    setEditingTxId(tx.id);
    setEditAmount(tx.amount.toString());
    setEditDescription(tx.description);
    setEditDate(tx.date);
  };

  const handleEditTxSubmit = (e, txId) => {
    e.preventDefault();
    if (!editAmount || Number(editAmount) <= 0 || !editDescription.trim() || !editDate) return;

    onUpdateTransaction(block.id, txId, {
      amount: Number(editAmount),
      description: editDescription.trim(),
      date: editDate,
      mode: activeTab
    });

    setEditingTxId(null);
  };

  // Helper to get total mode balance
  const getModeTotal = (modeName) => {
    const currentMonthTxs = blockTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum;
    });

    const total = currentMonthTxs
      .filter(tx => tx.mode === modeName)
      .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
    
    // Add initial balance portion if block.mode is set specifically
    const base = block.mode === 'both' || block.mode === modeName ? Number(block.balance || 0) : 0;
    // For mode 'both', let's distribute initial balance to offline tab as base
    if (block.mode === 'both') {
      return modeName === 'offline' ? base + total : total;
    }
    return base + total;
  };

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex justify-between items-center bg-deep-purple/40 p-4 border border-purple-rose/85 rounded-3xl">
        <div className="flex items-center gap-2">
          <Link to="/" className="p-2 bg-dark-navy border border-purple-rose/65 text-light-blush/60 hover:text-white rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-sm font-black text-white capitalize">{block.name}</h2>
            <p className="text-[10px] text-light-blush/60">Transactions & sub-ledgers</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingTxId(null);
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[10px] uppercase tracking-wider transition-all duration-300 shadow active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Entry
        </button>
      </div>

      {/* Tabs for Offline and Online Sub-blocks */}
      <div className="grid grid-cols-2 gap-2 bg-dark-navy p-1.5 rounded-2xl border border-purple-rose/65">
        <button
          disabled={block.mode === 'online'}
          onClick={() => {
            setEditingTxId(null);
            setActiveTab('offline');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'offline'
              ? 'bg-rose-pink/15 text-rose-pink border border-rose-pink/20'
              : 'text-light-blush/40 hover:text-light-blush/80 disabled:opacity-30 disabled:hover:text-light-blush/40'
          }`}
        >
          <WifiOff className="w-3.5 h-3.5" />
          Offline (₹{getModeTotal('offline').toLocaleString('en-IN')})
        </button>
        <button
          disabled={block.mode === 'offline'}
          onClick={() => {
            setEditingTxId(null);
            setActiveTab('online');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'online'
              ? 'bg-rose-pink/15 text-rose-pink border border-rose-pink/20'
              : 'text-light-blush/40 hover:text-light-blush/80 disabled:opacity-30 disabled:hover:text-light-blush/40'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Online (₹{getModeTotal('online').toLocaleString('en-IN')})
        </button>
      </div>

      {/* Add Entry Form */}
      {showAddForm && (
        <form 
          onSubmit={handleAddEntry} 
          className="bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-light-blush">
            Add {activeTab} Entry
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Amount */}
              <div>
                <label className="block text-light-blush/75 text-[9px] font-bold uppercase tracking-wider mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-pink font-semibold placeholder:text-light-blush/25"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-light-blush/75 text-[9px] font-bold uppercase tracking-wider mb-1">Entry Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-pink font-semibold"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-light-blush/75 text-[9px] font-bold uppercase tracking-wider mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Groceries, salary, bill..."
                className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-pink font-semibold placeholder:text-light-blush/25"
                required
              />
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
              Save Entry
            </button>
          </div>
        </form>
      )}

      {/* Date-wise Entries List */}
      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 bg-deep-purple/20 border border-dashed border-purple-rose/60 rounded-3xl p-6">
            <Calendar className="w-8 h-8 text-light-blush/40 mx-auto mb-2 opacity-50" />
            <h4 className="text-xs font-bold text-white uppercase">No Entries Found</h4>
            <p className="text-light-blush/50 text-[10px] mt-1">Tap 'Add Entry' to register your first ledger entry.</p>
          </div>
        ) : (
          sortedDates.map((dateString) => {
            const dateObj = new Date(dateString);
            const formattedDate = dateObj.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div key={dateString} className="space-y-2">
                {/* Date header label */}
                <h4 className="text-[10px] font-black text-light-blush/50 uppercase tracking-wider ml-1">
                  {formattedDate}
                </h4>

                <div className="space-y-1.5">
                  {groupedTransactions[dateString].map((tx) => {
                    // Inline Edit Form for Transaction card
                    if (editingTxId === tx.id) {
                      return (
                        <form
                          key={tx.id}
                          onSubmit={(e) => handleEditTxSubmit(e, tx.id)}
                          className="bg-deep-purple/65 border border-rose-pink/60 rounded-2xl p-3.5 space-y-2.5 animate-in zoom-in-95 duration-200"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-bold text-rose-pink uppercase tracking-wider">Editing Entry</span>
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
                                onClick={() => setEditingTxId(null)}
                                className="p-1 bg-dark-navy hover:text-white text-light-blush/50 rounded transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-light-blush/65 text-[8px] font-bold uppercase mb-0.5">Amount (₹)</label>
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-full bg-dark-navy border border-purple-rose/65 rounded-lg px-2 py-0.5 text-white text-[11px] font-semibold focus:outline-none focus:border-rose-pink"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-light-blush/65 text-[8px] font-bold uppercase mb-0.5">Date</label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full bg-dark-navy border border-purple-rose/65 rounded-lg px-2 py-0.5 text-white text-[11px] font-semibold focus:outline-none focus:border-rose-pink"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-light-blush/65 text-[8px] font-bold uppercase mb-0.5">Description</label>
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full bg-dark-navy border border-purple-rose/65 rounded-lg px-2 py-0.5 text-white text-[11px] font-semibold focus:outline-none focus:border-rose-pink"
                              required
                            />
                          </div>
                        </form>
                      );
                    }

                    // Standard Transaction Card Details
                    return (
                      <div 
                        key={tx.id} 
                        className="bg-deep-purple/40 border border-purple-rose/85 rounded-2xl p-3 flex justify-between items-center hover:border-purple-rose transition-colors group"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">{tx.description}</p>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-black text-white">
                            ₹{tx.amount.toLocaleString('en-IN')}
                          </span>

                          <button
                            onClick={() => startEditTx(tx)}
                            className="p-1 text-light-blush/35 hover:text-peach-orange hover:bg-dark-navy rounded transition-colors md:opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Edit Entry"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteTransaction(block.id, tx.id)}
                            className="p-1 text-light-blush/35 hover:text-rose-pink hover:bg-dark-navy rounded transition-colors md:opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
