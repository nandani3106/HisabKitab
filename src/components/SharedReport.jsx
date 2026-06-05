import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Share2, Printer, Layers, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { translations } from '../utils/translations';

export default function SharedReport() {
  const [searchParams] = useSearchParams();
  const rawData = searchParams.get('data');
  const [language, setLanguage] = useState('en');

  // Decode base64 helper
  let reportData = null;
  let errorMsg = '';
  try {
    if (rawData) {
      const decodedStr = decodeURIComponent(escape(atob(rawData)));
      reportData = JSON.parse(decodedStr);
    } else {
      errorMsg = language === 'en' ? 'No report data found in the link.' : 'लिंक में कोई रिपोर्ट डेटा नहीं मिला।';
    }
  } catch (err) {
    console.error('Error decoding report data:', err);
    errorMsg = language === 'en' ? 'Invalid or corrupted report link.' : 'अमान्य या दूषित रिपोर्ट लिंक।';
  }

  // Active sub-ledger tab in case block was in 'both' mode
  const defaultTab = reportData?.mode === 'online' ? 'online' : 'offline';
  const [activeTab, setActiveTab] = useState(defaultTab);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-dark-navy text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-deep-purple/60 border border-purple-rose/85 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-pink/15 text-rose-pink rounded-full flex items-center justify-center border border-rose-pink/30 mx-auto">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-md font-black uppercase tracking-wider text-rose-pink">
            {language === 'en' ? 'Report Load Error' : 'रिपोर्ट लोड त्रुटि'}
          </h2>
          <p className="text-xs text-light-blush/80 leading-relaxed font-bold">
            {errorMsg}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-4 py-2 bg-dark-navy border border-purple-rose/65 rounded-xl text-light-blush/80 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              {language === 'en' ? 'हिन्दी में देखें' : 'View in English'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { blockName, monthNum, year, baseBalance, mode, transactions = [] } = reportData;

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesHi = [
    'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
  ];
  const monthName = language === 'hi' ? monthNamesHi[monthNum] : monthNamesEn[monthNum];

  // Calculate totals
  const calculateTotal = (modeName) => {
    let total = 0;
    transactions.forEach(tx => {
      if (tx.mode === modeName) {
        total += Number(tx.amount || 0);
      }
    });
    const base = Number(baseBalance || 0);
    if (mode === 'both') {
      return modeName === 'offline' ? base + total : total;
    }
    return base + total;
  };

  const offlineTotal = calculateTotal('offline');
  const onlineTotal = calculateTotal('online');
  const grandTotal = mode === 'both' ? offlineTotal + onlineTotal : mode === 'offline' ? offlineTotal : onlineTotal;

  // Filter transactions for active tab
  const tabTxs = transactions.filter(tx => {
    if (mode !== 'both') return true;
    return tx.mode === activeTab;
  });

  // Group transactions by date
  const groupedTxs = tabTxs.reduce((groups, tx) => {
    const key = tx.date;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(tx);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedTxs).sort((a, b) => new Date(a) - new Date(b));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-dark-navy text-white font-sans pb-10 print:bg-white print:text-black">
      {/* Header Bar */}
      <header className="bg-deep-purple/40 border-b border-purple-rose/85 px-4 py-3 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-rose-pink to-peach-orange text-dark-navy rounded-xl flex items-center justify-center font-black text-xs shadow-lg">
            HK
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-white">HisabKitab</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-3 py-1.5 bg-dark-navy border border-purple-rose/50 rounded-xl text-light-blush text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            {language === 'en' ? 'हिंदी' : 'EN'}
          </button>
          <button
            onClick={handlePrint}
            className="p-2 bg-dark-navy border border-purple-rose/50 rounded-xl text-light-blush hover:text-white transition-all cursor-pointer"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Report Container */}
      <main className="max-w-md mx-auto px-4 mt-6 space-y-6 print:mt-0 print:px-0">
        
        {/* Title Section */}
        <div className="text-center space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-pink/15 border border-rose-pink/30 text-rose-pink text-[10px] font-extrabold uppercase tracking-widest">
            <Calendar className="w-3 h-3" /> {monthName} {year}
          </span>
          <h1 className="text-xl font-black text-white tracking-tight mt-1 print:text-black">
            {blockName}
          </h1>
          <p className="text-[10px] text-light-blush/60 uppercase tracking-widest font-bold print:text-black/60">
            {language === 'en' ? 'Monthly Expense Statement' : 'मासिक खर्च विवरण'}
          </p>
        </div>

        {/* Totals Summary Card */}
        <div className="bg-gradient-to-br from-deep-purple/95 to-dark-navy/95 border border-purple-rose/85 rounded-3xl p-5 shadow-2xl relative overflow-hidden print:border-black/20 print:shadow-none">
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-pink/10 rounded-full blur-3xl pointer-events-none print:hidden" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-peach-orange/5 rounded-full blur-3xl pointer-events-none print:hidden" />

          <h3 className="text-[10px] font-black text-light-blush/60 uppercase tracking-wider mb-4 pb-1.5 border-b border-purple-rose/30 print:text-black/60 print:border-black/10">
            {language === 'en' ? 'Balance Summary' : 'बैलेंस सारांश'}
          </h3>

          <div className="space-y-3">
            {/* Show Base Balance if configured */}
            {Number(baseBalance) > 0 && (
              <div className="flex justify-between items-center text-xs text-light-blush/80 print:text-black/80">
                <span className="font-semibold">{language === 'en' ? 'Base Balance:' : 'प्रारंभिक बैलेंस:'}</span>
                <span className="font-bold">₹{Number(baseBalance).toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Offline Total */}
            {(mode === 'offline' || mode === 'both') && (
              <div className="flex justify-between items-center text-xs text-light-blush/80 print:text-black/80">
                <span className="font-semibold">{language === 'en' ? 'Offline Expenses:' : 'ऑफ़लाइन खर्च:'}</span>
                <span className="font-bold">₹{offlineTotal.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Online Total */}
            {(mode === 'online' || mode === 'both') && (
              <div className="flex justify-between items-center text-xs text-light-blush/80 print:text-black/80">
                <span className="font-semibold">{language === 'en' ? 'Online Expenses:' : 'ऑनलाइन खर्च:'}</span>
                <span className="font-bold">₹{onlineTotal.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Grand Combined Total */}
            <div className="flex justify-between items-center pt-3 border-t border-purple-rose/30 mt-2 print:border-black/20">
              <span className="text-xs font-black uppercase text-white print:text-black">
                {language === 'en' ? 'Net Balance:' : 'कुल बैलेंस:'}
              </span>
              <span className="text-base font-black text-peach-orange print:text-black">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls for multi-ledger support */}
        {mode === 'both' && (
          <div className="grid grid-cols-2 gap-1.5 bg-deep-purple/45 p-1 rounded-2xl border border-purple-rose/85 print:hidden">
            <button
              onClick={() => setActiveTab('offline')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'offline'
                  ? 'bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black shadow-md'
                  : 'text-light-blush/50 hover:text-white'
              }`}
            >
              {language === 'en' ? 'Offline' : 'ऑफ़लाइन'}
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'online'
                  ? 'bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black shadow-md'
                  : 'text-light-blush/50 hover:text-white'
              }`}
            >
              {language === 'en' ? 'Online' : 'ऑनलाइन'}
            </button>
          </div>
        )}

        {/* Transaction History Log Cards */}
        <div className="bg-deep-purple/40 border border-purple-rose/85 rounded-3xl p-4 shadow-xl flex flex-col space-y-4 print:border-black/20 print:shadow-none">
          <div className="flex justify-between items-center border-b border-purple-rose/30 pb-2 print:border-black/10">
            <span className="text-[10px] font-black text-light-blush/60 uppercase tracking-wider">
              {language === 'en' ? 'Transaction Logs' : 'लेन-देन इतिहास'}
            </span>
            {mode !== 'both' && (
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-pink/15 text-rose-pink border border-rose-pink/20">
                {mode === 'offline' ? (language === 'en' ? 'Offline' : 'ऑफ़लाइन') : (language === 'en' ? 'Online' : 'ऑनलाइन')}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {sortedDates.length === 0 ? (
              <div className="text-center py-8 text-[11px] text-light-blush/30 uppercase font-black tracking-widest">
                {language === 'en' ? 'No Transactions' : 'कोई लेनदेन नहीं'}
              </div>
            ) : (
              sortedDates.map(dateString => {
                const dateObj = new Date(dateString);
                const formattedDate = isNaN(dateObj)
                  ? dateString
                  : dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                return (
                  <div key={dateString} className="space-y-1.5">
                    {/* Date stamp header */}
                    <div className="text-[10px] font-black text-peach-orange/95 uppercase tracking-wider border-b border-purple-rose/15 pb-0.5 print:text-black/60 print:border-black/10">
                      {formattedDate}
                    </div>

                    <div className="divide-y divide-purple-rose/10 space-y-1.5">
                      {groupedTxs[dateString].map((tx, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 text-xs">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-extrabold text-white truncate print:text-black">
                              {tx.description || (tx.mode === 'online' ? (language === 'en' ? 'Online Entry' : 'ऑनलाइन प्रविष्टि') : (language === 'en' ? 'Cash Entry' : 'कैश प्रविष्टि'))}
                            </span>
                            {mode === 'both' && (
                              <span className="text-[8px] font-bold text-light-blush/40 uppercase tracking-widest">
                                {tx.mode === 'online' ? (language === 'en' ? 'Online' : 'ऑनलाइन') : (language === 'en' ? 'Offline' : 'ऑफ़लाइन')}
                              </span>
                            )}
                          </div>
                          <span className="font-black text-white shrink-0 print:text-black">
                            ₹{Number(tx.amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info stamp */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-[9px] text-light-blush/40 font-bold uppercase tracking-widest print:text-black/40">
            {language === 'en' ? 'Generated via HisabKitab App' : 'हिसाबकिताब ऐप द्वारा जनरेट किया गया'}
          </p>
        </div>
      </main>
    </div>
  );
}
