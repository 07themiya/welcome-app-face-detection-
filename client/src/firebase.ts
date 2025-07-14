// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvsoENKkTmZu7HOx7JoIRuUtNDNbBFM-E",
  authDomain: "bookregister-85a1c.firebaseapp.com",
  databaseURL: "https://bookregister-85a1c-default-rtdb.firebaseio.com",
  projectId: "bookregister-85a1c",
  storageBucket: "bookregister-85a1c.firebasestorage.app",
  messagingSenderId: "662895898608",
  appId: "1:662895898608:web:3ea5bd70067aef6f5f7735"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, push };

