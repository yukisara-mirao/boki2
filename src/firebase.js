import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDpgfgTpRQ5d5zyQn4XpyodcT7GODWqYXk',
  authDomain: 'boki2-31cd4.firebaseapp.com',
  projectId: 'boki2-31cd4',
  storageBucket: 'boki2-31cd4.firebasestorage.app',
  messagingSenderId: '912206702172',
  appId: '1:912206702172:web:f8d03af6b4264c9425e899',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DOC_REF = doc(db, 'boki2', 'boki2_v6');

export async function loadFromFirebase() {
  const snap = await getDoc(DOC_REF);
  if (snap.exists()) {
    const d = snap.data();
    return { checked: d.checked || {}, weak: d.weak || {}, memos: d.memos || {} };
  }
  return null;
}

export async function saveToFirebase(state) {
  await setDoc(DOC_REF, {
    checked: state.checked,
    weak: state.weak,
    memos: state.memos,
  });
}
