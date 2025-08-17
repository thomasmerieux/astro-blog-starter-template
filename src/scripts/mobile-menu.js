/**
 * Mobile menu functionality
 * Handles mobile menu toggle, focus management, and accessibility
 */
function initMobileMenu() {
  const hamburger = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (!hamburger || !mobileMenu) return;

  // Remove existing event listeners to prevent duplicates
  hamburger.replaceWith(hamburger.cloneNode(true));
  const newHamburger = document.getElementById('mobile-menu-toggle');

  let isMenuOpen = false;
  let focusableElements = [];
  let firstFocusableElement = null;
  let lastFocusableElement = null;

  // Update focusable elements
  function updateFocusableElements() {
    focusableElements = Array.from(
      mobileMenu.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')
    );
    firstFocusableElement = focusableElements[0];
    lastFocusableElement = focusableElements[focusableElements.length - 1];
  }

  // Toggle menu
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    mobileMenu.classList.toggle('active');
    newHamburger.classList.toggle('active');
    newHamburger.setAttribute('aria-expanded', isMenuOpen);

    // Update hamburger animation
    const spans = newHamburger.querySelectorAll('span');
    if (isMenuOpen) {
      spans[0].style.transform = 'translateY(6px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
      
      // Focus management
      updateFocusableElements();
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
      
      // Return focus to hamburger button
      newHamburger.focus();
    }
  }

  // Close menu
  function closeMenu() {
    if (isMenuOpen) {
      toggleMenu();
    }
  }

  // Handle keyboard navigation
  function handleKeyDown(event) {
    if (!isMenuOpen) return;

    if (event.key === 'Escape') {
      closeMenu();
      return;
    }

    if (event.key === 'Tab') {
      // Trap focus within menu
      if (event.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          event.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          event.preventDefault();
          firstFocusableElement.focus();
        }
      }
    }
  }

  // Event listeners
  newHamburger.addEventListener('click', toggleMenu);
  document.addEventListener('keydown', handleKeyDown);

  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    if (isMenuOpen && !mobileMenu.contains(event.target) && !newHamburger.contains(event.target)) {
      closeMenu();
    }
  });

  // Close menu when clicking on mobile links
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 768 && isMenuOpen) {
      closeMenu();
    }
  });
}

// Initialize on DOM load and after view transitions
document.addEventListener('DOMContentLoaded', initMobileMenu);
document.addEventListener('astro:after-swap', initMobileMenu);