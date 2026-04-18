// ========================
// i18n ENGINE
// ========================
let currentLang = localStorage.getItem('hisabkitab_lang') || 'hi-hg';

function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations[currentLang];
  
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      // Fallback to English if key not found in current language
      let fallback = translations['en'];
      for (const fk of keys) {
        if (fallback && fallback[fk]) {
          fallback = fallback[fk];
        } else {
          fallback = key; // Ultimate fallback to key itself
          break;
        }
      }
      value = fallback;
      break;
    }
  }

  // Replace params like {name} or {amount}
  Object.keys(params).forEach(p => {
    value = value.replace(`{${p}}`, params[p]);
  });

  return value;
}

function updateDOMTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    
    // Handle placeholders
    if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
      el.setAttribute('placeholder', translation);
    } else {
      // Preserve icons if they exist (usually at the start of strings)
      const hasIcon = el.innerHTML.match(/^[\u2000-\u32ff]|🏠|👷|✅|💸|🧱|📊|⚙️|☀️|🌙|📅|⚡|📋|✏️|🗑|✕|✓|✗|½|⏰|📲|🖨️|⚠️|⬇️|⬆️|🔑|👆|🗑️|💡/);
      if (hasIcon) {
        const icon = hasIcon[0];
        // If the original text had an icon, we might want to keep it
        // However, some translations might already include icons.
        // Let's check if the translation already starts with an icon.
        const transHasIcon = translation.match(/^[\u2000-\u32ff]|🏠|👷|✅|💸|🧱|📊|⚙️|☀️|🌙|📅|⚡|📋|✏️|🗑|✕|✓|✗|½|⏰|📲|🖨️|⚠️|⬇️|⬆️|🔑|👆|🗑️|💡/);
        if (transHasIcon) {
          el.innerHTML = translation;
        } else {
          // If translation doesn't have icon, but original did, prepend it
          // This is a bit tricky, better to just rely on translations providing icons where needed
          el.innerHTML = translation;
        }
      } else {
        el.innerHTML = translation;
      }
    }
  });

  // Update specific elements that might not have data-i18n but need updates
  // (e.g., skill options in select menus)
  updateSkillOptions();
}

function updateSkillOptions() {
  const skillSelects = ['w-skill', 'ew-skill'];
  skillSelects.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    
    Array.from(select.options).forEach(opt => {
      const skillKey = opt.value;
      if (translations[currentLang].skills[skillKey]) {
        opt.textContent = translations[currentLang].skills[skillKey];
      }
    });
  });
}

function changeLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('hisabkitab_lang', lang);
  
  // Update HTML lang attribute
  document.documentElement.setAttribute('lang', lang.split('-')[0]);
  
  updateDOMTranslations();
  
  // Update lang card UI
  updateLangCards();

  // Trigger any necessary re-renders in app.js
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderWorkers === 'function') renderWorkers();
  if (typeof renderAttendance === 'function') renderAttendance();
  if (typeof renderAdvances === 'function') renderAdvances();
  if (typeof renderMaterials === 'function') renderMaterials();
  if (typeof renderHisab === 'function') renderHisab();
  if (typeof setHeaderDate === 'function') setHeaderDate();
}

/**
 * Sync the language card buttons to reflect the current language
 */
function syncLangSelector() {
  updateLangCards();
}

function updateLangCards() {
  const opts = document.querySelectorAll('.lang-option');
  opts.forEach(btn => {
    const lang = btn.getAttribute('data-lang');
    if (lang === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Initial update on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts (app.js) to be ready
    setTimeout(() => {
        updateDOMTranslations();
        syncLangSelector();
    }, 50);
});
