const revealItems = document.querySelectorAll('.reveal');
const navLinks = document.querySelectorAll('.main-nav a');
const today = document.getElementById('today');
const hero = document.querySelector('.hero');

const now = new Date();
if (today) {
  today.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 更新`;
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item, i) => {
  item.style.transitionDelay = `${i * 80}ms`;
  revealObserver.observe(item);
});

const sectionMap = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === id);
      });
    });
  },
  { threshold: 0.4 }
);

sectionMap.forEach((section) => activeObserver.observe(section));

if (hero) {
  window.addEventListener('mousemove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 8;
    const y = (event.clientY / window.innerHeight - 0.5) * 8;
    hero.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
  });
}
