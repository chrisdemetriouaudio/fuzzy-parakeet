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

const contactForm = document.querySelector('[data-contact-form]');

if (contactForm) {
  const contactStatus = document.querySelector('#contact-status');
  const contactSubmit = contactForm.querySelector('.contact-submit');
  const contactFields = contactForm.querySelectorAll('input:not([type="hidden"]), textarea');

  function setContactStatus(message, state = '') {
    contactStatus.textContent = message;
    contactStatus.dataset.state = state;
  }

  contactFields.forEach((field) => {
    field.addEventListener('input', () => {
      field.setAttribute('aria-invalid', String(!field.validity.valid));
      if ([...contactFields].every((item) => item.validity.valid)) {
        setContactStatus('Details ready to send.', 'ready');
      }
    });
  });

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!contactForm.checkValidity()) {
      contactFields.forEach((field) => field.setAttribute('aria-invalid', String(!field.validity.valid)));
      setContactStatus('Please complete the highlighted fields.', 'error');
      contactForm.reportValidity();
      return;
    }

    const formData = new FormData(contactForm);
    const token = formData.get('cf-turnstile-response');
    if (!token) {
      setContactStatus('Please complete the security check before continuing.', 'error');
      return;
    }

    contactSubmit.disabled = true;
    setContactStatus('Checking your details…');
    try {
      const response = await fetch('https://turnstile-siteverify-chrisdemetriou.christian4collective.workers.dev/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const verification = await response.json();
      if (!response.ok || verification.success !== true) {
        setContactStatus('The security check did not complete. Please try again.', 'error');
        return;
      }

      setContactStatus('Verified. Opening your email client…', 'ready');
    } catch {
      setContactStatus('We could not verify the form. Please try again.', 'error');
      return;
    } finally {
      contactSubmit.disabled = false;
    }

    const subject = `Website enquiry from ${formData.get('name')}`;
    const body = `Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\n\n${formData.get('message')}`;
    window.location.href = `mailto:techdelivery@chrisdemetriou.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
