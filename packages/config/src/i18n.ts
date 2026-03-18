/**
 * i18n Configuration for Synergine
 * Simple translation object with German and English strings
 */

export type Locale = "en" | "de";

export const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    agents: "Agents",
    settings: "Settings",
    search: "Search",
    login: "Login",
    logout: "Logout",
    signup: "Sign Up",

    // Common UI
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",

    // Auth
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    noAccount: "Don't have an account?",

    // User
    profile: "Profile",
    account: "Account",
    preferences: "Preferences",
    changePassword: "Change Password",

    // Messages
    welcomeBack: "Welcome back!",
    invalidEmail: "Invalid email address",
    passwordTooShort: "Password must be at least 8 characters",
    passwordsDoNotMatch: "Passwords do not match",
  },

  de: {
    // Navigation
    dashboard: "Dashboard",
    agents: "Agenten",
    settings: "Einstellungen",
    search: "Suche",
    login: "Anmelden",
    logout: "Abmelden",
    signup: "Registrieren",

    // Common UI
    loading: "Wird geladen...",
    error: "Fehler",
    success: "Erfolg",
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
    edit: "Bearbeiten",
    add: "Hinzufügen",
    close: "Schließen",
    back: "Zurück",
    next: "Weiter",
    previous: "Zurück",

    // Auth
    email: "E-Mail",
    password: "Passwort",
    forgotPassword: "Passwort vergessen?",
    resetPassword: "Passwort zurücksetzen",
    createAccount: "Konto erstellen",
    alreadyHaveAccount: "Haben Sie bereits ein Konto?",
    noAccount: "Haben Sie noch kein Konto?",

    // User
    profile: "Profil",
    account: "Konto",
    preferences: "Voreinstellungen",
    changePassword: "Passwort ändern",

    // Messages
    welcomeBack: "Willkommen zurück!",
    invalidEmail: "Ungültige E-Mail-Adresse",
    passwordTooShort: "Passwort muss mindestens 8 Zeichen lang sein",
    passwordsDoNotMatch: "Passwörter stimmen nicht überein",
  },
};

/**
 * Get translation string by key and locale
 * Falls back to English if key or locale not found
 */
export function t(key: keyof typeof translations.en, locale: Locale = "en"): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

/**
 * Get all translations for a locale
 */
export function getTranslations(locale: Locale = "en") {
  return translations[locale] ?? translations.en;
}

export default { translations, t, getTranslations };
