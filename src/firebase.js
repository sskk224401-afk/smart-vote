import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD6aizjkqi1EmVCJuanBtfeyCtvfv2cBpQ',
  authDomain: 'smartvote-8c980.firebaseapp.com',
  projectId: 'smartvote-8c980',
  storageBucket: 'smartvote-8c980.firebasestorage.app',
  messagingSenderId: '50482011838',
  appId: '1:50482011838:web:391546146c71b5003548ef',
  measurementId: 'G-J5DH5R6L13',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
