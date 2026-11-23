// 목차에서 지금 읽는 섹션을 표시한다. JS가 없어도 목차 링크는 그대로 동작한다.
const links = [...document.querySelectorAll('.toc a[href^="#"]')];
const targets = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
if ('IntersectionObserver' in window && targets.length) {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach(a => a.setAttribute('aria-current', a.hash === '#' + e.target.id ? 'true' : 'false'));
    }
  }, { rootMargin: '-15% 0px -75% 0px' });
  targets.forEach(t => io.observe(t));
}
