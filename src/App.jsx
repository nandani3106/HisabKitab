import { useState, useEffect, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import BlockDetail from './components/BlockDetail';
import Analytics from './components/Analytics';
import History from './components/History';
import Profile from './components/Profile';
import BottomNavbar from './components/BottomNavbar';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './services/firebase';
import { registerSW } from 'virtual:pwa-register';

// Register service worker if supported
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      // Show dynamic popup or let it auto update
    },
    onOfflineReady() {
      console.log('App offline ready');
    },
  });
}


function FloatingCoins() {
  const [coins] = useState(() => {
    const coinsCount = 15;
    return Array.from({ length: coinsCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: `${16 + Math.random() * 24}px`,
      opacity: 0.15 + Math.random() * 0.25,
    }));
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute bottom-[-50px] rounded-full bg-gradient-to-tr from-peach-orange to-light-blush flex items-center justify-center font-black text-deep-purple/80 animate-float shadow-lg"
          style={{
            left: coin.left,
            animationDelay: coin.delay,
            animationDuration: coin.duration,
            width: coin.size,
            height: coin.size,
            opacity: coin.opacity,
            fontSize: `calc(${coin.size} * 0.5)`,
          }}
        >
          ₹
        </div>
      ))}
    </div>
  );
}

function AppContent() {
  const { currentUser, loading, logout } = useContext(AuthContext);
  const [blocks, setBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hk_theme') || 'dark';
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('hk_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch blocks and their transactions from Firestore
  const fetchBlocksAndTransactions = useCallback(async () => {
    if (!currentUser) return;
    setBlocksLoading(true);
    try {
      // Fetch blocks
      const blocksQuery = query(collection(db, 'blocks'), where('userId', '==', currentUser.id));
      const blocksSnap = await getDocs(blocksQuery);
      const blocksList = blocksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch transactions
      const txQuery = query(collection(db, 'transactions'), where('userId', '==', currentUser.id));
      const txSnap = await getDocs(txQuery);
      const transactionsList = txSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Group in memory
      const blocksWithTxs = blocksList.map((block) => {
        const blockTxs = transactionsList
          .filter((t) => t.blockId === block.id)
          .map((t) => ({
            id: t.id,
            amount: t.amount,
            description: t.description,
            date: t.date,
            mode: t.mode
          }));

        return {
          id: block.id,
          name: block.name,
          mode: block.mode || 'both',
          color: block.color || 'rosePink',
          balance: block.balance || 0,
          transactions: blockTxs
        };
      });

      setBlocks(blocksWithTxs);
    } catch (error) {
      console.error('Error loading blocks from Firestore:', error);
    } finally {
      setBlocksLoading(false);
    }
  }, [currentUser]);

  // Sync data on login or profile change
  useEffect(() => {
    let active = true;
    if (currentUser) {
      const timer = setTimeout(() => {
        if (active) {
          fetchBlocksAndTransactions();
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else {
      const timer = setTimeout(() => {
        if (active) {
          setBlocks([]);
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [currentUser, fetchBlocksAndTransactions]);

  // Block handlers using Firestore
  const handleAddBlock = async (newBlockData) => {
    try {
      await addDoc(collection(db, 'blocks'), {
        userId: currentUser.id,
        name: newBlockData.name,
        mode: newBlockData.mode || 'both',
        color: newBlockData.color || 'rosePink',
        balance: Number(newBlockData.balance) || 0,
        createdAt: new Date().toISOString()
      });
      await fetchBlocksAndTransactions();
    } catch (error) {
      console.error('Error creating block on Firestore:', error);
    }
  };

  const handleUpdateBlock = async (blockId, updatedData) => {
    try {
      const blockRef = doc(db, 'blocks', blockId);
      await updateDoc(blockRef, {
        name: updatedData.name,
        mode: updatedData.mode,
        color: updatedData.color,
        balance: Number(updatedData.balance) || 0,
        updatedAt: new Date().toISOString()
      });
      await fetchBlocksAndTransactions();
    } catch (error) {
      console.error('Error updating block on Firestore:', error);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      await deleteDoc(doc(db, 'blocks', blockId));
      
      // Delete all related transactions
      const txQuery = query(
        collection(db, 'transactions'),
        where('blockId', '==', blockId),
        where('userId', '==', currentUser.id)
      );
      const txSnap = await getDocs(txQuery);
      const batch = writeBatch(db);
      txSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      await fetchBlocksAndTransactions();
    } catch (error) {
      console.error('Error deleting block on Firestore:', error);
    }
  };

  const handleAddTransaction = async (blockId, newTxData) => {
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.id,
        blockId,
        amount: Number(newTxData.amount),
        description: newTxData.description,
        date: newTxData.date,
        mode: newTxData.mode,
        createdAt: new Date().toISOString()
      });
      await fetchBlocksAndTransactions();
    } catch (error) {
      console.error('Error adding transaction on Firestore:', error);
    }
  };

  const handleUpdateTransaction = async (blockId, txId, updatedData) => {
    try {
      const txRef = doc(db, 'transactions', txId);
      await updateDoc(txRef, {
        amount: Number(updatedData.amount),
        description: updatedData.description,
        date: updatedData.date,
        mode: updatedData.mode,
        updatedAt: new Date().toISOString()
      });
      await fetchBlocksAndTransactions();
    } catch (error) {
      console.error('Error updating transaction on Firestore:', error);
    }
  };

  const handleDeleteTransaction = async (blockId, txId) => {
    try {
      await deleteDoc(doc(db, 'transactions', txId));
      await fetchBlocksAndTransactions();
    } catch (error) {
      console.error('Error deleting transaction on Firestore:', error);
    }
  };

  // Auth Redirect Guard
  useEffect(() => {
    if (loading) return;
    const isAuthPath = location.pathname === '/login' || location.pathname === '/signup';
    if (!currentUser && !isAuthPath) {
      navigate('/login');
    } else if (currentUser && isAuthPath) {
      navigate('/');
    }
  }, [currentUser, loading, location.pathname, navigate]);

  // Date formatting variables
  const today = new Date();
  const isAuthPath = location.pathname === '/login' || location.pathname === '/signup';
  const isSignupPath = location.pathname === '/signup';

  if (loading) {
    return (
      <div className="min-h-screen plank-wall flex items-center justify-center font-sans">
        <div className="text-white font-bold text-sm animate-pulse uppercase tracking-widest drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.85)]">
          Loading HisabKitab...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full plank-wall text-light-blush flex flex-col justify-start items-center relative overflow-hidden font-sans pt-0 px-0 ${isAuthPath ? 'pb-0' : 'pb-28'}`}>

      {/* Top Right Navigation Buttons */}
      {isAuthPath && (
        <div className="absolute top-5 right-5 z-30">
          {location.pathname === '/login' ? (
            <Link
              to="/signup"
              className="bg-deep-purple/95 backdrop-blur-md border border-purple-rose/85 text-peach-orange hover:text-white hover:border-peach-orange/80 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer inline-block"
            >
              Sign Up
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-deep-purple/95 backdrop-blur-md border border-purple-rose/85 text-peach-orange hover:text-white hover:border-peach-orange/80 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer inline-block"
            >
              Sign In
            </Link>
          )}
        </div>
      )}

      {/* Background glowing gradients */}
      {!isAuthPath && (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-pink/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-rose-pink/10 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Top Header - Logo and Dynamic Calendar Card Icon */}
      {currentUser && (
        <header className="w-full mb-6 mt-0 flex justify-between items-center bg-deep-purple/90 backdrop-blur-xl px-6 py-2.5 border-b border-purple-rose/85 rounded-none shadow-xl z-20">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-tr from-rose-pink to-peach-orange text-dark-navy rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-rose-pink/15">
              HK
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight leading-none">HisabKitab</h1>
              <p className="text-[8px] text-light-blush/60 font-bold uppercase tracking-widest mt-1">Finance Hub</p>
            </div>
          </div>

          {/* Visual Mini Desk Calendar Card */}
          <div className="w-12 h-12 bg-light-blush rounded-2xl overflow-hidden flex flex-col items-center shadow-lg border border-purple-rose/40 animate-in slide-in-from-right-4 duration-300">
            <div className="w-full bg-rose-pink text-[6.5px] font-black text-white py-0.5 text-center uppercase tracking-widest leading-none">
              {today.toLocaleDateString('en-IN', { year: 'numeric' })}
            </div>
            <div className="flex-1 flex flex-col items-center justify-center -mt-0.5">
              <span className="text-[9px] font-black text-dark-navy uppercase leading-none">
                {today.toLocaleDateString('en-IN', { month: 'short' })}
              </span>
              <span className="text-[13px] font-black text-deep-purple leading-none mt-0.5">
                {today.toLocaleDateString('en-IN', { day: '2-digit' })}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Hanging HK Logo Signboard */}
      {isAuthPath && (
        <div className="absolute top-0 left-0 right-0 w-full flex justify-center pointer-events-none select-none z-20 animate-hanging-drop">
          <div className="flex flex-col items-center origin-top animate-sway" style={{ filter: 'drop-shadow(0 25px 12px rgba(0, 0, 0, 0.45))' }}>
            {/* Two Hanging Wires */}
            <div className={`flex relative transition-all duration-300 ${isSignupPath ? 'gap-10' : 'gap-12'}`}>
              <div className={`w-[1.5px] bg-black transition-all duration-300 ${isSignupPath ? 'h-20' : 'h-32'}`} />
              <div className={`w-[1.5px] bg-black transition-all duration-300 ${isSignupPath ? 'h-20' : 'h-32'}`} />
            </div>

            {/* The Logo Board (smaller size) */}
            <div className="w-18 h-18 bg-gradient-to-br from-deep-purple/95 to-dark-navy/95 border border-purple-rose/85 rounded-2xl flex flex-col items-center justify-center p-1.5 -mt-0.5 relative">
              {/* Metal ring connectors */}
              <div className="absolute -top-1 left-3.5 w-2 h-2 rounded-full border border-purple-rose/85 bg-dark-navy flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-purple-rose/45" />
              </div>
              <div className="absolute -top-1 right-3.5 w-2 h-2 rounded-full border border-purple-rose/85 bg-dark-navy flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-purple-rose/45" />
              </div>

              {/* Simple HK Logo (increased size) */}
              <div className="w-14 h-14 bg-gradient-to-tr from-rose-pink to-peach-orange text-dark-navy rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-rose-pink/15">
                HK
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Router */}
      <div className={`w-full max-w-md flex justify-center z-10 flex-1 ${isAuthPath ? 'items-end px-0' : 'items-start px-4'}`}>
        {blocksLoading && blocks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-peach-orange font-bold text-xs animate-pulse uppercase tracking-wider">
              Loading Blocks...
            </div>
          </div>
        ) : (
          <Routes>
            <Route 
              path="/login" 
              element={<Login />} 
            />
            
            <Route 
              path="/signup" 
              element={<Signup />} 
            />

            <Route 
              path="/" 
              element={
                currentUser ? (
                  <Home 
                    blocks={blocks} 
                    onAddBlock={handleAddBlock} 
                    onUpdateBlock={handleUpdateBlock}
                    onDeleteBlock={handleDeleteBlock} 
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/block/:id" 
              element={
                currentUser ? (
                  <BlockDetail 
                    blocks={blocks} 
                    onAddTransaction={handleAddTransaction} 
                    onUpdateTransaction={handleUpdateTransaction}
                    onDeleteTransaction={handleDeleteTransaction} 
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/analytics" 
              element={
                currentUser ? (
                  <Analytics blocks={blocks} />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/history" 
              element={
                currentUser ? (
                  <History blocks={blocks} />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/profile" 
              element={
                currentUser ? (
                  <Profile currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>

      {/* Bottom Fixed Navigation Bar */}
      {currentUser && (
        <BottomNavbar onLogout={handleLogout} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
