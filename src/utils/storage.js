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
    try {
      // Always save to localStorage first (immediate)
      localStorage.setItem(key, JSON.stringify(value));
      
      // If logged in, also save to Firestore
      if (currentUser) {
        await saveUserData(currentUser.uid, key, value);
      }
      
      return true;
    } catch (error) {
      console.error('Error writing to storage:', error);
      return false;
    }
  },

  // Remove data
  async remove(key) {
    try {
      localStorage.removeItem(key);
      
      // If logged in, also remove from cloud
      if (currentUser) {
        await saveUserData(currentUser.uid, key, null);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing from storage:', error);
      return false;
    }
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