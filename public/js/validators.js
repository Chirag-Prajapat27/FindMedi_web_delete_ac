// ============================================
// Validation Utilities
// Pure functions with no DOM or Firebase dependencies — easy to unit test.
// ============================================

import { OTP_LENGTH } from "./config.js";

/**
 * Validates a phone number in E.164 format (+CCXXXXXXXXXX).
 * @param {string} phone
 * @returns {{ valid: boolean, error?: string, normalized?: string }}
 */
export function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return { valid: false, error: "Phone number is required." };
  }

  // Strip spaces, dashes, parentheses
  const normalized = phone.replace(/[\s\-()]/g, "");

  // E.164 format: + followed by 8–15 digits
  const e164 = /^\+[1-9]\d{7,14}$/;
  if (!e164.test(normalized)) {
    return {
      valid: false,
      error: "Enter a valid number in international format (e.g. +919876543210).",
    };
  }

  return { valid: true, normalized };
}

/**
 * Validates a one-time password.
 * @param {string} otp
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateOtp(otp) {
  if (!otp || !otp.trim()) {
    return { valid: false, error: "Verification code is required." };
  }

  const pattern = new RegExp(`^\\d{${OTP_LENGTH}}$`);
  if (!pattern.test(otp.trim())) {
    return { valid: false, error: `Enter the ${OTP_LENGTH}-digit code.` };
  }

  return { valid: true };
}

/**
 * Maps Firebase auth error codes to human-friendly messages.
 * @param {Error & { code?: string }} error
 * @returns {string}
 */
export function friendlyAuthError(error) {
  const map = {
    "auth/invalid-phone-number": "That phone number doesn't look right. Please check and try again.",
    "auth/missing-phone-number": "Please enter your phone number.",
    "auth/quota-exceeded": "Too many attempts right now. Please try again later.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/invalid-verification-code": "Incorrect code. Please double-check and try again.",
    "auth/code-expired": "This code has expired. Please request a new one.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes before trying again.",
    "auth/captcha-check-failed": "reCAPTCHA verification failed. Please reload and try again.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/requires-recent-login": "For security, please sign in again before deleting your account.",
  };

  return map[error?.code] || error?.message || "Something went wrong. Please try again.";
}
