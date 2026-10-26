import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDBfShOBLjKyrodYIm2_7cZq7YrvUNFStE',
  authDomain: 'rajel-d7c0f.firebaseapp.com',
  projectId: 'rajel-d7c0f',
  storageBucket: 'rajel-d7c0f.firebasestorage.app',
  messagingSenderId: '670423461301',
  appId: '1:670423461301:web:fe0e30ee9ace49b4033dfc'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
