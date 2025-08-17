/**
 * Language switcher functionality
 * Handles language selection and page navigation
 */
function initLanguageSwitcher() {
  document.addEventListener('DOMContentLoaded', function () {
    const selector = document.getElementById('language-selector');
    if (!selector) return;

    selector.addEventListener('change', function (e) {
      const selectedLang = e.target.value;
      const currentPath = window.location.pathname;

      // Extract the current page from path
      let currentPage = '';
      if (currentPath.includes('/schedule')) currentPage = 'schedule';
      else if (currentPath.includes('/venue')) currentPage = 'venue';
      else if (currentPath.includes('/accommodation')) currentPage = 'accommodation';
      else if (currentPath.includes('/qa')) currentPage = 'qa';
      else if (currentPath.includes('/rsvp')) currentPage = 'rsvp';

      // Build new URL and force full page reload
      if (selectedLang === 'en') {
        if (currentPage) {
          window.location.replace(`/${currentPage}`);
        } else {
          window.location.replace('/');
        }
      } else {
        if (currentPage) {
          window.location.replace(`/${selectedLang}/${currentPage}`);
        } else {
          window.location.replace(`/${selectedLang}/`);
        }
      }
    });
  });
}

// Initialize the language switcher
initLanguageSwitcher();