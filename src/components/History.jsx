import { useState } from 'react';
import { History as HistoryIcon, Calendar, WifiOff, Globe, BookOpen, Smartphone } from 'lucide-react';

export default function History({ blocks }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth();

  // Aggregate all transactions from past completed months
  const pastTransactions = [];
  blocks.forEach((block) => {
    const txs = block.transactions || [];
    txs.forEach((tx) => {
      const txDate = new Date(tx.date);
      const isPast =
        txDate.getFullYear() < currentYear ||
        (txDate.getFullYear() === currentYear && txDate.getMonth() < currentMonthNum);
      if (isPast) {
        pastTransactions.push({
          ...tx,
          blockName: block.name,
          color: block.color,
        });
      }
    });
  });

  // Extract unique completed months
  const completedMonths = [];
  pastTransactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    const monthKey = txDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!completedMonths.includes(monthKey)) {
      completedMonths.push(monthKey);
    }
  });

  const [monthSelection, setMonthSelection] = useState('');
  const selectedMonth = monthSelection || completedMonths[0] || '';
  const [expandedBlockId, setExpandedBlockId] = useState(null);

  const colorOptions = [
    { name: 'rosePink', bg: 'bg-rose-pink/10', border: 'border-rose-pink/30', text: 'text-rose-pink', fill: 'bg-rose-pink' },
    { name: 'peachOrange', bg: 'bg-peach-orange/10', border: 'border-peach-orange/30', text: 'text-peach-orange', fill: 'bg-peach-orange' },
    { name: 'lightBlush', bg: 'bg-light-blush/10', border: 'border-light-blush/30', text: 'text-light-blush', fill: 'bg-light-blush' },
    { name: 'purpleRose', bg: 'bg-purple-rose/10', border: 'border-purple-rose/30', text: 'text-purple-rose', fill: 'bg-purple-rose' },
    { name: 'deepPurple', bg: 'bg-deep-purple/10', border: 'border-deep-purple/30', text: 'text-deep-purple', fill: 'bg-deep-purple' },
  ];

  const getBlockColorClasses = (colorName) => {
    return colorOptions.find(c => c.name === colorName) || colorOptions[0];
  };

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

  // Helper to dynamically calculate detailed offline, online and total balances for target month
  const calculateHistoryBalances = (block, targetMonthStr) => {
    const txs = block.transactions || [];
    
    // Filter transactions to targetMonthStr
    const monthTxs = txs.filter((tx) => {
      const txDate = new Date(tx.date);
      const key = txDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      return key === targetMonthStr;
    });

    let offlineTrans = 0;
    let onlineTrans = 0;

    monthTxs.forEach((tx) => {
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
      total: offlineBalance + onlineBalance,
      transactions: monthTxs
    };
  };

  // Filter blocks that have transactions in the selected historical month
  const activeMonthBlocks = blocks.filter((block) => {
    const balances = calculateHistoryBalances(block, selectedMonth);
    return balances.transactions.length > 0;
  });

  const selectedExpandedBlock = blocks.find(b => b.id === expandedBlockId);
  const expandedBlockDetails = selectedExpandedBlock ? calculateHistoryBalances(selectedExpandedBlock, selectedMonth) : null;

  return (
    <div className="w-full max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className="bg-deep-purple/40 p-4 border border-purple-rose/85 rounded-3xl flex items-center gap-2">
        <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-xl">
          <HistoryIcon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white">Monthly Archives</h2>
          <p className="text-[10px] text-light-blush/60">Past completed months logs grouped block-wise</p>
        </div>
      </div>

      {completedMonths.length === 0 ? (
        <div className="text-center py-16 bg-deep-purple/20 border border-dashed border-purple-rose/60 rounded-3xl p-6">
          <Calendar className="w-8 h-8 text-light-blush/40 mx-auto mb-2 opacity-50" />
          <h4 className="text-xs font-bold text-white uppercase">No Archives Yet</h4>
          <p className="text-light-blush/50 text-[10px] mt-1">
            Once a calendar month ends, past entries will automatically shift here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Month Selector dropdown */}
          <div className="bg-dark-navy border border-purple-rose/65 p-3 rounded-2xl flex items-center justify-between gap-3">
            <span className="text-[10px] text-light-blush/50 font-bold uppercase tracking-wider">Select Archived Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setMonthSelection(e.target.value);
                setExpandedBlockId(null); // Reset expand on month change
              }}
              className="bg-deep-purple border border-purple-rose/65 text-xs font-black text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-rose-pink cursor-pointer"
            >
              {completedMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Grid list of blocks for selectedMonth */}
          <div className="grid grid-cols-2 gap-4">
            {activeMonthBlocks.map((block) => {
              const colorStyles = getBlockColorClasses(block.color);
              const balances = calculateHistoryBalances(block, selectedMonth);
              const isExpanded = expandedBlockId === block.id;

              return (
                <div
                  key={block.id}
                  onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                  className={`bg-deep-purple/40 border rounded-3xl p-4 shadow flex flex-col justify-between transition-all group duration-300 relative overflow-hidden cursor-pointer ${
                    isExpanded ? 'border-rose-pink shadow-lg shadow-rose-pink/5' : 'border-purple-rose/85 hover:border-purple-rose'
                  }`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorStyles.fill} opacity-60`} />

                  <div>
                    <div className="flex justify-between items-start mb-3">
                      {getModeBadge(block.mode)}
                      <BookOpen className={`w-3.5 h-3.5 transition-colors ${isExpanded ? 'text-rose-pink' : 'text-light-blush/35'}`} />
                    </div>

                    <h3 className="text-sm font-black text-white truncate">
                      {block.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-rose/40 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-light-blush/75 font-semibold">
                      <span>Online:</span>
                      <span className="font-extrabold text-white">₹{balances.online.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-light-blush/75 font-semibold">
                      <span>Offline:</span>
                      <span className="font-extrabold text-white">₹{balances.offline.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-light-blush font-black border-t border-purple-rose/30 pt-2 mt-2 text-sm">
                      <span className="uppercase tracking-wider">Total:</span>
                      <span className="text-peach-orange">₹{balances.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Collapsible/Expandable Entries list for the selected block */}
          {expandedBlockId && expandedBlockDetails && (
            <div className="bg-deep-purple/45 border border-purple-rose/85 rounded-3xl p-4 space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex justify-between items-center border-b border-purple-rose/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-pink" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    {selectedExpandedBlock.name} Entries
                  </h4>
                </div>
                <button 
                  onClick={() => setExpandedBlockId(null)}
                  className="text-[10px] font-bold text-light-blush/50 hover:text-white uppercase tracking-widest"
                >
                  Close [X]
                </button>
              </div>

              {/* Transaction List */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {expandedBlockDetails.transactions.map((tx) => {
                  const formattedDate = new Date(tx.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short'
                  });

                  return (
                    <div
                      key={tx.id}
                      className="bg-deep-purple/40 border border-purple-rose/85 rounded-2xl p-3 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded bg-dark-navy border border-purple-rose/65 text-light-blush/40">
                          {tx.mode === 'online' ? <Globe className="w-3 h-3" /> : <WifiOff className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{tx.description}</p>
                          <span className="text-[8px] text-light-blush/40 font-bold uppercase">{formattedDate}</span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-white">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
