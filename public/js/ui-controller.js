// ============================================
// UI Controller
// Owns the DOM: step transitions, form state, loading indicators,
// error messages. Knows nothing about Firebase directly.
// ============================================

import { RESEND_COOLDOWN_SECONDS } from "./config.js";

const STEPS = ["phone", "otp", "confirm", "success"];

export class UIController {
  constructor() {
    this.elements = this.#cacheElements();
    this.resendInterval = null;
  }

  #cacheElements() {
    const $ = (id) => document.getElementById(id);
    return {
      // Steps
      stepPhone: $("step-phone"),
      stepOtp: $("step-otp"),
      stepConfirm: $("step-confirm"),
      stepSuccess: $("step-success"),
      railSteps: document.querySelectorAll(".rail__step"),
      railFill: $("rail-fill"),

      // Forms
      phoneForm: $("phone-form"),
      otpForm: $("otp-form"),

      // Inputs
      phoneInput: $("phone"),
      otpInput: $("otp"),
      confirmCheckbox: $("confirm-checkbox"),

      // Buttons
      sendOtpBtn: $("send-otp-btn"),
      verifyOtpBtn: $("verify-otp-btn"),
      deleteBtn: $("delete-btn"),
      backBtn: $("back-btn"),
      cancelBtn: $("cancel-btn"),
      resendBtn: $("resend-btn"),

      // Display
      phoneDisplay: $("phone-display"),
      phoneError: $("phone-error"),
      otpError: $("otp-error"),
      resendTimer: $("resend-timer"),
      status: $("status"),
      recaptchaContainer: $("recaptcha-container"),
    };
  }

  // ------------------------------
  // Step navigation
  // ------------------------------
  goToStep(name) {
    const stepMap = {
      phone: this.elements.stepPhone,
      otp: this.elements.stepOtp,
      confirm: this.elements.stepConfirm,
      success: this.elements.stepSuccess,
    };

    Object.values(stepMap).forEach((el) => el.classList.add("is-hidden"));
    stepMap[name]?.classList.remove("is-hidden");

    this.#updateRail(name);
  }

  #updateRail(currentStep) {
    const currentIdx = STEPS.indexOf(currentStep);

    this.elements.railSteps.forEach((el, i) => {
      el.classList.remove("is-active", "is-complete");
      if (i < currentIdx) el.classList.add("is-complete");
      else if (i === currentIdx) el.classList.add("is-active");
    });

    // Progress bar fills based on how far through the flow we are.
    // phone=0%, otp=50%, confirm=100%, success=100%
    const percentMap = { phone: 0, otp: 50, confirm: 100, success: 100 };
    if (this.elements.railFill) {
      this.elements.railFill.style.width = `${percentMap[currentStep] ?? 0}%`;
    }
  }

  // ------------------------------
  // Input & error helpers
  // ------------------------------
  getPhone() {
    return this.elements.phoneInput.value.trim();
  }

  getOtp() {
    return this.elements.otpInput.value.trim();
  }

  setPhoneError(message) {
    this.elements.phoneError.textContent = message || "";
    this.elements.phoneInput.classList.toggle("is-invalid", Boolean(message));
  }

  setOtpError(message) {
    this.elements.otpError.textContent = message || "";
    this.elements.otpInput.classList.toggle("is-invalid", Boolean(message));
  }

  setPhoneDisplay(phone) {
    this.elements.phoneDisplay.textContent = phone;
  }

  // ------------------------------
  // Loading & status
  // ------------------------------
  setLoading(button, isLoading) {
    button.classList.toggle("is-loading", isLoading);
    button.disabled = isLoading;
  }

  showStatus(message, type = "info") {
    const el = this.elements.status;
    el.textContent = message;
    el.className = `status is-visible status--${type}`;
  }

  clearStatus() {
    this.elements.status.className = "status";
    this.elements.status.textContent = "";
  }

  // ------------------------------
  // Resend cooldown
  // ------------------------------
  startResendCooldown() {
    const btn = this.elements.resendBtn;
    const timer = this.elements.resendTimer;
    let remaining = RESEND_COOLDOWN_SECONDS;

    btn.disabled = true;
    timer.textContent = remaining;
    btn.firstChild.textContent = "Resend code in ";

    clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      remaining -= 1;
      timer.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this.resendInterval);
        btn.disabled = false;
        btn.textContent = "Resend code";
      }
    }, 1000);
  }

  stopResendCooldown() {
    clearInterval(this.resendInterval);
  }

  // ------------------------------
  // Confirmation checkbox toggle
  // ------------------------------
  bindDeleteConfirmation() {
    const { confirmCheckbox, deleteBtn } = this.elements;
    confirmCheckbox.addEventListener("change", () => {
      deleteBtn.disabled = !confirmCheckbox.checked;
    });
  }

  // ------------------------------
  // Reset helpers
  // ------------------------------
  resetOtpInput() {
    this.elements.otpInput.value = "";
    this.setOtpError("");
  }
}
