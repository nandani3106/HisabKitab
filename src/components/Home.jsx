import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Trash2, Globe, WifiOff, Smartphone, Pencil, Check, X, Search, Mic } from 'lucide-react';
import { translations } from '../utils/translations';

export default function Home({ blocks, onAddBlock, onUpdateBlock, onDeleteBlock, onAddTransaction, language = 'en' }) {
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

  // Voice Assistant States
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'error' | 'success'
  const [voiceError, setVoiceError] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const recognitionRef = useRef(null);

  // Microphone Permission States
  const [micPermission, setMicPermission] = useState(() => {
    return localStorage.getItem('hk_mic_permission') || 'prompt'; // 'granted' | 'denied' | 'prompt'
  });
  const [showMicPrompt, setShowMicPrompt] = useState(false);

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
          // Permissions API query not supported on this browser (e.g. Safari iOS)
        });
    }
  }, []);

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

  // Filter blocks by search query
  const filteredBlocks = blocks.filter(block => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // 1. Check Block Name
    if (block.name.toLowerCase().includes(query)) return true;

    // 2. Check Block Initial Balance
    if (block.balance && block.balance.toString().includes(query)) return true;

    // 3. Check Nested Transactions
    const txs = block.transactions || [];
    return txs.some(tx => {
      const descMatch = tx.description && tx.description.toLowerCase().includes(query);
      const amtMatch = tx.amount && tx.amount.toString().includes(query);
      const modeMatch = tx.mode && tx.mode.toLowerCase().includes(query);
      const dateMatch = tx.date && tx.date.includes(query);
      return descMatch || amtMatch || modeMatch || dateMatch;
    });
  });

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
    const devanagariDigits = {'०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'};
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

  // Global Speech Recognition Parser (Loose order, supports Hinglish/Hindi natively, handles multiple entries)
  const parseGlobalSpeech = (text) => {
    // 1. Split by conjunctions or punctuation to support multiple entries in one go
    // Replace all separator words and punctuation with a pipe character
    let processedText = text
      .replace(/\b(and|or|aur|phir|fir|फिर|ya|then)\b/gi, '|')
      .replace(/[,.]/g, '|')
      .replace(/\s*\|\s*/g, '|');
    const phrases = processedText.split('|').map(p => p.trim()).filter(Boolean);

    const parsedEntries = [];
    let currentBlock = null;

    const numberWords = {
      // English
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
      'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
      'hundred': 100, 'thousand': 1000, 'lakh': 100000,
      // Hinglish & Phonetic Hindi
      'ek': 1, 'do': 2, 'teen': 3, 'chaar': 4, 'char': 4, 'paanch': 5, 'panch': 5, 'chhe': 6, 'che': 6, 'chhah': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
      'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14, 'pandrah': 15, 'solah': 16, 'satrah': 17, 'atharah': 18, 'unnis': 19,
      'bees': 20, 'bes': 20, 'tees': 30, 'tes': 30, 'chalis': 40, 'challis': 40, 'pachas': 50, 'pchas': 50, 'pchaas': 50, 'saath': 60, 'sath': 60,
      'sattar': 70, 'satar': 70, 'assi': 80, 'asi': 80, 'nabbe': 90, 'nabe': 90, 'sau': 100, 'so': 100, 'hazaar': 1000, 'hazar': 1000, 'hajar': 1000
    };

    // Helper to loose normalize text for phonetic equivalence (v->w, oo->u, ee->i)
    const phoneticNormalize = (x) => {
      return x
        .replace(/oo/g, 'u')
        .replace(/ee/g, 'i')
        .replace(/w/g, 'v')
        .replace(/ea/g, 'i')
        .replace(/[^a-z0-9]/g, '');
    };

    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i].trim();
      if (!phrase) continue;

      const romanizedText = transliterateDevanagari(phrase);
      const normalizedText = mapDevanagariDigits(romanizedText);
      const parsingText = normalizedText.toLowerCase().trim();

      // 2. Parse and strip Date if mentioned
      const dateResult = parseDateFromSpeech(parsingText);
      const date = dateResult.date;
      let remainingText = parsingText;
      if (dateResult.matchedStr) {
        remainingText = remainingText.replace(dateResult.matchedStr, ' ');
      }

      // 3. Loose phonetic match block name (anywhere in string)
      let matchedBlock = null;
      let longestMatchLength = 0;
      let blockMatchStr = "";

      blocks.forEach(b => {
        const bName = b.name.toLowerCase();
        // Direct substring match
        if (remainingText.includes(bName) && bName.length > longestMatchLength) {
          matchedBlock = b;
          longestMatchLength = bName.length;
          blockMatchStr = bName;
        }
      });

      // Phonetic loose fallback (matches Gaurav/Gauraw, Nanu/Nanoo)
      if (!matchedBlock) {
        blocks.forEach(b => {
          const bName = b.name.toLowerCase();
          const normClean = phoneticNormalize(remainingText);
          const normBName = phoneticNormalize(bName);
          
          if (normClean.includes(normBName) && bName.length > longestMatchLength) {
            matchedBlock = b;
            longestMatchLength = bName.length;
            blockMatchStr = bName;
          }
        });
      }

      if (matchedBlock) {
        currentBlock = matchedBlock;
      } else {
        matchedBlock = currentBlock; // propagate context from previous phrase
      }

      if (!matchedBlock) {
        continue;
      }

      // Strip block name out to isolate description/amount
      if (blockMatchStr) {
        remainingText = remainingText.replace(blockMatchStr, ' ');
      }
      // Also remove block name with phonetic variations
      const bNameWords = matchedBlock.name.toLowerCase().split(/\s+/);
      bNameWords.forEach(word => {
        remainingText = remainingText.replace(new RegExp('\\b' + word + '\\b', 'g'), ' ');
      });

      // 4. Parse Mode (anywhere in string)
      let mode = 'offline'; // default
      let modeMatchedStr = "";
      
      const onlineKeywords = ['online', 'gpay', 'phonepe', 'upi', 'card', 'bank', 'g-pay', 'pay', 'paytm', 'on-line', 'onlain'];
      const offlineKeywords = ['offline', 'cash', 'wallet', 'rokda', 'hath', 'hand', 'cash-me', 'kaish', 'nackad', 'nakad'];

      // Check online keywords
      for (const kw of onlineKeywords) {
        const regex = new RegExp('\\b' + kw + '\\b', 'g');
        if (regex.test(remainingText)) {
          mode = 'online';
          modeMatchedStr = kw;
          remainingText = remainingText.replace(regex, ' ');
          break;
        }
      }

      // Check offline keywords
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

      // If block doesn't support both modes, fallback to its configured mode
      if (matchedBlock.mode !== 'both') {
        mode = matchedBlock.mode;
      }

      // 5. Parse Amount (anywhere in string)
      let amount = 0;
      let amountMatchedStr = "";

      // Remove filler currency suffixes (rupees, Rs, rupaye, rupay, etc. with common typos)
      const currencySuffixes = [
        'rupees', 'rupee', 'rs', 'rupaye', 'rupay', 'rupaya', 'rupiya', 'rupiye', 'roopay', 'roopaye',
        'rypay', 'rypaye', 'rypy', 'rupai', 'rupya', 'rupia', 'rupi'
      ];
      currencySuffixes.forEach(suffix => {
        remainingText = remainingText.replace(new RegExp('\\b' + suffix + '\\b', 'g'), ' ');
      });

      // Check for raw digits (e.g. 500)
      const rawNumMatch = remainingText.match(/\b\d+\b/);
      if (rawNumMatch) {
        amount = parseInt(rawNumMatch[0], 10);
        amountMatchedStr = rawNumMatch[0];
        remainingText = remainingText.replace(amountMatchedStr, ' ');
      } else {
        // Find spoken number words (contiguous words parsed from text)
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

      // 6. Extract Description by cleaning up any left-over trigger/filler words
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

      // Clean multiple spaces and trailing punctuations
      desc = desc.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
      desc = desc.replace(/\s+/g, ' ').trim();

      if (!desc) {
        desc = mode === 'online' ? 'Online Entry' : 'Cash Entry';
      }

      parsedEntries.push({
        blockId: matchedBlock.id,
        blockName: matchedBlock.name,
        amount,
        description: desc,
        date,
        mode
      });
    }

    if (parsedEntries.length === 0) {
      return { error: `Could not identify block name or amount in spoken phrase. Available blocks: ${blocks.map(b => b.name).join(', ')}` };
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
        return `👍 "${entry.blockName}" block mein ₹${entry.amount}${descText} successfully add kar diye hain.`;
      } else {
        const summary = entries.map(e => {
          const descText = e.description ? ` ("${e.description}" ke liye)` : '';
          return `• ${e.blockName} mein ₹${e.amount}${descText} (${e.mode})`;
        }).join('\n');
        return `👍 Successfully ${entries.length} entries add kar di hain:\n${summary}`;
      }
    } else {
      if (entries.length === 1) {
        const entry = entries[0];
        const descText = entry.description ? ` for "${entry.description}"` : '';
        return `👍 Successfully added ₹${entry.amount}${descText} in block "${entry.blockName}" (${entry.mode}).`;
      } else {
        const summary = entries.map(e => {
          const descText = e.description ? ` for "${e.description}"` : '';
          return `• ₹${e.amount}${descText} in block "${entry.blockName}" (${e.mode})`;
        }).join('\n');
        return `👍 Successfully added ${entries.length} entries:\n${summary}`;
      }
    }
  };

  // Start Speech Recognition (Natively triggers browser permission prompt on start)
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('error');
      setVoiceError("❌ Voice recognition is not supported in this browser.");
      return;
    }

    setVoiceStatus('listening');
    setVoiceError('');
    setVoiceFeedback('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Optimised for Hinglish & Indian English name pronunciations
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const speechToText = event.results[0][0].transcript;
      const parsed = parseGlobalSpeech(speechToText);

      if (parsed.error) {
        setVoiceStatus('error');
        setVoiceError(`❌ ${parsed.error}`);
      } else {
        try {
          for (const entry of parsed.entries) {
            await onAddTransaction(entry.blockId, {
              amount: entry.amount,
              description: entry.description,
              date: entry.date,
              mode: entry.mode
            });
          }
          setVoiceStatus('success');
          setVoiceFeedback(formatVoiceFeedback(speechToText, parsed.entries));
        } catch (err) {
          setVoiceStatus('error');
          setVoiceError("❌ Unable to communicate with the database. Please try again.");
        }
      }
    };

    recognition.onerror = (event) => {
      setVoiceStatus('error');
      if (event && (event.error === 'not-allowed' || event.error === 'service-not-allowed')) {
        setVoiceError("❌ Microphone access denied. Please enable microphone permission in browser settings.");
        setMicPermission('denied');
        localStorage.setItem('hk_mic_permission', 'denied');
      } else {
        setVoiceError("❌ Microphone input failed. Please check your system settings.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceStatus('idle');
    }
  };

  // Handle Voice Assistant Button click with native permission workflow
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
    <div className="w-full space-y-6">
      {/* Overview Header / Add Actions */}
      <div className="flex justify-between items-center bg-deep-purple/40 p-4 border border-purple-rose/85 rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-pink/15 text-rose-pink rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">{translations[language]?.blocksHeader || "Your Active Ledger Blocks"}</h2>
            <p className="text-[10px] text-light-blush/60">{translations[language]?.blocksSub || "Tap any block to view transaction logs"}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingBlockId(null);
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[10px] uppercase tracking-wider transition-all duration-300 shadow active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> {translations[language]?.addBlockBtn || "Add New Block"}
        </button>
      </div>

      {/* Add Block Form */}
      {showAddForm && (
        <form 
          onSubmit={handleAddSubmit} 
          className="bg-deep-purple/60 backdrop-blur-xl border border-purple-rose/85 rounded-3xl p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-light-blush">{translations[language]?.addBlockBtn || "Add New Block"}</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-light-blush/70 text-[9px] font-bold uppercase tracking-wider mb-1">
                {language === 'en' ? 'Block Name' : 'ब्लॉक का नाम'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={translations[language]?.blockNamePlaceholder || "Block/Ledger Name"}
                className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-pink transition-all font-semibold placeholder:text-light-blush/25"
                required
              />
            </div>

            <div>
              <label className="block text-light-blush/70 text-[9px] font-bold uppercase tracking-wider mb-1">
                {translations[language]?.initialBalanceLabel || "Initial Base Balance (₹)"}
              </label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full bg-dark-navy border border-purple-rose/65 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-pink transition-all font-semibold placeholder:text-light-blush/25"
              />
            </div>

            <div>
              <label className="block text-light-blush/70 text-[9px] font-bold uppercase tracking-wider mb-1">
                {translations[language]?.blockModeLabel || "Sub-Ledger Support Mode"}
              </label>
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
                    {m === 'offline' ? (translations[language]?.modeOffline || "Offline") : m === 'online' ? (translations[language]?.modeOnline || "Online") : (translations[language]?.modeBoth || "Both")}
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
              {translations[language]?.cancel || "Cancel"}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[10px] uppercase tracking-wider transition-all shadow active:scale-95 cursor-pointer"
            >
              {translations[language]?.create || "Create Block"}
            </button>
          </div>
        </form>
      )}


      {/* Grid of Blocks */}
      {blocks.length === 0 ? (
        <div className="text-center py-20 bg-deep-purple/20 border border-dashed border-purple-rose/65 rounded-3xl p-6">
          <Layers className="w-10 h-10 text-light-blush/40 mx-auto mb-3 opacity-55" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">{translations[language]?.noBlocks || "No Blocks Found"}</h4>
          <p className="text-xs text-light-blush/50 mt-1.5">{translations[language]?.noBlocksSub || "Create your first block/ledger below to get started"}</p>
        </div>
      ) : filteredBlocks.length === 0 ? (
        <div className="text-center py-16 bg-deep-purple/20 border border-dashed border-purple-rose/65 rounded-3xl p-6">
          <Search className="w-8 h-8 text-light-blush/30 mx-auto mb-2 opacity-50" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{language === 'en' ? 'No Results Found' : 'कोई परिणाम नहीं मिला'}</h4>
          <p className="text-[10px] text-light-blush/50 mt-1">{language === 'en' ? `No blocks match "${searchQuery}"` : `कोई भी ब्लॉक "${searchQuery}" से मेल नहीं खाता`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pb-20">
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

            // Normal Block card view (entire card is clickable/navigable)
            return (
              <Link
                key={block.id}
                to={`/block/${block.id}`}
                className="wooden-board p-4 flex flex-col justify-between transition-all group duration-300 hover:scale-[1.03] hover:shadow-2xl relative overflow-hidden text-left cursor-pointer"
              >

                <div>
                  <div className="flex justify-between items-start mb-3">
                    {getModeBadge(block.mode)}
                    
                    <div className="flex items-center gap-1 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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
                          e.stopPropagation();
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

                  <h3 className="text-sm font-black text-white hover:text-white truncate">
                    {block.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-black/20 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-[#C0CDE6] font-semibold">
                    <span>{language === 'en' ? 'Online:' : 'ऑनलाइन:'}</span>
                    <span className="font-extrabold text-white">₹{balances.online.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#C0CDE6] font-semibold">
                    <span>{language === 'en' ? 'Offline:' : 'ऑफ़लाइन:'}</span>
                    <span className="font-extrabold text-white">₹{balances.offline.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#FAFDFD] font-black border-t border-black/25 pt-2 mt-2 text-sm">
                    <span className="uppercase tracking-wider">{language === 'en' ? 'Total:' : 'कुल:'}</span>
                    <span className="text-[#ABC4E6] font-extrabold">₹{balances.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Floating Global Voice Assistant Microphone Button */}
      {blocks.length > 0 && voiceStatus === 'idle' && (
        <button
          onClick={handleMicClick}
          className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-95 cursor-pointer border border-purple-rose/40 animate-bounce duration-1000"
          title="Global Voice Assistant"
        >
          <Mic className="w-6 h-6" />
        </button>
      )}

      {/* Microphone Soft Consent Prompt Dialog */}
      {showMicPrompt && (
        <div className="fixed inset-0 bg-dark-navy/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-deep-purple border border-purple-rose/85 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 bg-rose-pink/15 text-rose-pink rounded-full flex items-center justify-center border border-rose-pink/30 animate-pulse">
              <Mic className="w-6 h-6" />
            </div>
            
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{translations[language]?.enableVoice || "Enable Voice Assistant"}</h3>
            <p className="text-[11px] text-light-blush/80 leading-relaxed font-bold">
              {translations[language]?.enableVoiceSub || "HisabKitab needs microphone permission to let you record transactions naturally by speaking."}
            </p>

            <div className="flex gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={() => setShowMicPrompt(false)}
                className="flex-1 py-2.5 bg-dark-navy border border-purple-rose/65 rounded-xl text-light-blush/60 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                {translations[language]?.notNow || "Not Now"}
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
                        setVoiceError(language === 'en' ? "Microphone access was denied or is blocked by browser settings." : "माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया था या ब्राउज़र सेटिंग्स द्वारा ब्लॉक है।");
                      });
                  } else {
                    localStorage.setItem('hk_mic_permission', 'granted');
                    setMicPermission('granted');
                    setShowMicPrompt(false);
                    startSpeechRecognition();
                  }
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer"
              >
                {translations[language]?.allowMic || "Allow Mic"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Voice Assistant Dialog Box */}
      {voiceStatus !== 'idle' && (
        <div className="fixed inset-0 bg-dark-navy/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-deep-purple border border-purple-rose/85 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center w-full">
              <h3 className="text-xs font-black text-peach-orange uppercase tracking-wider">
                {language === 'en' ? 'Voice Assistant' : 'आवाज़ सहायक'}
              </h3>
              <button
                onClick={stopSpeechRecognition}
                className="text-light-blush/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mic Animation Overlay */}
            <div className="relative py-4 flex items-center justify-center w-full">
              {voiceStatus === 'listening' ? (
                <>
                  <div className="absolute w-20 h-20 bg-rose-pink/20 rounded-full animate-ping" />
                  <div className="absolute w-16 h-16 bg-rose-pink/30 rounded-full animate-pulse" />
                  <div className="relative w-12 h-12 bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy rounded-full flex items-center justify-center shadow-lg">
                    <Mic className="w-5 h-5 animate-bounce" />
                  </div>
                </>
              ) : voiceStatus === 'error' ? (
                <div className="w-12 h-12 bg-rose-pink/15 text-rose-pink rounded-full flex items-center justify-center border border-rose-pink/30">
                  <X className="w-6 h-6 font-bold" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Feedback / Instructions */}
            <div className="text-center space-y-2.5 w-full">
              {voiceStatus === 'listening' && (
                <>
                  <p className="text-sm font-black text-white">
                    {language === 'en' ? 'Listening... Speak now' : 'सुन रहे हैं... अब बोलें'}
                  </p>
                  
                  <div className="bg-dark-navy/40 py-2.5 px-3.5 rounded-2xl border border-purple-rose/25 text-left space-y-1">
                    <span className="text-[8px] font-bold text-peach-orange uppercase tracking-widest block">
                      {language === 'en' ? 'Examples:' : 'उदाहरण:'}
                    </span>
                    <p className="text-[9px] text-light-blush/80 italic leading-snug">
                      • "500 online kal kiye"
                    </p>
                    <p className="text-[9px] text-light-blush/80 italic leading-snug">
                      • "पचास रुपये कैश 5 तारीख को"
                    </p>
                    <p className="text-[9px] text-light-blush/80 italic leading-snug">
                      • "Grocery milk 150 offline 2 august ko"
                    </p>
                  </div>
                </>
              )}
              {voiceStatus === 'error' && (
                <>
                  <p className="text-sm font-black text-rose-pink">
                    {language === 'en' ? 'Failed to Process' : 'प्रक्रिया विफल रही'}
                  </p>
                  <p className="text-[11px] text-light-blush/80 leading-relaxed px-2 bg-dark-navy/40 py-2 rounded-xl border border-rose-pink/10">{voiceError}</p>
                </>
              )}
              {voiceStatus === 'success' && (
                <>
                  <p className="text-sm font-black text-white">
                    {language === 'en' ? 'Transaction Saved!' : 'लेनदेन सहेजा गया!'}
                  </p>
                  <p className="text-[11px] text-[#ABC4E6] leading-relaxed px-2 bg-dark-navy/40 py-2.5 rounded-xl border border-purple-rose/20 font-bold">{voiceFeedback}</p>
                </>
              )}
            </div>

            {/* Actions Footer */}
            <div className="w-full pt-1">
              {voiceStatus === 'listening' ? (
                <button
                  onClick={stopSpeechRecognition}
                  className="w-full py-2.5 bg-dark-navy border border-purple-rose/65 rounded-xl text-rose-pink font-black text-[10px] uppercase tracking-wider transition-all duration-300 hover:bg-rose-pink/5 cursor-pointer"
                >
                  {translations[language]?.cancel || 'Cancel'}
                </button>
              ) : (
                <button
                  onClick={() => setVoiceStatus('idle')}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-pink to-peach-orange text-dark-navy font-black text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 hover:opacity-95 cursor-pointer"
                >
                  {language === 'en' ? 'Close Assistant' : 'सहायक बंद करें'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
