// auth.js — Authentication UI logic (frontend only)

/* =========================================
   TAB SWITCHING (LOGIN / REGISTER)
========================================= */

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.auth-tab');
  const panels = document.querySelectorAll('.auth-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = tab.dataset.tab === 'login'
        ? document.getElementById('loginPanel')
        : document.getElementById('registerPanel');

      target?.classList.add('active');
    });
  });
});

/* =========================================
   PASSWORD STRENGTH — ANIMATED BAR
========================================= */

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('registerPassword');
  const fill = document.getElementById('passwordStrengthFill');
  const text = document.getElementById('passwordStrengthText');

  if (!input || !fill || !text) return;

  input.addEventListener('input', () => {
    const val = input.value;
    let score = 0;

    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    let width = 0;
    let label = 'Weak';
    let color = '#ef4444';

    if (score === 1) width = 25;
    if (score === 2) {
      width = 50;
      label = 'Okay';
      color = '#facc15';
    }
    if (score === 3) {
      width = 75;
      label = 'Good';
      color = '#facc15';
    }
    if (score === 4) {
      width = 100;
      label = 'Strong';
      color = '#22c55e';
    }

    fill.style.width = width + '%';
    fill.style.backgroundColor = color;
    fill.style.boxShadow = `0 0 8px ${color}99`;
    text.textContent = label;
  });
});

/* =========================================
   TERMS CHECKBOX → OPEN MODALS
========================================= */

document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('agreeTerms');

  if (!checkbox) return;

  checkbox.addEventListener('click', (e) => {
    e.preventDefault(); // prevent auto-check

    // Open Terms & Privacy the SAME way links do
    window.open('html/terms.html', '_blank');
    window.open('html/privacy.html', '_blank');
  });
});

/* =========================================
   REGISTER VALIDATION (FRONTEND ONLY)
========================================= */

document.addEventListener('DOMContentLoaded', () => {
  const registerBtn = document.getElementById('registerBtn');

  if (!registerBtn) return;

  registerBtn.addEventListener('click', (e) => {
    const pwd = document.getElementById('registerPassword')?.value || '';
    const confirm = document.getElementById('registerConfirmPassword')?.value || '';
    const checkbox = document.getElementById('agreeTerms');

    if (pwd !== confirm) {
      alert('Passwords do not match.');
      e.preventDefault();
      return;
    }

    if (!checkbox?.checked) {
      alert('Please review and accept the Terms & Privacy Policy.');
      e.preventDefault();
      return;
    }
  });
});
