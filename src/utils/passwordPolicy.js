// src/utils/passwordPolicy.js
// Mirror of cinema-hall-api/utils/passwordPolicy.js — keep in sync.

export const PASSWORD_POLICY_CHECKS = [
  { label: 'At least 8 characters',      test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',            test: (p) => /\d/.test(p) },
  { label: 'One special character',       test: (p) => /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(p) },
]

/** Returns the first failed rule's label, or null if all pass. */
export const validatePassword = (password) => {
  for (const check of PASSWORD_POLICY_CHECKS) {
    if (!check.test(password)) return `Password must include: ${check.label.toLowerCase()}.`
  }
  return null
}
