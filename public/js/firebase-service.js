// ============================================
// Firebase Service
// Initializes Firebase (modular v10+ SDK) and exposes the shared
// auth/firestore instances as singletons.
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Re-export the pieces the rest of the app needs, so consumers don't
// have to know about Firebase's CDN URLs.
export { RecaptchaVerifier, signInWithPhoneNumber, doc, deleteDoc };
