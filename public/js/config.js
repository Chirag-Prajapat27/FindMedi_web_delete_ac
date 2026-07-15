// ============================================
// Firebase Configuration
// ============================================
// Replace these with your actual Firebase project credentials.
// For production: load from environment variables via a build tool
// (Vite/Webpack) rather than committing real keys to source control.
//
// The apiKey is safe to expose in client code — security is enforced by
// Firebase Security Rules and Authentication, not by hiding the key.
// See: https://firebase.google.com/docs/projects/api-keys
// ============================================

export const firebaseConfig = {
  apiKey: "AIzaSyBsozg4kA0dvOV1FInRbV6XqfIBFYvU9H4",
  authDomain: "findmedi.firebaseapp.com",
  projectId: "findmedi",
  storageBucket: "findmedi.firebasestorage.app",
  messagingSenderId: "424528318396",
  appId: "1:424528318396:web:cdc94459d081232f2ca5b9",
};

// Collections that contain user-owned data. Listed here so the deletion
// pipeline is easy to extend — add a collection name and the service
// will handle cleanup automatically.
export const USER_DATA_COLLECTIONS = [
  "users",
  // "userPreferences",
  // "userActivity",
];

// UX tuning
export const OTP_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 30;
