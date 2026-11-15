// Pours the blocks of #flow into fixed-size A4 pages, so every page gets its own header and
// footer (with a real, clickable link and the QR code) instead of relying on Chrome's header
// templates, which cannot hold links. A block with class "keep-next" never ends a page;
// one with class "break-before" always starts one.
// build.mjs calls window.__paginate() after fonts and images have loaded.
window.__paginate = function () {
  const shell = document.getElementById('page-shell');
  const cover = document.getElementById('cover');
  const pages = document.getElementById('pages');
  const blocks = Array.from(document.getElementById('flow').children);
  const overflows = (body) => body.scrollHeight > body.clientHeight + 1;
  function newPage(first) {
    const page = shell.content.firstElementChild.cloneNode(true);
    pages.appendChild(page);
    const body = page.querySelector('.page__body');
    if (first && cover) body.appendChild(cover.content.firstElementChild.cloneNode(true));
    return body;
  }
  let body = newPage(true);
  const problems = [];
  for (const b of blocks) {
    if (b.classList.contains('break-before') && body.children.length) body = newPage(false);
    body.appendChild(b);
    if (!overflows(body)) continue;
    const carry = [b];
    let prev = b.previousElementSibling;
    while (prev && prev.classList.contains('keep-next')) { carry.unshift(prev); prev = prev.previousElementSibling; }
    if (body.children.length === carry.length) { problems.push('block taller than a page: ' + b.textContent.slice(0, 60)); continue; }
    body = newPage(false);
    carry.forEach((el) => body.appendChild(el));
    if (overflows(body)) problems.push('block taller than a page: ' + b.textContent.slice(0, 60));
  }
  const all = pages.querySelectorAll('.page');
  all.forEach((p, i) => {
    p.querySelector('[data-page-n]').textContent = String(i + 1);
    p.querySelector('[data-page-total]').textContent = String(all.length);
  });
  return { pages: all.length, problems };
};
