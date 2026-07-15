// ============================================
// Main Entry Point
// Wires the UI controller to the auth service. This is the only
// file that knows about *both* sides — keeping each module focused.
// ============================================

import {
  initRecaptcha,
  resetRecaptcha,
  sendVerificationCode,
  confirmCode,
  deleteAccount,
} from "./auth-service.js";
import { validatePhone, validateOtp, friendlyAuthError } from "./validators.js";
import { UIController } from "./ui-controller.js";

const ui = new UIController();

// State carried between steps. Kept in a closure rather than on `window`
// to avoid accidental global pollution.
const state = {
  phoneNumber: null,
  user: null,
};

// ------------------------------
// Initialize reCAPTCHA on load
// ------------------------------
try {
  initRecaptcha("recaptcha-container");
} catch (err) {
  console.error("reCAPTCHA init failed:", err);
  ui.showStatus(
    "Unable to load verification. Please refresh the page.",
    "error"
  );
}

ui.bindDeleteConfirmation();

// ------------------------------
// Step 1: Send OTP
// ------------------------------
ui.elements.phoneForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  ui.clearStatus();

  const { valid, error, normalized } = validatePhone(ui.getPhone());
  if (!valid) {
    ui.setPhoneError(error);
    return;
  }
  ui.setPhoneError("");

  ui.setLoading(ui.elements.sendOtpBtn, true);
  try {
    await sendVerificationCode(normalized);
    state.phoneNumber = normalized;
    ui.setPhoneDisplay(normalized);
    ui.goToStep("otp");
    ui.startResendCooldown();
    ui.elements.otpInput.focus();
  } catch (err) {
    console.error("sendVerificationCode failed:", err);
    ui.showStatus(friendlyAuthError(err), "error");
    resetRecaptcha();
    initRecaptcha("recaptcha-container");
  } finally {
    ui.setLoading(ui.elements.sendOtpBtn, false);
  }
});

// ------------------------------
// Step 2: Verify OTP
// ------------------------------
ui.elements.otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  ui.clearStatus();

  const { valid, error } = validateOtp(ui.getOtp());
  if (!valid) {
    ui.setOtpError(error);
    return;
  }
  ui.setOtpError("");

  ui.setLoading(ui.elements.verifyOtpBtn, true);
  try {
    state.user = await confirmCode(ui.getOtp());
    ui.goToStep("confirm");
  } catch (err) {
    console.error("confirmCode failed:", err);
    ui.setOtpError(friendlyAuthError(err));
  } finally {
    ui.setLoading(ui.elements.verifyOtpBtn, false);
  }
});

// Back button: return to phone step
ui.elements.backBtn.addEventListener("click", () => {
  ui.resetOtpInput();
  ui.stopResendCooldown();
  ui.goToStep("phone");
});

// Resend code
ui.elements.resendBtn.addEventListener("click", async () => {
  if (!state.phoneNumber) return;
  ui.clearStatus();
  try {
    await sendVerificationCode(state.phoneNumber);
    ui.showStatus("A new code has been sent.", "info");
    ui.startResendCooldown();
  } catch (err) {
    console.error("resend failed:", err);
    ui.showStatus(friendlyAuthError(err), "error");
  }
});

// ------------------------------
// Step 3: Final deletion
// ------------------------------
ui.elements.deleteBtn.addEventListener("click", async () => {
  ui.clearStatus();
  ui.setLoading(ui.elements.deleteBtn, true);
  try {
    await deleteAccount(state.user);
    ui.goToStep("success");
  } catch (err) {
    console.error("deleteAccount failed:", err);
    ui.showStatus(friendlyAuthError(err), "error");
  } finally {
    ui.setLoading(ui.elements.deleteBtn, false);
  }
});

// Cancel: return to phone step and clear any auth
ui.elements.cancelBtn.addEventListener("click", async () => {
  if (state.user) {
    try {
      await state.user.auth.signOut();
    } catch {
      /* ignore */
    }
  }
  state.user = null;
  state.phoneNumber = null;
  ui.resetOtpInput();
  ui.elements.phoneInput.value = "";
  ui.elements.confirmCheckbox.checked = false;
  ui.elements.deleteBtn.disabled = true;
  ui.goToStep("phone");
});
