'use strict';
window.PortfolioReady = (async () => {
  try {
    const response = await fetch(new URL('hi3d-content.json', document.baseURI), { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('content-unavailable');
    return window.PortfolioContent.validate(await response.json());
  } catch {
    const notice = document.createElement('div');
    notice.className = 'content-notice';
    notice.setAttribute('role', 'status');
    notice.textContent = '最新作品内容暂时无法加载，已展示基础内容。';
    const retry = document.createElement('a');
    retry.href = location.href;
    retry.textContent = '重新加载';
    retry.onclick = event => { event.preventDefault(); location.reload(); };
    notice.append(retry);
    document.body.append(notice);
    return null;
  }
})();
window.PortfolioView = {
  escape(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); },
  apply(content) {
    const paragraph = (selector, text) => {
      const node = document.querySelector(selector);
      node.textContent = text;
      node.classList.add('content-copy');
    };
    paragraph('.aboutlead', content.about.intro);
    paragraph('.aboutinfo > div:nth-child(1) > p:last-child', content.about.background);
    paragraph('.aboutinfo > div:nth-child(2) > p:last-child', content.about.skills);
    paragraph('.aboutinfo > div:nth-child(3) > p:last-child', content.about.experience || '实习和项目经历待补充');
    const experience = document.querySelector('.aboutinfo > div:nth-child(3)');
    if (content.resume.path) {
      const anchor = document.createElement('a');
      anchor.className = 'textlink content-resume';
      anchor.href = content.resume.path;
      anchor.download = 'hi3d-zhangyuanyuan-resume.pdf';
      anchor.textContent = content.resume.label + ' ↓';
      experience.append(anchor);
    } else {
      const pending = document.createElement('p');
      pending.className = 'placeholder';
      pending.textContent = '简历文件待上传，暂不提供下载';
      experience.append(pending);
    }
    const information = document.querySelectorAll('#contact > div:last-child > p');
    const setContact = (node, text, url) => {
      node.replaceChildren();
      if (!url) { node.textContent = text; return; }
      node.className = '';
      const anchor = document.createElement('a');
      anchor.textContent = text;
      anchor.href = url;
      if (url.startsWith('https:')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
      node.append(anchor);
    };
    setContact(information[0], content.contact.email || '邮箱：待补充', content.contact.email ? 'mailto:' + content.contact.email : '');
    setContact(information[1], content.contact.socialLabel || (content.contact.socialUrl ? '社交主页 ↗' : '社交平台：待补充'), content.contact.socialUrl);
    if (content.contact.email || content.contact.socialUrl) document.querySelector('#contact > div:first-child > .muted').textContent = '欢迎交流 AI 产品、设计与新的创作。';
    const total = content.projects.length + content.extraProjects.length;
    if (total !== 6) {
      document.querySelector('#works .heading .muted').textContent = `关于 AI 产品、交互与创作的 ${total} 个实践。`;
      document.querySelector('#works .heading > .eyebrow').textContent = `01 — ${String(total).padStart(2, '0')} / SELECTED WORK`;
    }
  }
};
document.addEventListener('error', event => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.classList.contains('content-cover')) return;
  const fallback = document.createElement('span');
  fallback.className = 'content-cover-error';
  fallback.textContent = '作品封面暂时无法加载，请刷新重试。';
  image.replaceWith(fallback);
}, true);
