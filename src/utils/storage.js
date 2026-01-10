import { saveUserData, getUserData } from './firebase';

// Current user (set after login)
let currentUser = null;

export const setCurrentUser = (user) => {
  currentUser = user;
};

export const storage = {
  // Get data (checks cloud first if logged in, then local)
  async get(key) {
    try {
      // If logged in, get from Firestore
      if (currentUser) {
        const cloudData = await getUserData(currentUser.uid, key);
        if (cloudData !== null) {
          return cloudData;
        }
      }
      
      // Fallback to localStorage
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      // Fallback to localStorage on error
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
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