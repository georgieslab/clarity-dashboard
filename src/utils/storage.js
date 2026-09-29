import { saveUserData, getUserData } from './firebase';

// Current user (set after login)
let currentUser = null;

export const setCurrentUser = (user) => {
  currentUser = user;
};

export const storage = {
  // Get data (checks cloud first if logged in, then local)
  async get(key) {
    // If logged in, attempt Firestore, but gracefully fall back to localStorage
    if (currentUser) {
      try {
        const cloudData = await getUserData(currentUser.uid, key);
        if (cloudData !== null && cloudData !== undefined) {
          return cloudData;
        }
      } catch (cloudErr) {
        // Silently fall back to local storage when Firestore rules are restricted
      }
    }
    
    // Immediate localStorage access
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  },

  // Set data (saves to both local and cloud if logged in)
  async set(key, value) {
    let localSuccess = false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      localSuccess = true;
    } catch (localErr) {
      console.warn('localStorage write failed:', localErr);
    }
    
    // If logged in, also attempt Firestore save asynchronously
    if (currentUser) {
      try {
        await saveUserData(currentUser.uid, key, value);
      } catch (cloudErr) {
        // Silently swallow cloud permission errors so local app functionality continues
      }
    }
    
    return localSuccess;
  },

  // Remove data
  async remove(key) {
    let localSuccess = false;
    try {
      localStorage.removeItem(key);
      localSuccess = true;
    } catch (localErr) {
      console.warn('localStorage remove failed:', localErr);
    }
    
    // If logged in, also remove from cloud
    if (currentUser) {
      try {
        await saveUserData(currentUser.uid, key, null);
      } catch (cloudErr) {
        // Silently swallow cloud permission errors
      }
    }
    
    return localSuccess;
  },

  // Clear all
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};