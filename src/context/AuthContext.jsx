import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  isConfigured,
  forceDemoMode
} from '../firebase/config';
import { fetchDocument, saveDocument, fetchCollection } from '../firebase/dbAdapter';
import { initializePatronScore } from '../services/scoreService';
import { seedBooksAndSettings } from '../services/seedService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('libcredit_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    if (isConfigured && !forceDemoMode && auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDoc = await fetchDocument('users', firebaseUser.uid);
            if (userDoc) {
              setCurrentUser(userDoc);
              localStorage.setItem('libcredit_current_user', JSON.stringify(userDoc));
            } else {
              const fallbackUser = {
                uid: firebaseUser.uid,
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                role: firebaseUser.email.toLowerCase().includes('admin') ? 'admin' : 'patron',
                status: 'active'
              };
              setCurrentUser(fallbackUser);
            }
          } catch (err) {
            console.warn('Background user fetch error:', err);
          }
        } else {
          // If no auth user and not in demo mode, clear session
          const cached = localStorage.getItem('libcredit_current_user');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              // Only clear if it was a firebase-based session
              if (parsed.uid && !parsed.uid.startsWith('demo_')) {
                setCurrentUser(null);
                localStorage.removeItem('libcredit_current_user');
              }
            } catch (e) {
              setCurrentUser(null);
              localStorage.removeItem('libcredit_current_user');
            }
          }
        }
      });
    }

    // Non-blocking background catalogue verification
    const timer = setTimeout(async () => {
      try {
        const books = await fetchCollection('books');
        if (!books || books.length === 0) {
          await seedBooksAndSettings();
        }
      } catch (e) {
        // non-blocking
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Register user (patron or staff)
  async function register({ email, password, name, matricNo, department, phone, role = 'patron' }) {
    let uid;

    if (isConfigured && !forceDemoMode && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
    } else {
      uid = `${role}_${Date.now()}`;
    }

    const newUserDoc = {
      id: uid,
      uid,
      name,
      email,
      matricNo: (matricNo || '').toUpperCase(),
      department: department || 'General Academic',
      phone: phone || '',
      role: role === 'admin' ? 'admin' : 'patron',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    await saveDocument('users', uid, newUserDoc);

    // Initialize scoring only for patrons
    if (newUserDoc.role === 'patron') {
      await initializePatronScore(uid, 50);
    }

    setCurrentUser(newUserDoc);
    localStorage.setItem('libcredit_current_user', JSON.stringify(newUserDoc));
    return newUserDoc;
  }

  // Login
  async function login(email, password) {
    if (isConfigured && !forceDemoMode && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await fetchDocument('users', cred.user.uid);
      if (userDoc) {
        if (userDoc.status === 'suspended') {
          throw new Error('This account has been suspended by library administration.');
        }
        setCurrentUser(userDoc);
        localStorage.setItem('libcredit_current_user', JSON.stringify(userDoc));
        return userDoc;
      } else {
        const isAdminEmail = email.toLowerCase().includes('admin');
        const fallbackDoc = {
          id: cred.user.uid,
          uid: cred.user.uid,
          name: cred.user.displayName || email.split('@')[0],
          email: cred.user.email,
          role: isAdminEmail ? 'admin' : 'patron',
          status: 'active',
          department: isAdminEmail ? 'College Library & Information Services' : 'General Academic',
          createdAt: new Date().toISOString()
        };
        await saveDocument('users', cred.user.uid, fallbackDoc);
        if (!isAdminEmail) {
          await initializePatronScore(cred.user.uid, 50);
        }
        setCurrentUser(fallbackDoc);
        localStorage.setItem('libcredit_current_user', JSON.stringify(fallbackDoc));
        return fallbackDoc;
      }
    }

    // Demo Mode lookup by email
    const users = await fetchCollection('users');
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!matched) {
      throw new Error('No user found with this email address.');
    }

    if (matched.status === 'suspended') {
      throw new Error('This account has been suspended by library administration.');
    }

    // In demo mode, accept any non-empty password
    if (!password) {
      throw new Error('Please enter a password');
    }

    setCurrentUser(matched);
    localStorage.setItem('libcredit_current_user', JSON.stringify(matched));
    return matched;
  }

  // Logout
  async function logout() {
    if (isConfigured && !forceDemoMode && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Signout warning:', e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('libcredit_current_user');
  }

  // Reset password
  async function resetPassword(email) {
    if (isConfigured && !forceDemoMode && auth) {
      return await sendPasswordResetEmail(auth, email);
    }
    // Demo mode: verify user exists
    const users = await fetchCollection('users');
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      throw new Error('No registered account found with this email address.');
    }
    return true;
  }

  // Quick switch for demo testing
  async function switchDemoUser(userId) {
    const userDoc = await fetchDocument('users', userId);
    if (userDoc) {
      setCurrentUser(userDoc);
      localStorage.setItem('libcredit_current_user', JSON.stringify(userDoc));
      return userDoc;
    }
  }

  // Update profile details (e.g. librarian name, phone, etc.)
  async function updateUserProfile(updates) {
    if (!currentUser) return;
    const uid = currentUser.id || currentUser.uid;
    const freshUserDoc = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await saveDocument('users', uid, freshUserDoc, true);
    setCurrentUser(freshUserDoc);
    localStorage.setItem('libcredit_current_user', JSON.stringify(freshUserDoc));
    return freshUserDoc;
  }

  const value = {
    currentUser,
    loading,
    isAdmin: currentUser?.role === 'admin',
    isPatron: currentUser?.role === 'patron',
    login,
    register,
    logout,
    resetPassword,
    switchDemoUser,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
