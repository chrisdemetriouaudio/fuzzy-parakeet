const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('[data-navigation]');

const storedTheme = localStorage.getItem('cd-v2-theme');
const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

function setTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
  themeLabel.textContent = `${nextTheme.charAt(0).toUpperCase()}${nextTheme.slice(1)} mode`;
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

navigation.addEventListener('click', (event) => {
  if (event.target.closest('.nav-cv')) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  navigation.dataset.open = 'false';
});

const scenarios = {
  cloud: {
    title: 'Chris connects the migration picture.',
    inputs: ['80+ enterprise applications', 'Global SaaS estate', 'On-prem to OCI (Oracle Cloud)', 'No extended downtime'],
    questions: ['Which dependencies would make a move unsafe?', 'Which teams need to validate readiness together?', 'What must be true before each cutover?', 'How do we make the cutover seamless for a large customer base?'],
    outcomes: ['Dependencies made visible', 'Readiness validated early', 'Assumptions challenged', 'Cutover risk reduced'],
    summary: 'At E2open, the cloud transformation required more than a migration plan: it needed a shared view of application, infrastructure, network and database readiness before each cutover.'
  },
  sap: {
    title: 'Chris protects business continuity.',
    inputs: ['Business-critical SAP ERP', 'Three organisations', 'VPN and firewall changes', 'End-to-end integration testing'],
    questions: ['Where do ownership and release cycles diverge?', 'Is the production connectivity proven?', 'What would continuity look like at switchover?'],
    outcomes: ['Technical workshops aligned teams', 'Connectivity validated', 'Monitoring confirmed', 'Implementation risk reduced'],
    summary: 'For SYSCO UK (Brakes) and Capgemini, the SAP transition worked because technical readiness and operational continuity were treated as the same conversation.'
  },
  security: {
    title: 'Chris makes secure change workable.',
    inputs: ['3,000+ customer integrations', 'Legacy HTTP and FTP', 'Customer firewall rules', 'Change windows across customers'],
    questions: ['Which connection paths need proving?', 'Which customers need action before retirement?', 'How can security improve without avoidable disruption?'],
    outcomes: ['Migration paths validated', 'Customer teams engaged', 'Legacy services retired', 'Production security improved', 'Middleware DR site built and tested'],
    summary: 'At E2open, modernising thousands of integrations relied on bringing network, application and customer engineering into one dependable migration process.'
  },
  connectivity: {
    title: 'Chris turns connectivity into readiness.',
    inputs: ['New cloud-hosted platform', 'Heineken UK', 'VPN implementation', 'Production data exchange'],
    questions: ['Is every link in the production path confirmed?', 'Who owns each validation step?', 'Is monitoring ready for handover?'],
    outcomes: ['VPN and connectivity verified', 'End-to-end exchange proven', 'Operational acceptance achieved', 'Post-implementation monitoring confirmed a successful cutover'],
    summary: 'For Heineken UK, the goal was not merely a working connection, but secure production connectivity that was monitored, accepted and ready to operate.'
  },
  incident: {
    title: 'Chris brings the right response together.',
    inputs: ['24/7 Priority 1 rota', 'Tier 1 enterprise customers', 'Cross-functional specialists', 'Time-critical customer communication'],
    questions: ['Which expertise will test the leading assumption?', 'What evidence changes the next decision?', 'What does the customer need to know now?'],
    outcomes: ['Technical bridge assembled and coordinated', 'Specialists directed through the investigation', 'Customers and senior leadership kept informed throughout', 'Root cause and recovery driven faster'],
    summary: 'Across seven years leading E2open’s Priority 1 technical response, the work was to assemble the right specialists, coordinate the bridge and accelerate resolution.'
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
  const contactFields = contactForm.querySelectorAll('input:not([type="hidden"]):not([name="company_url"]), textarea, select');

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

  const contactEmail = contactForm.querySelector('#contact-email');
  let emailFeedbackTimer;
  contactEmail.addEventListener('input', () => {
    window.clearTimeout(emailFeedbackTimer);
    if (!contactEmail.value) return;
    if (!contactEmail.validity.valid) {
      setContactStatus('Please complete a valid email address.', 'error');
      return;
    }
    setContactStatus('Thank you — email address looks good.', 'ready');
    emailFeedbackTimer = window.setTimeout(() => {
      if (contactEmail.validity.valid) setContactStatus('', '');
    }, 1800);
  });

  function showOpportunitySuccess(sent) {
    const panel = document.querySelector('[data-form-success]');
    if (!panel) return;
    const heading = panel.querySelector('h3');
    if (heading) heading.textContent = sent
      ? 'Thank you — your opportunity has been sent.'
      : 'Your email is ready — just press send in your mail app.';
    contactForm.hidden = true;
    panel.hidden = false;
    panel.focus();
  }

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Honeypot — silently ignore automated submissions.
    const honeypot = contactForm.querySelector('[name="company_url"]');
    if (honeypot && honeypot.value) return;

    const emailValue = contactEmail.value.trim();
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
    if (!contactForm.checkValidity() || !emailIsValid) {
      contactFields.forEach((field) => field.setAttribute('aria-invalid', String(!field.validity.valid)));
      contactEmail.setAttribute('aria-invalid', String(!emailIsValid));
      setContactStatus('Please complete the required fields (*) with a valid email.', 'error');
      contactForm.reportValidity();
      return;
    }

    const formData = new FormData(contactForm);
    const token = formData.get('cf-turnstile-response');
    if (!token) {
      setContactStatus('Please complete the security check before sending.', 'error');
      return;
    }

    // Web3Forms access key (public-safe — only ever delivers to the configured inbox).
    const FORM_ACCESS_KEY = '4fe26891-092d-446f-992a-8da7191816fb';

    contactSubmit.disabled = true;
    setContactStatus('Sending your opportunity…');
    try {
      // 1) Server-side spam verification (existing Turnstile worker).
      const verifyRes = await fetch('https://turnstile-siteverify-chrisdemetriou.christian4collective.workers.dev/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const verification = await verifyRes.json();
      if (!verifyRes.ok || verification.success !== true) {
        setContactStatus('The security check did not complete. Please try again.', 'error');
        contactSubmit.disabled = false;
        return;
      }

      if (FORM_ACCESS_KEY) {
        // 2a) Real delivery via Web3Forms.
        formData.append('access_key', FORM_ACCESS_KEY);
        formData.append('subject', 'New opportunity via chrisdemetriou.com');
        formData.append('from_name', 'chrisdemetriou.com');
        formData.delete('company_url');
        const sendRes = await fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Accept': 'application/json' }, body: formData
        });
        const out = await sendRes.json();
        if (!sendRes.ok || out.success !== true) throw new Error('send-failed');
        showOpportunitySuccess(true);
      } else {
        // 2b) Not yet configured → open a prefilled email (address assembled at runtime, not in page source).
        const to = atob('VGVjaE9wc01nbXRAY2hyaXNkZW1ldHJpb3UuY29t');
        const g = (n) => (formData.get(n) || '').toString();
        const body = [
          'Opportunity: ' + g('opportunity_title'),
          'Organisation: ' + g('organisation'),
          'Engagement: ' + (g('engagement_type') || 'Not decided'),
          'Working model: ' + (g('working_model') || 'No preference'),
          'Expected start: ' + (g('start_date') || '—'),
          'Job description: ' + (g('jd_url') || '—'),
          '', g('message'), '',
          'From: ' + g('name') + ' <' + emailValue + '>'
        ].join('\n');
        window.location.href = 'mailto:' + to +
          '?subject=' + encodeURIComponent('Opportunity: ' + g('opportunity_title')) +
          '&body=' + encodeURIComponent(body);
        showOpportunitySuccess(false);
      }
    } catch {
      setContactStatus('Sorry — we couldn’t send that. Please try again, or use the Reveal email button above.', 'error');
      contactSubmit.disabled = false;
    }
  });
}

const cookieBanner = document.querySelector('[data-cookie-banner]');
const cookiePreferenceKey = 'cd-cookie-preference-v2';

if (cookieBanner) {
  let cookiePreference;
  try {
    cookiePreference = localStorage.getItem(cookiePreferenceKey);
  } catch {
    cookiePreference = null;
  }
  if (!cookiePreference) cookieBanner.hidden = false;

  function setCookiePreference(preference) {
    try {
      localStorage.setItem(cookiePreferenceKey, preference);
    } catch {
      // The banner still works in browsers that block local storage.
    }
    cookieBanner.hidden = true;
  }

  cookieBanner.querySelector('[data-cookie-essential]').addEventListener('click', () => setCookiePreference('essential'));
  cookieBanner.querySelector('[data-cookie-accept]').addEventListener('click', () => setCookiePreference('accepted'));
}

document.querySelector('[data-cookie-settings]')?.addEventListener('click', () => {
  try {
    localStorage.removeItem(cookiePreferenceKey);
  } catch {
    // Nothing to clear when local storage is unavailable.
  }
  if (cookieBanner) cookieBanner.hidden = false;
});

const ribbonMessage = document.querySelector('[data-ribbon-message]');

if (ribbonMessage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const ribbonMessages = [
    'Enterprise technology operations management for business-critical change.',
    'Experience across E2open, SYSCO, Heineken, Aviva and more.',
    'Operational readiness, dependency clarity and delivery confidence.'
  ];
  let ribbonIndex = 0;
  window.setInterval(() => {
    ribbonMessage.classList.add('is-changing');
    window.setTimeout(() => {
      ribbonIndex = (ribbonIndex + 1) % ribbonMessages.length;
      ribbonMessage.textContent = ribbonMessages[ribbonIndex];
      ribbonMessage.classList.remove('is-changing');
    }, 360);
  }, 4600);
}
