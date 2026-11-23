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
  linkLabel(project) { return project.linkLabel || window.PortfolioContent.linkTypes[project.linkType || 'demo']; },
  projectActions(project, className = '') {
    const escape = this.escape;
    const primary = project.demoUrl ? `<a class="button primary" href="${escape(project.demoUrl)}" target="_blank" rel="noopener noreferrer">${escape(this.linkLabel(project))} ↗</a>` : '';
    const resources = (project.resourceLinks || []).map(item => `<a class="button" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.label)} ↗</a>`).join('');
    return primary || resources ? `<div class="project-actions ${className}">${primary}${resources}</div>` : '';
  },
  experience(project, index) {
    if (!project.demoUrl || project.displayMode !== 'embed') return '';
    const escape = this.escape;
    const host = new URL(project.demoUrl).hostname;
    return `<section class="project-experience" aria-labelledby="experienceTitle"><div class="experience-heading"><div><p class="eyebrow">LIVE EXPERIENCE / 在线体验</p><h2 id="experienceTitle">不止看介绍，亲自试一试。</h2></div><a class="textlink" href="${escape(project.demoUrl)}" target="_blank" rel="noopener noreferrer">新窗口打开 ↗</a></div><div class="demo-browser"><div class="browser-bar"><span class="browser-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="browser-host">${escape(host)}</span><span class="browser-label">交互演示</span></div><div class="experience-stage" id="experienceStage">${project.cover ? `<img class="demo-poster" src="${escape(project.cover)}" alt="${escape(project.title)}页面预览" decoding="async">` : `<div class="demo-poster demo-placeholder" style="--art:${project.bg}"><span>${escape(project.symbol)}</span></div>`}</div><div class="experience-footer"><p id="experienceStatus" role="status">进入详情后自动连接演示；若原网站限制嵌入，请新窗口打开。</p><div class="experience-controls"><button class="button" id="reloadExperience" type="button">重新加载</button><button class="button" id="stopExperience" type="button">暂停演示</button></div></div></div></section>`;
  },
  bindExperience(project) {
    const stage = document.getElementById('experienceStage');
    if (!stage || !project.demoUrl || project.displayMode !== 'embed') return;
    const original = stage.innerHTML;
    const reload = document.getElementById('reloadExperience');
    const stop = document.getElementById('stopExperience');
    const status = document.getElementById('experienceStatus');
    const start = () => {
      const frame = document.createElement('iframe');
      frame.title = project.title + ' · 在线交互演示';
      frame.className = 'experience-frame';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
      frame.referrerPolicy = 'no-referrer';
      frame.allowFullscreen = true;
      frame.loading = 'eager';
      frame.src = project.demoUrl;
      stage.replaceChildren(frame);
      stage.classList.add('is-live');
      stop.hidden = false;
      reload.textContent = '重新加载';
      status.textContent = '已自动连接外部演示，无需点击加载。如遇空白、登录或布局限制，请使用「新窗口打开」。';
    };
    reload.onclick = start;
    stop.onclick = () => {
      stage.classList.remove('is-live');
      stage.innerHTML = original;
      stop.hidden = true;
      reload.textContent = '继续演示';
      status.textContent = '演示已暂停并释放页面。可继续演示，或在新窗口打开完整产品。';
      reload.focus({ preventScroll: true });
    };
    start();
  },
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
