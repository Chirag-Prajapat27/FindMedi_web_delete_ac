// ============================================
// Auth Service
// Encapsulates all interaction with Firebase Auth & Firestore for the
// delete-account flow. The UI never touches Firebase directly.
// ============================================

import {
  auth,
  db,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  doc,
  deleteDoc,
} from "./firebase-service.js";
import { USER_DATA_COLLECTIONS } from "./config.js";

let recaptchaVerifier = null;
let confirmationResult = null;

/**
 * Initializes the reCAPTCHA verifier. Idempotent — safe to call on retries.
 * @param {string} containerId - id of the DOM element to render into
 * @returns {RecaptchaVerifier}
 */
export function initRecaptcha(containerId) {
  if (recaptchaVerifier) return recaptchaVerifier;

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "normal",
    callback: () => {
      // Solved — flow will continue on form submit
    },
    "expired-callback": () => {
      // Verifier will need to be re-rendered
      resetRecaptcha();
    },
  });

  return recaptchaVerifier;
}

/**
 * Resets the reCAPTCHA so the user can retry.
 */
export function resetRecaptcha() {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      /* already cleared */
    }
    recaptchaVerifier = null;
  }
}

/**
 * Sends an SMS verification code to the given phone number.
 * @param {string} phoneNumber - E.164 format
 * @returns {Promise<void>}
 */
export async function sendVerificationCode(phoneNumber) {
  if (!recaptchaVerifier) {
    throw new Error("reCAPTCHA not initialized. Call initRecaptcha first.");
  }

  confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    recaptchaVerifier
  );
}

/**
 * Confirms the OTP the user entered. On success, the user is signed in.
 * @param {string} code
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function confirmCode(code) {
  if (!confirmationResult) {
    throw new Error("No verification in progress. Please request a new code.");
  }

  const credential = await confirmationResult.confirm(code);
  return credential.user;
}

/**
 * Deletes the signed-in user's Firestore data and Auth account.
 * Firestore documents are deleted first so that if Auth deletion fails,
 * we can retry without leaving orphaned user data.
 * @param {import('firebase/auth').User} user
 * @returns {Promise<void>}
 */
export async function deleteAccount(user) {
  if (!user) throw new Error("No authenticated user.");

  // 1. Delete all user-owned Firestore documents in parallel.
  const deletions = USER_DATA_COLLECTIONS.map((collection) =>
    deleteDoc(doc(db, collection, user.uid)).catch((err) => {
      // Log but don't block — a missing doc shouldn't block account deletion.
      console.warn(`Failed to delete ${collection}/${user.uid}:`, err);
    })
  );
  await Promise.all(deletions);

  // 2. Delete the Auth account. This is the last step because it is
  //    irreversible and revokes the credential needed for step 1.
  await user.delete();
}
