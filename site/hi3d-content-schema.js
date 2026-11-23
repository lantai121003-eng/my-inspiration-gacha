(function (root) {
  'use strict';
  const coreIds = ['ai-fashion-saas', 'real-business-product', 'ai-3d-customization', 'birthday-website', 'photography', 'match-3-game'];
  const categories = ['AI PRODUCTS', 'EXPERIMENTS', 'CREATIVE WORKS'];
  const sectionKeys = ['overview', 'problem', 'thinking', 'design', 'outcome', 'materials'];
  function text(value, label, maximum = 6000, required = false) {
    if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) || (required && !value.trim())) throw new Error(`${label}为空、过长或包含无效字符`);
    return value.trim();
  }
  function asset(value, kind) {
    const result = text(value, '素材路径', 180);
    const pattern = kind === 'resume' ? /^assets\/hi3d-[a-z0-9-]+\.pdf$/ : /^assets\/hi3d-[a-z0-9-]+\.(png|jpg|webp)$/;
    if (result && !pattern.test(result)) throw new Error('素材路径无效，请通过管理台上传文件');
    return result;
  }
  function link(value) {
    const result = text(value, '外部链接', 1000);
    if (result) {
      let parsed;
      try { parsed = new URL(result); } catch { throw new Error('外部链接需要完整的 https:// 地址'); }
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('外部链接只支持不含账号密码的 HTTPS 地址');
    }
    return result;
  }
  function project(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('项目数据格式不正确');
    const output = { id: text(value.id, '项目标识', 80, true) };
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(output.id)) throw new Error('项目标识只能使用小写字母、数字和连字符');
    for (const field of ['title', 'english', 'type', 'description', 'role', 'focus', 'symbol']) output[field] = text(value[field], field, field === 'description' || field === 'focus' ? 1200 : 160, ['title', 'description'].includes(field));
    if (!categories.includes(value.category)) throw new Error('请选择有效的项目分类');
    output.category = value.category;
    for (const field of ['color', 'pale', 'bg']) {
      if (!/^#[0-9a-f]{6}$/i.test(value[field])) throw new Error('项目配色格式不正确');
      output[field] = value[field];
    }
    output.cover = asset(value.cover || '', 'cover');
    output.demoUrl = link(value.demoUrl || '');
    output.sections = {};
    for (const field of sectionKeys) output.sections[field] = text(value.sections?.[field] || '', field, 12000);
    return output;
  }
  function validate(value) {
    if (!value || value.schemaVersion !== 1) throw new Error('不支持的配置版本，请导入当前管理台导出的配置');
    if (!Array.isArray(value.projects) || value.projects.length !== 6) throw new Error('必须保留六个核心扭蛋作品');
    const projects = value.projects.map(project);
    if (projects.some((item, index) => item.id !== coreIds[index])) throw new Error('六个核心扭蛋的标识和顺序不能修改');
    if (!Array.isArray(value.extraProjects) || value.extraProjects.length > 60) throw new Error('收藏区附加作品最多支持 60 个');
    const extraProjects = value.extraProjects.map(project);
    const ids = projects.concat(extraProjects).map(item => item.id);
    if (new Set(ids).size !== ids.length) throw new Error('项目标识不能重复');
    const about = {};
    for (const field of ['intro', 'background', 'skills', 'experience']) about[field] = text(value.about?.[field], field);
    const contact = { email: text(value.contact?.email, '邮箱', 254), socialLabel: text(value.contact?.socialLabel, '社交平台名称', 120), socialUrl: link(value.contact?.socialUrl || '') };
    if (contact.email && !/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(contact.email)) throw new Error('请填写有效的邮箱地址');
    return { schemaVersion: 1, projects, extraProjects, about, contact, resume: { path: asset(value.resume?.path || '', 'resume'), label: text(value.resume?.label || '下载简历 PDF', '简历链接名称', 80, true) } };
  }
  function references(value) {
    return [...new Set(value.projects.concat(value.extraProjects).map(item => item.cover).concat(value.resume.path).filter(Boolean))];
  }
  const api = Object.freeze({ validate, asset, references, coreIds, categories, sectionKeys });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PortfolioContent = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
