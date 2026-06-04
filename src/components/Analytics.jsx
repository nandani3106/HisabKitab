import { useState } from 'react';
import { TrendingUp, Wallet, Landmark, Calendar, BarChart2, BookOpen } from 'lucide-react';
import { translations } from '../utils/translations';

export default function Analytics({ blocks, language = 'en' }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth();

  // Aggregate all transactions across blocks for historical charting
  const allTransactions = [];
  blocks.forEach((block) => {
    const txs = block.transactions || [];
    txs.forEach((tx) => {
      allTransactions.push(tx);
    });
  });

  // Calculate current month pool totals
  let baseBalance = 0;
  let offlineTransTotal = 0;
  let onlineTransTotal = 0;

  blocks.forEach((block) => {
    const base = Number(block.balance || 0);
    if (block.mode === 'both' || block.mode === 'offline') {
      baseBalance += base;
    } else {
      onlineTransTotal += base;
    }

    const txs = block.transactions || [];
    const currentMonthTxs = txs.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum;
    });

    currentMonthTxs.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.mode === 'online') {
        onlineTransTotal += amt;
      } else {
        offlineTransTotal += amt;
      }
    });
  });

  const colorMap = {
    rosePink: '#AE445A',
    peachOrange: '#F39F5A',
    lightBlush: '#E8BCB9',
    purpleRose: '#662549',
    deepPurple: '#451952',
  };

  // Calculate block-wise balances for listing (current month only)
  const blockBalances = blocks.map((block) => {
    let blockOffline = 0;
    let blockOnline = 0;

    const base = Number(block.balance || 0);
    if (block.mode === 'both' || block.mode === 'offline') {
      blockOffline += base;
    } else {
      blockOnline += base;
    }

    const txs = block.transactions || [];
    const currentMonthTxs = txs.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum;
    });

    currentMonthTxs.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.mode === 'online') {
        blockOnline += amt;
      } else {
        blockOffline += amt;
      }
    });

    const blockTotal = blockOffline + blockOnline;
    return {
      id: block.id,
      name: block.name,
      offline: blockOffline,
      online: blockOnline,
      total: blockTotal,
      color: block.color || 'rosePink',
    };
  });

  const offlineFinal = baseBalance + offlineTransTotal;
  const onlineFinal = onlineTransTotal;
  const netTotal = offlineFinal + onlineFinal;

  // Percentage calculations
  const totalPool = netTotal || 1;
  const offlinePercent = Math.max(0, Math.min(100, Math.round((offlineFinal / totalPool) * 100)));
  const onlinePercent = Math.max(0, Math.min(100, 100 - offlinePercent));

  // Chart grouping options: 'month', 'date', 'day', 'year'
  const [groupOption, setGroupOption] = useState('month');
  const [hoveredBar, setHoveredBar] = useState(null);

  // Group helpers
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getGroupKey = (dateStr, option) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj)) return 'Unknown';

    switch (option) {
      case 'date':
        return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      case 'day':
        const dayIdx = dateObj.getDay(); // 0 = Sunday, 1 = Monday...
        const adjustedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        return daysOfWeek[adjustedIdx];
      case 'year':
        return dateObj.getFullYear().toString();
      case 'month':
      default:
        return dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
  };

  // Group transactions for the chart
  const groupTotals = {};
  allTransactions.forEach((tx) => {
    const key = getGroupKey(tx.date, groupOption);
    groupTotals[key] = (groupTotals[key] || 0) + Number(tx.amount || 0);
  });

  // Sort keys chronologically or logically
  let sortedKeys = Object.keys(groupTotals);
  if (groupOption === 'day') {
    sortedKeys.sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b));
  } else if (groupOption === 'year') {
    sortedKeys.sort((a, b) => Number(a) - Number(b));
  } else {
    // Sort by Date object representation
    sortedKeys.sort((a, b) => {
      const txA = allTransactions.find((t) => getGroupKey(t.date, groupOption) === a);
      const txB = allTransactions.find((t) => getGroupKey(t.date, groupOption) === b);
      return new Date(txA?.date || 0) - new Date(txB?.date || 0);
    });
  }

  // Final chart dataset
  const chartData = sortedKeys.map((key) => ({
    label: key,
    value: groupTotals[key],
  }));

  // Month-wise Comparison logic
  const monthTotals = {};
  allTransactions.forEach((tx) => {
    const key = getGroupKey(tx.date, 'month');
    monthTotals[key] = (monthTotals[key] || 0) + Number(tx.amount || 0);
  });

  const sortedMonthKeys = Object.keys(monthTotals).sort((a, b) => {
    const txA = allTransactions.find((t) => getGroupKey(t.date, 'month') === a);
    const txB = allTransactions.find((t) => getGroupKey(t.date, 'month') === b);
    return new Date(txA?.date || 0) - new Date(txB?.date || 0);
  });

  const monthComparisons = [];
  for (let i = 0; i < sortedMonthKeys.length; i++) {
    const month = sortedMonthKeys[i];
    const total = monthTotals[month];
    let diff = 0;
    let pct = 0;
    let prevMonth = null;

    if (i > 0) {
      prevMonth = sortedMonthKeys[i - 1];
      const prevTotal = monthTotals[prevMonth];
      diff = total - prevTotal;
      pct = prevTotal !== 0 ? (diff / prevTotal) * 100 : 0;
    }

    monthComparisons.push({
      month,
      total,
      diff,
      pct,
      prevMonth,
    });
  }

  // Reverse to show most recent comparative trends first
  monthComparisons.reverse();

  // Custom SVG Bar Chart sizing
  const svgWidth = 350;
  const svgHeight = 160;
  const paddingLeft = 35;
  const paddingBottom = 25;
  const paddingTop = 15;
  const paddingRight = 10;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxVal = chartData.reduce((max, d) => Math.max(max, d.value), 0) || 1000;
  const gridLinesCount = 3;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-6 animate-in fade-in duration-300">

      {/* Header Info */}
      <div className="bg-deep-purple/40 p-4 border border-purple-rose/85 rounded-3xl flex items-center gap-2">
        <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-xl">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white">{translations[language]?.analyticsTitle || "Financial Analytics"}</h2>
          <p className="text-[10px] text-light-blush/60">{language === 'en' ? 'Aggregated spendings and transaction ratios' : 'कुल खर्च और लेनदेन अनुपात'}</p>
        </div>
      </div>

      {/* Main Net Balance Card */}
      <div className="bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-5 shadow-xl text-center space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-pink to-peach-orange" />
        <span className="text-[9px] text-light-blush/50 font-bold uppercase tracking-wider">{translations[language]?.totalNetBalance || "Total Net Balance (Current Month)"}</span>
        <h3 className="text-2xl font-black text-white">₹{netTotal.toLocaleString('en-IN')}</h3>
      </div>

      {/* Ledger Splits */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-deep-purple/40 border border-purple-rose/85 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] text-light-blush/50 font-bold uppercase">{translations[language]?.offlinePool || "Offline Pool"}</span>
            <Wallet className="w-3.5 h-3.5 text-peach-orange" />
          </div>
          <span className="text-base font-black text-white">₹{offlineFinal.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-deep-purple/40 border border-purple-rose/85 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] text-light-blush/50 font-bold uppercase">{translations[language]?.onlinePool || "Online Pool"}</span>
            <Landmark className="w-3.5 h-3.5 text-light-blush" />
          </div>
          <span className="text-base font-black text-white">₹{onlineFinal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Block-wise Balance breakdown */}
      <div className="bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-5 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{language === 'en' ? 'Blocks Balance Breakdown (Current Month)' : 'ब्लॉक-वार बैलेंस विवरण (चालू माह)'}</h4>
        <div className="grid grid-cols-2 gap-2">
          {blockBalances.map((item) => (
            <div key={item.id} className="p-2.5 bg-dark-navy/60 border border-purple-rose/65 rounded-2xl flex justify-between items-center animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colorMap[item.color] || '#AE445A' }} />
                <span className="text-[10px] font-bold text-white capitalize truncate">{item.name}</span>
              </div>
              <span className="text-[10px] font-black text-light-blush shrink-0 ml-1">
                ₹{item.total.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Expense Chart */}
      <div className="bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
            <BarChart2 className="w-4 h-4 text-rose-pink" />
            <span>{language === 'en' ? 'Activity Chart' : 'गतिविधि चार्ट'}</span>
          </div>

          {/* Group Options Selection Tab */}
          <div className="flex bg-dark-navy p-0.5 rounded-lg border border-purple-rose/65">
            {['day', 'date', 'month', 'year'].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setGroupOption(opt);
                  setHoveredBar(null);
                }}
                className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${groupOption === opt
                    ? 'bg-rose-pink/15 text-rose-pink border border-rose-pink/10'
                    : 'text-light-blush/40 hover:text-light-blush/80'
                  }`}
              >
                {opt === 'day' ? (language === 'en' ? 'day' : 'दिन') : opt === 'date' ? (language === 'en' ? 'date' : 'तारीख') : opt === 'month' ? (language === 'en' ? 'month' : 'महीना') : (language === 'en' ? 'year' : 'साल')}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-10 text-light-blush/40 text-[10px] font-bold uppercase">
            {language === 'en' ? 'No transaction records found to chart' : 'चार्ट के लिए कोई लेनदेन रिकॉर्ड नहीं मिला'}
          </div>
        ) : (
          <div className="relative pt-2">
            {/* Custom SVG Bar Chart */}
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#AE445A" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F39F5A" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {Array.from({ length: gridLinesCount + 1 }).map((_, i) => {
                const y = paddingTop + (chartHeight / gridLinesCount) * i;
                const value = Math.round(maxVal - (maxVal / gridLinesCount) * i);
                return (
                  <g key={i} className="opacity-20">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#E8BCB9"
                      strokeWidth="0.5"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingLeft - 5}
                      y={y + 3}
                      fill="#E8BCB9"
                      fontSize="7"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      ₹{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                    </text>
                  </g>
                );
              })}

              {/* Chart Bars */}
              {chartData.map((d, index) => {
                const barSpacing = chartWidth / chartData.length;
                const barWidth = Math.max(5, barSpacing * 0.6);
                const x = paddingLeft + barSpacing * index + (barSpacing - barWidth) / 2;
                const barHeight = (d.value / maxVal) * chartHeight;
                const y = svgHeight - paddingBottom - barHeight;

                return (
                  <g key={index}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="url(#barGradient)"
                      rx="3.5"
                      className="cursor-pointer transition-all duration-300 hover:opacity-100"
                      opacity={hoveredBar?.label === d.label ? 1 : 0.8}
                      onMouseEnter={(e) => {
                        setHoveredBar({
                          label: d.label,
                          value: d.value,
                          x: x + barWidth / 2,
                          y: y - 10,
                        });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {/* X axis labels */}
                    <text
                      x={x + barWidth / 2}
                      y={svgHeight - paddingBottom + 12}
                      fill="#E8BCB9"
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="middle"
                      transform={`rotate(-15, ${x + barWidth / 2}, ${svgHeight - paddingBottom + 12})`}
                      className="truncate"
                      style={{ maxWidth: barSpacing }}
                    >
                      {d.label.length > 8 ? `${d.label.substring(0, 6)}..` : d.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Tooltip Popup Overlay */}
            {hoveredBar && (
              <div
                style={{
                  left: `${(hoveredBar.x / svgWidth) * 100}%`,
                  top: `${(hoveredBar.y / svgHeight) * 100}%`,
                }}
                className="absolute transform -translate-x-1/2 -translate-y-full bg-dark-navy/95 border border-purple-rose/85 px-2 py-1 rounded-lg text-center pointer-events-none shadow-xl z-30"
              >
                <p className="text-[7px] text-light-blush/60 uppercase font-black tracking-wider leading-none">
                  {hoveredBar.label}
                </p>
                <p className="text-[10px] font-black text-white mt-0.5">
                  ₹{hoveredBar.value.toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Month-over-Month Comparison Engine */}
      <div className="bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-peach-orange" />
          <span>{language === 'en' ? 'Monthly Comparison' : 'मासिक तुलना'}</span>
        </div>

        {monthComparisons.length === 0 ? (
          <div className="text-center py-6 text-light-blush/40 text-[10px] font-bold uppercase">
            {language === 'en' ? 'No history periods found to compare' : 'तुलना के लिए कोई पुराना डेटा नहीं मिला'}
          </div>
        ) : (
          <div className="space-y-3.5">
            {monthComparisons.map((c, idx) => {
              const hasPrev = c.prevMonth !== null;
              const isGrowth = c.diff > 0;
              const isReduction = c.diff < 0;

              return (
                <div
                  key={c.month}
                  className="bg-dark-navy/40 border border-purple-rose/65 p-4 rounded-3xl space-y-3.5"
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-rose-pink" />
                    <h5 className="text-xs font-black text-white">
                      {c.month}
                    </h5>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-purple-rose/25">
                    <div className="space-y-1">
                      <span className="text-[8px] text-light-blush/40 font-bold uppercase tracking-wider block">{language === 'en' ? 'Total Amount' : 'कुल राशि'}</span>
                      <p className="text-xs font-extrabold text-white">
                        ₹{c.total.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] text-light-blush/40 font-bold uppercase tracking-wider block">
                        {hasPrev ? (language === 'en' ? `Compared to ${c.prevMonth}` : `${c.prevMonth} की तुलना में`) : (language === 'en' ? 'Comparison' : 'तुलना')}
                      </span>
                      {hasPrev ? (
                        <div>
                          {isGrowth && (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-400">
                              {language === 'en' ? `₹${c.diff.toLocaleString('en-IN')} more than last month` : `पिछले महीने से ₹${c.diff.toLocaleString('en-IN')} अधिक`}
                            </span>
                          )}
                          {isReduction && (
                            <span className="inline-flex items-center text-[10px] font-bold text-orange-400">
                              {language === 'en' ? `₹${Math.abs(c.diff).toLocaleString('en-IN')} less than last month` : `पिछले महीने से ₹${Math.abs(c.diff).toLocaleString('en-IN')} कम`}
                            </span>
                          )}
                          {c.diff === 0 && (
                            <span className="inline-flex items-center text-[10px] font-bold text-light-blush/60">
                              {language === 'en' ? 'Same as last month' : 'पिछले महीने जैसा ही'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium text-light-blush/40 italic">
                          {language === 'en' ? 'First recorded month' : 'पहला दर्ज महीना'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fund Distribution Percentages */}
      <div className="bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-5 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{language === 'en' ? 'Fund Distribution' : 'फंड वितरण'}</h4>

        <div className="space-y-2">
          <div className="w-full h-2.5 bg-dark-navy rounded-full overflow-hidden flex">
            <div
              style={{ width: `${offlinePercent}%` }}
              className="h-full bg-peach-orange"
            />
            <div
              style={{ width: `${onlinePercent}%` }}
              className="h-full bg-light-blush"
            />
          </div>

          <div className="flex justify-between text-[10px] font-bold">
            <div className="flex items-center gap-1.5 text-peach-orange">
              <span className="w-2 h-2 bg-peach-orange rounded-full" />
              <span>{language === 'en' ? `Offline: ${offlinePercent}%` : `ऑफ़लाइन: ${offlinePercent}%`}</span>
            </div>
            <div className="flex items-center gap-1.5 text-light-blush">
              <span className="w-2 h-2 bg-light-blush rounded-full" />
              <span>{language === 'en' ? `Online: ${onlinePercent}%` : `ऑनलाइन: ${onlinePercent}%`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
