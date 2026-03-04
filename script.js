const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('#main-nav');
const navAnchors = document.querySelectorAll('.nav-links a');
const copyPhoneButton = document.querySelector('#copy-phone');
const copyFeedback = document.querySelector('#copy-feedback');
const yearNode = document.querySelector('#year');

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navAnchors.forEach((anchor) => {
    anchor.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (copyPhoneButton && copyFeedback) {
  copyPhoneButton.addEventListener('click', async () => {
    const phone = '(718) 387-9487';

    try {
      await navigator.clipboard.writeText(phone);
      copyFeedback.textContent = 'Phone number copied.';
    } catch {
      copyFeedback.textContent = 'Copy failed. Please dial (718) 387-9487.';
    }

    window.setTimeout(() => {
      copyFeedback.textContent = '';
    }, 2000);
  });
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealItems.length > 0) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}
