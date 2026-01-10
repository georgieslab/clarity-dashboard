import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAUzgNdQ4Mc7SfKWnr7vQsrSQL3zsriyt0",
  authDomain: "clarity-aicompanion.firebaseapp.com",
  projectId: "clarity-aicompanion",
  storageBucket: "clarity-aicompanion.firebasestorage.app",
  messagingSenderId: "618968844124",
  appId: "1:618968844124:web:5756b9771258a2feca2399"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
};

// Firestore functions
export const saveUserData = async (userId, dataType, data) => {
  try {
    await setDoc(doc(db, 'users', userId, 'data', dataType), {
      data: data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Save error:', error);
    throw error;
  }
};

export const getUserData = async (userId, dataType) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', dataType);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().data;
    }
    return null;
  } catch (error) {
    console.error('Get error:', error);
    throw error;
  }
};

export const syncAllData = async (userId, localData) => {
  try {
    // Save all data types to Firestore
    const promises = [];
    
    if (localData.sobriety) {
      promises.push(saveUserData(userId, 'sobriety', localData.sobriety));
    }
    if (localData.applications) {
      promises.push(saveUserData(userId, 'applications', localData.applications));
    }
    if (localData.therapy) {
      promises.push(saveUserData(userId, 'therapy', localData.therapy));
    }
    if (localData.weeklyInsights) {
      promises.push(saveUserData(userId, 'weeklyInsights', localData.weeklyInsights));
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
};

export const loadAllData = async (userId) => {
  try {
    const [sobriety, applications, therapy, weeklyInsights] = await Promise.all([
      getUserData(userId, 'sobriety'),
      getUserData(userId, 'applications'),
      getUserData(userId, 'therapy'),
      getUserData(userId, 'weeklyInsights')
    ]);
    
    return {
      sobriety,
      applications,
      therapy,
      weeklyInsights
    };
  } catch (error) {
    console.error('Load error:', error);
    throw error;
  }
};

export { auth, db };