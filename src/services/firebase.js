// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBukavFyOd9V82eTVYTLJ-Q_Hf22uxXU7E",
  authDomain: "hisab-kitab-e2f52.firebaseapp.com",
  projectId: "hisab-kitab-e2f52",
  storageBucket: "hisab-kitab-e2f52.firebasestorage.app",
  messagingSenderId: "231617783990",
  appId: "1:231617783990:web:0fe809eced4fe07d3c9e17",
  measurementId: "G-NJ9ZY48C8X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;