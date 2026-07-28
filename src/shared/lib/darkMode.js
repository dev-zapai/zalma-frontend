// Dashboard dark mode.
//
// The preference is per-browser (localStorage) and applied as the `dark`
// class on <html>, which Tailwind (darkMode: "class") and the token block in
// index.css key off. The class is applied while INSIDE the dashboard layout
// and removed when leaving it, so the public salon website and the auth pages
// always render light regardless of the admin's dashboard preference.

const STORAGE_KEY = 'zalma-dashboard-theme';

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme === 'dark' ? 'dark' : 'light');
  } catch {
    // storage unavailable (private mode) - the toggle still works for the session
  }
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function clearThemeClass() {
  document.documentElement.classList.remove('dark');
}
