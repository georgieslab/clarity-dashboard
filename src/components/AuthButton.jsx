import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logOut, loadAllData } from '../utils/firebase';
import { setCurrentUser } from '../utils/storage';
import { onAuthStateChanged } from 'firebase/auth';

export default function AuthButton() {
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setCurrentUser(user);
      
      if (user) {
        // Check if we already synced this session
        const alreadySynced = sessionStorage.getItem('clarity-synced');
        
        if (!alreadySynced) {
          setSyncing(true);
          try {
            const cloudData = await loadAllData(user.uid);
            
            // Merge cloud data with local (cloud takes priority)
            if (cloudData.sobriety) {
              localStorage.setItem('sobriety', JSON.stringify(cloudData.sobriety));
            }
            if (cloudData.applications) {
              localStorage.setItem('applications', JSON.stringify(cloudData.applications));
            }
            if (cloudData.therapy) {
              localStorage.setItem('therapy', JSON.stringify(cloudData.therapy));
            }
            if (cloudData.weeklyInsights) {
              localStorage.setItem('weeklyInsights', JSON.stringify(cloudData.weeklyInsights));
            }
            
            // Mark as synced for this browser session
            sessionStorage.setItem('clarity-synced', 'true');
            
            console.log('Sync complete - data loaded from cloud');
          } catch (error) {
            console.error('Sync error:', error);
          } finally {
            setSyncing(false);
          }
        }
      } else {
        // User signed out - clear sync flag
        sessionStorage.removeItem('clarity-synced');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      alert('Sign-in failed: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
    } catch (error) {
      alert('Sign-out failed: ' + error.message);
    }
  };

  if (syncing) {
    return (
      <div className="auth-button syncing">
        <div className="sync-loader"></div>
        <span>Syncing data...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-button signed-in">
        <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
        <span className="user-name">{user.displayName?.split(' ')[0]}</span>
        <button onClick={handleSignOut} className="sign-out-btn">
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleSignIn} className="auth-button sign-in">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
        <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
        <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
      </svg>
      Sign in with Google
    </button>
  );
}