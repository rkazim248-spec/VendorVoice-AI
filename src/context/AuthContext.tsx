import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export interface DemoUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: User | DemoUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (e: string, p: string, displayName?: string) => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signInAsDemo: () => void;
  sendPasswordReset: (e: string) => Promise<void>;
  setupRecaptcha: (elementId: string) => RecaptchaVerifier;
  sendPhoneOtp: (phone: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Check for saved demo session
          try {
            const savedDemo = localStorage.getItem('vv_demo_user');
            if (savedDemo) {
              setUser(JSON.parse(savedDemo));
            } else {
              setUser(null);
            }
          } catch (e) {
            setUser(null);
          }
        }
        setLoading(false);
      }, (error) => {
        console.warn('Firebase Auth state listener error:', error);
        try {
          const savedDemo = localStorage.getItem('vv_demo_user');
          if (savedDemo) {
            setUser(JSON.parse(savedDemo));
          } else {
            setUser(null);
          }
        } catch (e) {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase Auth initialization error:', e);
      setLoading(false);
    }
  }, []);

  const signInAsDemo = () => {
    const demoUser: DemoUser = {
      uid: 'demo_vendor_101',
      email: 'vendor@shop.com',
      displayName: 'Shop Vendor',
      isDemo: true
    };
    try {
      localStorage.setItem('vv_demo_user', JSON.stringify(demoUser));
    } catch (e) {
      // ignore quota issues
    }
    setUser(demoUser);
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error?.code === 'auth/api-key-not-valid' || error?.message?.includes('api-key-not-valid') || error?.message?.includes('API key')) {
        throw new Error('Firebase API Key is invalid or not yet configured. Please click "Continue in Demo / Guest Mode" or configure Firebase credentials.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && userCred.user) {
        await updateFirebaseProfile(userCred.user, { displayName });
      }
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (error?.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else if (error?.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials.');
      } else if (error?.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        throw new Error('No user found with this email address.');
      }
      throw error;
    }
  };

  const setupRecaptcha = (elementId: string) => {
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {}
    }
    const verifier = new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {}
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const sendPhoneOtp = async (phone: string, recaptchaVerifier: RecaptchaVerifier) => {
    try {
      return await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
    } catch (error: any) {
      if (error?.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format. Include country code (e.g. +923001234567 or +12125550123).');
      } else if (error?.code === 'auth/quota-exceeded' || error?.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      try {
        localStorage.removeItem('vv_demo_user');
      } catch (e) {}
      if (auth) {
        await firebaseSignOut(auth).catch(() => {});
      }
      setUser(null);
    } catch (error) {
      console.error('Logout Error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      signInAsDemo,
      sendPasswordReset,
      setupRecaptcha,
      sendPhoneOtp,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
