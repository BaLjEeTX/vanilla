/* Active TOC highlight on scroll */
(function() {
  const tocLinks = document.querySelectorAll('aside.toc a');
  if (!tocLinks.length) return;

  const sections = Array.from(tocLinks).map(a => {
    const id = a.getAttribute('href').slice(1);
    return document.getElementById(id);
  }).filter(Boolean);

  function update() {
    const scrollY = window.scrollY + 120;
    let current = sections[0];
    for (const s of sections) {
      if (s.offsetTop <= scrollY) current = s;
    }
    tocLinks.forEach(a => {
      a.classList.toggle('active-toc', a.getAttribute('href') === '#' + current.id);
    });
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
