import { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, WifiOff, Globe, Plus, Check, X, Pencil, Trash2, Mic } from 'lucide-react';
import { translations } from '../utils/translations';

export default function BlockDetail({ blocks, onAddTransaction, onUpdateTransaction, onDeleteTransaction, language = 'en' }) {
  const { id } = useParams();
  const block = blocks.find(b => b.id === id);

  // Set the default sub-block tab based on block type configuration
  const defaultTab = block?.mode === 'online' ? 'online' : 'offline';

  // Tab State
  const [activeTab, setActiveTab] = useState(defaultTab); // 'offline' or 'online'

  // Adding Row State
  const [addingRow, setAddingRow] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Editing Row State
  const [editingTxId, setEditingTxId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');

  // Voice Recognition States
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'error' | 'success'
  const [voiceError, setVoiceError] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const recognitionRef = useRef(null);

  // Microphone Permission States
  const [micPermission, setMicPermission] = useState(() => {
    return localStorage.getItem('hk_mic_permission') || 'prompt'; // 'granted' | 'denied' | 'prompt'
  });
  const [showMicPrompt, setShowMicPrompt] = useState(false);

  // Lock document/body scrolling while BlockDetail is active to keep only the entries scrollable
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Monitor microphone permission state natively on mount
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then((permissionStatus) => {
          setMicPermission(permissionStatus.state);
          localStorage.setItem('hk_mic_permission', permissionStatus.state);
          permissionStatus.onchange = () => {
            setMicPermission(permissionStatus.state);
            localStorage.setItem('hk_mic_permission', permissionStatus.state);
          };
        })
        .catch(() => {
          // Perms API query not supported on this browser (e.g. Safari iOS)
        });
    }
  }, []);

  // Early return redirect if block doesn't exist
  if (!block) {
    return <Navigate to="/" replace />;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth();
  const blockTransactions = block.transactions || [];

  // Filter transactions for activeTab and current calendar month
  const filteredTxs = blockTransactions.filter(tx => {
    if (tx.mode !== activeTab) return false;
    const txDate = new Date(tx.date);
    return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum;
  });

  // Group transactions by date
  const groupedTxs = filteredTxs.reduce((groups, tx) => {
    const key = tx.date;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(tx);
    return groups;
  }, {});

  // Sort dates in ascending order (oldest date first)
  const sortedDates = Object.keys(groupedTxs).sort((a, b) => new Date(a) - new Date(b));

  // Helper to save edited transaction
  const handleEditTxSubmit = (e, txId) => {
    e.preventDefault();
    if (!editAmount || Number(editAmount) <= 0 || !editDescription.trim() || !editDate) return;

    const originalTx = blockTransactions.find(t => t.id === txId);
    onUpdateTransaction(block.id, txId, {
      amount: Number(editAmount),
      description: editDescription.trim(),
      date: editDate,
      mode: originalTx?.mode || activeTab
    });
    setEditingTxId(null);
  };

  // Helper to calculate total offline/online balance
  const calculateTotal = (modeName) => {
    let total = 0;
    const currentMonthTxs = blockTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum;
    });

    currentMonthTxs.forEach(tx => {
      if (tx.mode === modeName) {
        total += Number(tx.amount || 0);
      }
    });

    const base = Number(block.balance || 0);
    if (block.mode === 'both') {
      return modeName === 'offline' ? base + total : total;
    }
    return base + total;
  };

  // Helper to calculate grand total of the block across active sub-ledgers
  const getBlockGrandTotal = () => {
    if (block.mode === 'both') {
      return calculateTotal('offline') + calculateTotal('online');
    } else if (block.mode === 'offline') {
      return calculateTotal('offline');
    } else {
      return calculateTotal('online');
    }
  };

  // Phonetic Devanagari (Hindi) to Latin (Roman/English) Transliteration
  const transliterateDevanagari = (str) => {
    const charMap = {
      // Vowels & vowel signs
      'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
      'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ॉ': 'o', 'ौ': 'au',
      'ं': 'n', 'ः': 'h', 'ँ': 'n', '्': '',
      // Consonants
      'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
      'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
      'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
      'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
      'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
      'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
      'ऑ': 'o', 'ज्ञ': 'gy', 'त्र': 'tr', 'क्ष': 'ksh'
    };

    let result = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      result += charMap[char] !== undefined ? charMap[char] : char;
    }
    return result;
  };

  // Helper to map Devanagari numerals to standard digits
  const mapDevanagariDigits = (str) => {
    const devanagariDigits = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
    return str.replace(/[०-९]/g, m => devanagariDigits[m]);
  };

  // Smart Date Parser from Speech (Handles relative kal, parso, aaj, specific dates e.g. "5 tarikh", "20 date", "5 august")
  const parseDateFromSpeech = (text) => {
    const normalized = text.toLowerCase();
    const now = new Date();

    // Relative Yesterday (kal/yesterday)
    if (normalized.includes('yesterday') || normalized.includes('kal') || normalized.includes('कल')) {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return {
        date: yesterday.toISOString().split('T')[0],
        matchedStr: normalized.includes('yesterday') ? 'yesterday' : (normalized.includes('kal') ? 'kal' : 'कल')
      };
    }

    // Relative Day Before Yesterday (parso)
    if (normalized.includes('parso') || normalized.includes('परसों') || normalized.includes('day before yesterday')) {
      const parso = new Date();
      parso.setDate(now.getDate() - 2);
      let matchedStr = 'parso';
      if (normalized.includes('परसों')) matchedStr = 'परसों';
      if (normalized.includes('day before yesterday')) matchedStr = 'day before yesterday';
      return {
        date: parso.toISOString().split('T')[0],
        matchedStr
      };
    }

    // Relative Today (aaj/today)
    if (normalized.includes('today') || normalized.includes('aaj') || normalized.includes('आज')) {
      let matchedStr = 'today';
      if (normalized.includes('aaj')) matchedStr = 'aaj';
      if (normalized.includes('आज')) matchedStr = 'आज';
      return {
        date: now.toISOString().split('T')[0],
        matchedStr
      };
    }

    // Specific day of current month: e.g. "5 date", "20 tarikh", "25 तारीख"
    const tarikhRegex = /\b(\d{1,2})\s*(date|tarikh|tarik|tariq|tarihk|tarrkh|तारीख)\b/;
    const match = normalized.match(tarikhRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      if (day >= 1 && day <= 31) {
        const targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        const offset = targetDate.getTimezoneOffset();
        const localDate = new Date(targetDate.getTime() - (offset * 60 * 1000));
        return {
          date: localDate.toISOString().split('T')[0],
          matchedStr: match[0]
        };
      }
    }

    // Month Name and Date match: e.g. "5 august", "august 5", "5 मार्च"
    const months = [
      { names: ['january', 'jan', 'जनवरी'], index: 0 },
      { names: ['february', 'feb', 'फरवरी', 'फ़रवरी'], index: 1 },
      { names: ['march', 'mar', 'मार्च'], index: 2 },
      { names: ['april', 'apr', 'अप्रैल'], index: 3 },
      { names: ['may', 'मई'], index: 4 },
      { names: ['june', 'jun', 'जून'], index: 5 },
      { names: ['july', 'jul', 'जुलाई'], index: 6 },
      { names: ['august', 'aug', 'अगस्त'], index: 7 },
      { names: ['september', 'sep', 'सितंबर', 'सितम्बर'], index: 8 },
      { names: ['october', 'oct', 'अक्टूबर', 'अक्टोबर'], index: 9 },
      { names: ['november', 'nov', 'नवंबर', 'नवम्बर'], index: 10 },
      { names: ['december', 'dec', 'दिसंबर', 'दिसम्बर'], index: 11 }
    ];

    for (const m of months) {
      for (const name of m.names) {
        if (normalized.includes(name)) {
          const regex1 = new RegExp('\\b(\\d{1,2})\\s+' + name + '\\b');
          const regex2 = new RegExp('\\b' + name + '\\s+(\\d{1,2})\\b');
          const m1 = normalized.match(regex1);
          const m2 = normalized.match(regex2);
          const matched = m1 || m2;

          if (matched) {
            const day = parseInt(matched[1], 10);
            if (day >= 1 && day <= 31) {
              const targetDate = new Date(now.getFullYear(), m.index, day);
              const offset = targetDate.getTimezoneOffset();
              const localDate = new Date(targetDate.getTime() - (offset * 60 * 1000));
              return {
                date: localDate.toISOString().split('T')[0],
                matchedStr: matched[0]
              };
            }
          }
        }
      }
    }

    // Default to today
    return {
      date: now.toISOString().split('T')[0],
      matchedStr: ""
    };
  };

  // Smart Speech Recognition Parser (Supports English, Hindi, Hinglish - Order Independent)
  const parseSpeech = (text) => {
    // Split by conjunctions to support multiple entries in one go
    const splitRegex = /\b(and|or|aur|phir|fir|फिर)\b/gi;
    const phrases = text.split(splitRegex).filter(p => {
      const trimmed = p.trim().toLowerCase();
      return trimmed && trimmed !== 'and' && trimmed !== 'or' && trimmed !== 'aur' && trimmed !== 'phir' && trimmed !== 'fir' && trimmed !== 'फिर';
    });

    const parsedEntries = [];

    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i].trim();
      if (!phrase) continue;

      const romanizedText = transliterateDevanagari(phrase);
      const normalizedText = mapDevanagariDigits(romanizedText);
      const cleanText = normalizedText.toLowerCase().trim();

      // Parse and strip Date if mentioned
      const dateResult = parseDateFromSpeech(cleanText);
      const date = dateResult.date;
      let remainingText = cleanText;
      if (dateResult.matchedStr) {
        remainingText = remainingText.replace(dateResult.matchedStr, ' ');
      }

      // Parse Mode (if spoken, otherwise fallback to activeTab)
      let mode = activeTab; // default
      let modeMatchedStr = "";
      const onlineKeywords = ['online', 'gpay', 'phonepe', 'upi', 'card', 'bank', 'g-pay', 'pay', 'paytm', 'on-line', 'onlain'];
      const offlineKeywords = ['offline', 'cash', 'wallet', 'rokda', 'hath', 'hand', 'cash-me', 'kaish', 'nackad', 'nakad'];

      for (const kw of onlineKeywords) {
        const regex = new RegExp('\\b' + kw + '\\b', 'g');
        if (regex.test(remainingText)) {
          mode = 'online';
          modeMatchedStr = kw;
          remainingText = remainingText.replace(regex, ' ');
          break;
        }
      }

      if (!modeMatchedStr) {
        for (const kw of offlineKeywords) {
          const regex = new RegExp('\\b' + kw + '\\b', 'g');
          if (regex.test(remainingText)) {
            mode = 'offline';
            modeMatchedStr = kw;
            remainingText = remainingText.replace(regex, ' ');
            break;
          }
        }
      }

      if (block.mode !== 'both') {
        mode = block.mode;
      }

      // Parse Amount
      let amount = 0;
      let amountMatchedStr = "";

      const currencySuffixes = ['rupees', 'rupee', 'rs', 'rupaye', 'rupay', 'rupaya', 'rupiya', 'rupiye', 'roopay', 'roopaye'];
      currencySuffixes.forEach(suffix => {
        remainingText = remainingText.replace(new RegExp('\\b' + suffix + '\\b', 'g'), ' ');
      });

      const rawNumMatch = remainingText.match(/\b\d+\b/);
      if (rawNumMatch) {
        amount = parseInt(rawNumMatch[0], 10);
        amountMatchedStr = rawNumMatch[0];
        remainingText = remainingText.replace(amountMatchedStr, ' ');
      } else {
        const words = remainingText.split(/\s+/);
        let tempSum = 0;
        let numericWordsFound = [];

        for (let j = 0; j < words.length; j++) {
          const word = words[j];
          if (numberWords[word] !== undefined) {
            const val = numberWords[word];
            if (val === 100 || val === 1000 || val === 100000) {
              if (tempSum === 0) tempSum = 1;
              tempSum *= val;
            } else {
              tempSum += val;
            }
            numericWordsFound.push(word);
          } else if (tempSum > 0) {
            break;
          }
        }

        if (tempSum > 0) {
          amount = tempSum;
          numericWordsFound.forEach(nw => {
            remainingText = remainingText.replace(new RegExp('\\b' + nw + '\\b', 'g'), ' ');
          });
        }
      }

      if (amount <= 0) {
        continue;
      }

      // Extract Description
      const stopWords = [
        // English fillers/verbs
        'for', 'spend', 'spent', 'add', 'added', 'on', 'give', 'gave', 'given', 'take', 'took', 'taken',
        'to', 'from', 'in', 'of', 'block', 'i', 'we', 'put', 'send', 'sent', 'pay', 'paid', 'transfer', 'transferred',
        // Hindi/Hinglish fillers/verbs
        'me', 'mein', 'se', 'ko', 'karo', 'kar', 'do', 'diya', 'liya', 'ke', 'liye', 'jod', 'jodo', 'jodna',
        'kiye', 'kiya', 'ki', 'diye', 'mene', 'maine', 'humne', 'dalo', 'daalo', 'daal', 'dal', 'de', 'dena',
        'le', 'lena', 'jama', 'karna', 'bheja', 'bhejo', 'online', 'offline', 'cash'
      ];

      let desc = remainingText;
      stopWords.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'g');
        desc = desc.replace(regex, ' ');
      });

      desc = desc.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
      desc = desc.replace(/\s+/g, ' ').trim();

      if (!desc) {
        desc = mode === 'online' ? 'Online Entry' : 'Cash Entry';
      }

      parsedEntries.push({ amount, description: desc, date, mode });
    }

    if (parsedEntries.length === 0) {
      return null;
    }

    return { entries: parsedEntries };
  };

  // Helper to format response based on user language input
  const formatVoiceFeedback = (speechToText, entries) => {
    const hinglishIndicators = [
      'ko', 'diya', 'diye', 'dalo', 'daalo', 'dal', 'de', 'dena', 'le', 'lena', 'se', 'mein', 'me',
      'karo', 'kar', 'liye', 'ke', 'mene', 'maine', 'humne', 'rupya', 'rupay', 'rupaye', 'rupiya',
      'rupiye', 'roopay', 'roopaye', 'rupai', 'rupya', 'jod', 'jodo', 'jodna', 'bheja', 'bhejo', 'daal'
    ];

    const hasDevanagari = /[\u0900-\u097F]/.test(speechToText);
    const hasHinglish = speechToText.toLowerCase().split(/\s+/).some(w => {
      const cleanW = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
      return hinglishIndicators.includes(cleanW);
    });

    const isHindiOrHinglish = hasDevanagari || hasHinglish;

    if (isHindiOrHinglish) {
      if (entries.length === 1) {
        const entry = entries[0];
        const descText = entry.description ? ` ("${entry.description}" ke liye)` : '';
        return `👍 "${block.name}" block mein ₹${entry.amount}${descText} successfully add kar diye hain.`;
      } else {
        const summary = entries.map(e => {
          const descText = e.description ? ` ("${e.description}" ke liye)` : '';
          return `• ₹${e.amount}${descText} (${e.mode})`;
        }).join('\n');
        return `👍 "${block.name}" block mein successfully ${entries.length} entries add kar di hain:\n${summary}`;
      }
    } else {
      if (entries.length === 1) {
        const entry = entries[0];
        const descText = entry.description ? ` for "${entry.description}"` : '';
        return `👍 Successfully added ₹${entry.amount}${descText} in block "${block.name}" (${entry.mode}).`;
      } else {
        const summary = entries.map(e => {
          const descText = e.description ? ` for "${e.description}"` : '';
          return `• ₹${e.amount}${descText} (${e.mode})`;
        }).join('\n');
        return `👍 Successfully added ${entries.length} entries in block "${block.name}":\n${summary}`;
      }
    }
  };

  // Start Voice Recognition (Natively triggers browser permission prompt on start)
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('error');
      setVoiceError("❌ Voice recognition is not supported in this browser.");
      return;
    }

    setEditingTxId(null);
    setAddingRow(false);
    setVoiceStatus('listening');
    setVoiceError('');
    setVoiceFeedback('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Optimised for Hinglish & Indian English pronunciations
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const speechToText = event.results[0][0].transcript;
      const parsed = parseSpeech(speechToText);

      if (parsed && parsed.entries) {
        try {
          for (const entry of parsed.entries) {
            await onAddTransaction(block.id, {
              amount: entry.amount,
              description: entry.description,
              date: entry.date,
              mode: entry.mode
            });
          }
          setVoiceStatus('success');
          setVoiceFeedback(formatVoiceFeedback(speechToText, parsed.entries));
          const lastEntry = parsed.entries[parsed.entries.length - 1];
          if (block.mode === 'both') {
            setActiveTab(lastEntry.mode);
          }
        } catch (err) {
          setVoiceStatus('error');
          setVoiceError("❌ Unable to save voice entries. Please try again.");
        }
      } else {
        setVoiceStatus('error');
        setVoiceError(`❌ Recognized: "${speechToText}". Try saying: "Fifty rupees for tea" or "पचास रुपये दूध के लिए"`);
      }
    };

    recognition.onerror = (event) => {
      setVoiceStatus('error');
      if (event && (event.error === 'not-allowed' || event.error === 'service-not-allowed')) {
        setVoiceError("❌ Permission denied. Please enable mic access in your browser settings.");
        setMicPermission('denied');
        localStorage.setItem('hk_mic_permission', 'denied');
      } else {
        setVoiceError("❌ Could not capture speech. Please check microphone access.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Stop Voice Recognition
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceStatus('idle');
    }
  };

  // Handle click on microphone button
  const handleMicClick = () => {
    // If the browser doesn't support speech recognition, show error early
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('error');
      setVoiceError("Voice recognition is not supported in this browser.");
      return;
    }

    if (micPermission === 'granted') {
      startSpeechRecognition();
    } else {
      setShowMicPrompt(true);
    }
  };

  return (
    <div className="w-full space-y-6 flex flex-col h-[calc(100vh-175px)]">
      {/* Breadcrumb Header */}
      <div className="flex justify-between items-center bg-deep-purple/40 p-4 border border-purple-rose/85 rounded-3xl shrink-0">
        <div className="flex items-center gap-2">
          <Link to="/" className="p-2 bg-dark-navy border border-purple-rose/65 text-light-blush/60 hover:text-white rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-sm font-black text-white capitalize">{block.name}</h2>
            <p className="text-[10px] text-light-blush/60">{language === 'en' ? 'Transactions & sub-ledgers' : 'लेनदेन और सब-लेजर'}</p>
          </div>
        </div>

        {/* Grand Total display on the right side of the block name heading card */}
        <div className="text-right bg-dark-navy/60 px-3.5 py-1.5 rounded-2xl border border-purple-rose/30">
          <span className="text-[8px] font-black text-peach-orange uppercase tracking-wider block">{language === 'en' ? 'Total Balance' : 'कुल बैलेंस'}</span>
          <span className="text-[15px] font-black text-white leading-none">
            ₹{getBlockGrandTotal().toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Tabs for Offline and Online Sub-blocks */}
      <div className="grid grid-cols-2 gap-2 bg-dark-navy p-1.5 rounded-2xl border border-purple-rose/65 shrink-0">
        <button
          disabled={block.mode === 'online'}
          onClick={() => {
            setEditingTxId(null);
            setActiveTab('offline');
          }}
          className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${block.mode === 'online'
              ? 'opacity-30 cursor-not-allowed text-light-blush/30'
              : activeTab === 'offline'
                ? 'bg-rose-pink/15 text-rose-pink border border-rose-pink/20 shadow-md cursor-pointer'
                : 'text-light-blush/40 hover:text-light-blush/80 cursor-pointer'
            }`}
        >
          {language === 'en' ? 'Offline Ledger' : 'ऑफ़लाइन बही'} (₹{calculateTotal('offline').toLocaleString('en-IN')})
        </button>
        <button
          disabled={block.mode === 'offline'}
          onClick={() => {
            setEditingTxId(null);
            setActiveTab('online');
          }}
          className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${block.mode === 'offline'
              ? 'opacity-30 cursor-not-allowed text-light-blush/30'
              : activeTab === 'online'
                ? 'bg-rose-pink/15 text-rose-pink border border-rose-pink/20 shadow-md cursor-pointer'
                : 'text-light-blush/40 hover:text-light-blush/80 cursor-pointer'
            }`}
        >
          {language === 'en' ? 'Online Ledger' : 'ऑनलाइन बही'} (₹{calculateTotal('online').toLocaleString('en-IN')})
        </button>
      </div>

      {/* 
        Active Tab Ledger Card:
        Takes all remaining space dynamically using flex-grow (flex-1).
        Allows inner items to scroll and keeps add row button always fixed inside the card footer.
      */}
      <div className="bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-3 px-2 shadow-xl flex flex-col flex-1 min-h-0 relative">

        {/* Microphone Soft Consent Prompt Dialog */}
        {showMicPrompt && (
          <div className="absolute inset-0 bg-dark-navy/90 backdrop-blur-md z-50 flex items-center justify-center p-4 rounded-3xl animate-in fade-in duration-200">
            <div className="bg-deep-purple border border-purple-rose/85 rounded-3xl p-5 w-full max-w-xs flex flex-col items-center space-y-4 shadow-2xl text-center">
              <div className="w-10 h-10 bg-rose-pink/15 text-rose-pink rounded-full flex items-center justify-center border border-rose-pink/30 animate-pulse">
                <Mic className="w-5 h-5" />
              </div>

              <h3 className="text-xs font-black text-white uppercase tracking-wider">{language === 'en' ? 'Enable Voice Entry' : 'ध्वनि प्रविष्टि सक्षम करें'}</h3>
              <p className="text-[10px] text-light-blush/80 leading-relaxed font-bold">
                {language === 'en' ? 'Please grant microphone access so you can speak to record entries.' : 'कृपया माइक्रोफ़ोन एक्सेस प्रदान करें ताकि आप बोलकर प्रविष्टियां रिकॉर्ड कर सकें।'}
              </p>

              <div className="flex gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => setShowMicPrompt(false)}
                  className="flex-1 py-2 bg-dark-navy border border-purple-rose/65 rounded-xl text-light-blush/60 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Not Now' : 'अभी नहीं'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                      navigator.mediaDevices.getUserMedia({ audio: true })
                        .then((stream) => {
                          stream.getTracks().forEach(track => track.stop());
                          localStorage.setItem('hk_mic_permission', 'granted');
                          setMicPermission('granted');
                          setShowMicPrompt(false);
                          startSpeechRecognition();
                        })
                        .catch((err) => {
                          console.error('Mic permission denied:', err);
                          localStorage.setItem('hk_mic_permission', 'denied');
                          setMicPermission('denied');
                          setShowMicPrompt(false);
                          setVoiceStatus('error');
                          setVoiceError(language === 'en' ? "Microphone access was denied or is blocked by browser settings." : "माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया था या ब्राउज़र सेटिंग्स द्वारा अवरुद्ध है।");
                        });
                    } else {
                      localStorage.setItem('hk_mic_permission', 'granted');
                      setMicPermission('granted');
                      setShowMicPrompt(false);
                      startSpeechRecognition();
                    }
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[9px] uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer"
                >
                  {language === 'en' ? 'Allow Mic' : 'माइक की अनुमति दें'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable list container - fills remaining space of the card */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 min-h-0">
          {/* Voice Helper Feedback Overlay */}
          {voiceStatus === 'listening' && (
            <div className="bg-rose-pink/15 border border-rose-pink/30 rounded-2xl p-3 flex flex-col space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-pink animate-ping" />
                  <span className="text-[12px] font-black text-white">{language === 'en' ? 'Listening... Speak now' : 'सुन रहे हैं... अब बोलें'}</span>
                </div>
                <button
                  type="button"
                  onClick={stopSpeechRecognition}
                  className="text-rose-pink text-[10px] uppercase font-black hover:text-white px-2 py-0.5 bg-dark-navy/80 rounded-lg border border-rose-pink/30 transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
              </div>
            </div>
          )}

          {voiceStatus === 'error' && (
            <div className="bg-rose-pink/10 border border-rose-pink/20 rounded-2xl p-3 flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-rose-pink uppercase tracking-wider">{language === 'en' ? 'Voice Assist Error' : 'ध्वनि सहायता त्रुटि'}</span>
                <button onClick={() => setVoiceStatus('idle')} className="text-light-blush/40 hover:text-white p-0.5 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-light-blush/80 leading-snug">{voiceError}</p>
            </div>
          )}

          {voiceStatus === 'success' && (
            <div className="bg-rose-pink/15 border border-rose-pink/25 rounded-2xl p-3 flex flex-col space-y-1 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-rose-pink uppercase tracking-wider">{language === 'en' ? 'Voice Entry Added' : 'ध्वनि प्रविष्टि जोड़ी गई'}</span>
                <button onClick={() => setVoiceStatus('idle')} className="text-light-blush/40 hover:text-white p-0.5 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-light-blush/90 whitespace-pre-line leading-relaxed font-bold">{voiceFeedback}</p>
            </div>
          )}

          {sortedDates.length === 0 && !addingRow && voiceStatus === 'idle' && (
            <div className="text-center py-12 text-[11px] text-light-blush/30 uppercase font-black tracking-widest">
              {language === 'en' ? 'No Transactions' : 'कोई लेनदेन नहीं'}
            </div>
          )}

          {/* Date-wise grouped transaction cards */}
          {sortedDates.map(dateString => {
            const dateObj = new Date(dateString);
            const formattedDate = isNaN(dateObj)
              ? dateString
              : dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

            // Sort transactions within this date by creation time ascending
            const dayTxs = [...groupedTxs[dateString]].sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeA - timeB;
            });

            return (
              <div key={dateString} className="bg-dark-navy/40 border border-purple-rose/40 rounded-2xl p-2 space-y-1.5 animate-in fade-in duration-200">
                {/* Date Title Header */}
                <div className="text-[11px] font-black text-peach-orange/95 uppercase tracking-wider border-b border-purple-rose/25 pb-1">
                  {formattedDate}
                </div>

                {/* List of transactions for this date - showing Amount, Description, and Edit/Delete on the right */}
                <div className="divide-y divide-purple-rose/10 space-y-1">
                  {dayTxs.map(tx => {
                    const isEditing = editingTxId === tx.id;

                    if (isEditing) {
                      return (
                        <form
                          key={tx.id}
                          onSubmit={(e) => handleEditTxSubmit(e, tx.id)}
                          className="grid grid-cols-12 gap-1 py-1.5 items-center bg-purple-rose/10 rounded-xl px-1"
                        >
                          {/* Amount Input */}
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="col-span-3 bg-dark-navy border border-purple-rose/65 rounded-lg p-1 text-white text-[13px] font-bold focus:outline-none focus:border-rose-pink min-w-0"
                            placeholder={translations[language]?.amountPlaceholder || "Amount"}
                            required
                          />

                          {/* Description Input */}
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="col-span-5 bg-dark-navy border border-purple-rose/65 rounded-lg px-2 py-1 text-white text-[13px] font-bold focus:outline-none focus:border-rose-pink min-w-0"
                            placeholder={translations[language]?.descriptionPlaceholder || "Description"}
                            required
                          />

                          {/* Date Input */}
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="col-span-3 bg-dark-navy border border-purple-rose/65 rounded-lg p-1 text-white text-[13px] font-bold focus:outline-none focus:border-rose-pink min-w-0 text-right"
                            required
                          />

                          {/* Action Buttons */}
                          <div className="col-span-1 flex gap-0.5 justify-end">
                            <button
                              type="submit"
                              className="text-rose-pink hover:text-white p-0.5 cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTxId(null)}
                              className="text-light-blush/40 hover:text-white p-0.5 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={tx.id}
                        className="grid grid-cols-12 gap-1.5 py-1.5 items-center hover:bg-purple-rose/5 rounded px-1 transition-colors"
                      >
                        {/* Amount */}
                        <span className="col-span-4 text-[14px] text-white font-black text-left">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </span>

                        {/* Description */}
                        <span className="col-span-6 text-[14px] text-white font-semibold truncate capitalize text-left" title={tx.description}>
                          {tx.description}
                        </span>

                        {/* Edit & Delete Action Icons on the right side */}
                        <div className="col-span-2 flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => {
                              setEditingTxId(tx.id);
                              setEditAmount(tx.amount.toString());
                              setEditDescription(tx.description);
                              setEditDate(tx.date);
                            }}
                            className="text-light-blush/40 hover:text-rose-pink transition-colors cursor-pointer"
                            title={language === 'en' ? 'Edit Entry' : 'प्रविष्टि संपादित करें'}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(language === 'en' ? 'Are you sure you want to delete this entry?' : 'क्या आप वाकई इस प्रविष्टि को हटाना चाहते हैं?')) {
                                onDeleteTransaction(block.id, tx.id);
                              }
                            }}
                            className="text-light-blush/40 hover:text-rose-pink transition-colors cursor-pointer"
                            title={language === 'en' ? 'Delete Entry' : 'प्रविष्टि हटाएं'}
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
          })}

          {/* Form to add row inline - styled with save/cancel actions below date section */}
          {addingRow && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newAmount || Number(newAmount) <= 0 || !newDescription.trim()) return;
                onAddTransaction(block.id, {
                  amount: Number(newAmount),
                  description: newDescription.trim(),
                  date: newDate,
                  mode: activeTab
                });
                setAddingRow(false);
              }}
              className="bg-peach-orange/5 border border-peach-orange/20 rounded-2xl p-3.5 space-y-3.5 animate-in slide-in-from-bottom-2 duration-200"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-light-blush/65 text-[9px] font-black uppercase mb-1">{language === 'en' ? 'Amount (₹)' : 'राशि (₹)'}</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-2.5 py-2 text-white text-[13px] font-bold focus:outline-none focus:border-rose-pink"
                    required
                  />
                </div>
                <div>
                  <label className="block text-light-blush/65 text-[9px] font-black uppercase mb-1">{language === 'en' ? 'Description' : 'विवरण'}</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder={language === 'en' ? 'Milk, bill, etc.' : 'दूध, बिल, आदि'}
                    className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-2.5 py-2 text-white text-[13px] font-bold focus:outline-none focus:border-rose-pink"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-light-blush/65 text-[9px] font-black uppercase mb-1">{language === 'en' ? 'Date' : 'तारीख'}</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-2.5 py-2 text-white text-[13px] font-bold focus:outline-none focus:border-rose-pink"
                  required
                />
              </div>

              {/* Save and cancel/delete buttons below date section in a properly visible way */}
              <div className="flex gap-2.5 justify-end pt-1 border-t border-purple-rose/15">
                <button
                  type="button"
                  onClick={() => setAddingRow(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-dark-navy border border-purple-rose/65 text-rose-pink font-black text-[11px] uppercase tracking-wider transition-all duration-300 hover:bg-rose-pink/5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[11px] uppercase tracking-wider transition-all duration-300 shadow hover:opacity-90 active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> {language === 'en' ? 'Save Entry' : 'प्रविष्टि सहेजें'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Card Footer: Inline + Add Row Button & Voice Mic button - docked just above footer */}
        {!addingRow && (
          <div className="pt-2 border-t border-purple-rose/25 flex gap-2 justify-center mt-auto shrink-0">
            {/* Empty manual Add Row */}
            <button
              onClick={() => {
                setAddingRow(true);
                setNewAmount('');
                setNewDescription('');
                setNewDate(new Date().toISOString().split('T')[0]);
                setVoiceStatus('idle');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[11px] uppercase tracking-wider transition-all duration-300 shadow hover:opacity-90 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> {language === 'en' ? 'Add Row' : 'प्रविष्टि जोड़ें'}
            </button>

            {/* Voice assistant microphone button */}
            <button
              onClick={voiceStatus === 'listening' ? stopSpeechRecognition : handleMicClick}
              className={`w-12 rounded-xl border flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer ${voiceStatus === 'listening'
                  ? 'bg-rose-pink border-rose-pink text-white animate-pulse'
                  : 'bg-dark-navy border-purple-rose/65 text-rose-pink hover:text-white hover:bg-rose-pink/15'
                }`}
              title={language === 'en' ? 'Voice Entry' : 'ध्वनि प्रविष्टि'}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
