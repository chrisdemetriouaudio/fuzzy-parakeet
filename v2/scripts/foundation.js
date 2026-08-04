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

const scenarios = {
  api: {
    title: 'Chris evaluates the API change.',
    inputs: ['API dependency', 'Authentication method', 'Error handling', 'Rollback strategy'],
    questions: ['Which systems consume this API?', 'Is the authentication path understood?', 'What happens if the integration fails?'],
    outcomes: ['Integration dependency identified', 'Security review required', 'Consumer teams engaged', 'Recovery plan agreed'],
    summary: 'For an API change, technical teams provide the detail. Chris identifies integration, security and recovery implications before the change proceeds.'
  },
  access: {
    title: 'Chris evaluates the access change.',
    inputs: ['New user group', 'Role mapping', 'Provisioning method', 'Audit requirement'],
    questions: ['Which users and systems are affected?', 'Does the role preserve least-privilege access?', 'How will access be removed or recovered?'],
    outcomes: ['User access impact confirmed', 'Identity team engaged', 'Audit evidence agreed', 'Support guidance prepared'],
    summary: 'For a user-access change, the requirement becomes a clear identity, governance and support plan before users are affected.'
  },
  release: {
    title: 'Chris evaluates the release change.',
    inputs: ['Deployment window', 'Infrastructure requirement', 'Monitoring plan', 'Rollback threshold'],
    questions: ['Is every environment ready for the release?', 'Which teams need to approve the change?', 'What signals would trigger a rollback?'],
    outcomes: ['Network preparation required', 'Change approval scheduled', 'Monitoring owners confirmed', 'Recovery plan agreed'],
    summary: 'For a release change, technical details become a joined-up readiness plan across engineering, operations and governance.'
  }
};

const flowControls = document.querySelector('[data-flow-controls]');

function updateFlowList(element, items) {
  element.replaceChildren(...items.map((item) => {
    const listItem = document.createElement('li');
    const marker = document.createElement('span');
    marker.className = 'flow-marker';
    marker.setAttribute('aria-hidden', 'true');
    listItem.append(marker, document.createTextNode(item));
    return listItem;
  }));
}

function selectScenario(scenarioName) {
  const scenario = scenarios[scenarioName];
  document.querySelectorAll('[data-flow-scenario]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.flowScenario === scenarioName));
  });
  document.querySelector('[data-flow-title]').textContent = scenario.title;
  updateFlowList(document.querySelector('[data-flow-inputs]'), scenario.inputs);
  updateFlowList(document.querySelector('[data-flow-questions]'), scenario.questions);
  updateFlowList(document.querySelector('[data-flow-outcomes]'), scenario.outcomes);
  document.querySelector('[data-flow-summary]').textContent = scenario.summary;
}

if (flowControls) {
  flowControls.addEventListener('click', (event) => {
    const button = event.target.closest('[data-flow-scenario]');
    if (button) selectScenario(button.dataset.flowScenario);
  });
}

const revealElements = document.querySelectorAll('[data-reveal]');

if (revealElements.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  root.classList.add('has-js');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  revealElements.forEach((element) => revealObserver.observe(element));
}
