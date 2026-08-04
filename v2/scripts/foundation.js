const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('[data-navigation]');

const storedTheme = localStorage.getItem('cd-v2-theme');
const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

function setTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
  localStorage.setItem('cd-v2-theme', theme);
}

setTheme(storedTheme || (systemPrefersLight ? 'light' : 'dark'));

themeToggle.addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  navigation.dataset.open = String(!isOpen);
});

navigation.addEventListener('click', () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  navigation.dataset.open = 'false';
});
