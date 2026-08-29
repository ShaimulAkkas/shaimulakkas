/* ════════════════════════════════════════
   ADMIN.JS — Portfolio CMS Logic
   ════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Password Hash (SHA-256 of "portfolio2024") ──
  // To change password: run sha256("your-password") in browser console
  const PASSWORD_HASH = '5e3d0e63f60a7b5c1c9b8e3f7a2d4c6b8e0f3a5d7c9b1e4f6a8d2c5b7e9f1a3d';
  const SESSION_KEY = 'portfolio_admin_auth';

  // Resolve data path relative to admin folder
  function resolveDataPath(file) {
    // Works both on GitHub Pages (/shaimulakkas/data/) and locally (../data/)
    const isLive = location.hostname === 'shaimulakkas.github.io';
    return isLive ? `/shaimulakkas/data/${file}` : `../data/${file}`;
  }

  // ── Elements ──
  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const adminPanel = document.getElementById('admin-panel');
  const logoutBtn = document.getElementById('logout-btn');
  const blogListAdmin = document.getElementById('blog-list-admin');
  const projectsListAdmin = document.getElementById('projects-list-admin');
  const addBlogBtn = document.getElementById('add-blog-btn');
  const addProjectBtn = document.getElementById('add-project-btn');
  const blogEditor = document.getElementById('blog-editor');
  const projectEditor = document.getElementById('project-editor');
  const editorEmpty = document.getElementById('editor-empty');

  // ── Quill Instances ──
  let blogQuill, challengeQuill, approachDescQuill, resultsQuill, extrasQuill;

  function initQuillEditors() {
    const toolbarOptions = [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image', 'video'],
      ['clean']
    ];

    blogQuill = new Quill('#blog-quill-editor', {
      theme: 'snow',
      placeholder: 'Write your blog post content here...',
      modules: { toolbar: toolbarOptions }
    });

    challengeQuill = new Quill('#proj-challenge-editor', {
      theme: 'snow',
      placeholder: 'Describe the challenge...',
      modules: { toolbar: [['bold', 'italic'], ['link']] }
    });

    approachDescQuill = new Quill('#proj-approach-desc-editor', {
      theme: 'snow',
      placeholder: 'Describe your approach...',
      modules: { toolbar: [['bold', 'italic'], ['link']] }
    });

    resultsQuill = new Quill('#proj-results-editor', {
      theme: 'snow',
      placeholder: 'Describe the results...',
      modules: { toolbar: [['bold', 'italic'], ['link']] }
    });

    extrasQuill = new Quill('#proj-extras-editor', {
      theme: 'snow',
      placeholder: 'Add extra sections (architecture, highlights, tech stack, etc.) as HTML...',
      modules: { toolbar: [['bold', 'italic'], ['link', 'image'], ['code-block']] }
    });
  }

  // ── Auth ──
  async function hashPassword(pwd) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    const pwd = loginPassword.value;
    const hash = await hashPassword(pwd);

    // Simple comparison (in production, use server-side auth)
    if (pwd === 'portfolio2024' || hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      showAdmin();
    } else {
      loginError.textContent = 'Incorrect password. Hint: try "portfolio2024"';
      loginPassword.value = '';
    }
  }

  function checkAuth() {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      showAdmin();
    }
  }

  function showAdmin() {
    loginScreen.style.display = 'none';
    adminPanel.classList.remove('hidden');
    initQuillEditors();
    loadAllData();
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  }

  // ── Data Loading ──
  let blogData = [];
  let projectsData = [];

  // Embedded data — updated whenever admin saves new JSON
  const EMBEDDED_BLOG = [{"slug":"getting-started-networking","title":"Getting Started with Computer Networking","date":"2026-08-25","excerpt":"An introduction to networking fundamentals — from LAN setup to understanding the OSI model and TCP/IP protocols.","thumbnail":"","tags":["networking","beginner"],"\x63ontent":"\x3cp\x3eComputer networking is the backbone of modern IT infrastructure. Whether you're setting up a small home network or configuring enterprise-grade systems, understanding the fundamentals is essential.\x3c/p\x3e"}];

  async function loadAllData() {
    // Try fetching from data/ folder first (works on live site or with local server)
    try {
      const isLive = location.hostname === 'shaimulakkas.github.io';
      const basePath = isLive ? '/shaimulakkas' : '..';
      const [blogRes, projRes] = await Promise.all([
        fetch(`${basePath}/data/blog.json`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch(`${basePath}/data/projects.json`).then(r => { if (!r.ok) throw new Error(); return r.json(); })
      ]);
      blogData = blogRes;
      projectsData = projRes;
    } catch (e) {
      // Fallback: try relative path
      try {
        const [blogRes, projRes] = await Promise.all([
          fetch('../data/blog.json').then(r => r.json()),
          fetch('../data/projects.json').then(r => r.json())
        ]);
        blogData = blogRes;
        projectsData = projRes;
      } catch (e2) {
        showToast('Cannot load files via fetch. Try opening via a local server instead of file://', true);
        blogData = [];
        projectsData = [];
      }
    }
    renderBlogList();
    renderProjectsList();
  }

  function renderBlogList() {
    blogListAdmin.innerHTML = blogData.map((post, i) => `
      <li data-index="${i}">
        <span class="list-item-title">${esc(post.title)}</span>
        <button class="list-item-delete" data-type="blog" data-index="${i}" title="Delete">×</button>
      </li>
    `).join('');

    blogListAdmin.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', (e) => {
        if (e.target.classList.contains('list-item-delete')) return;
        openBlogEditor(parseInt(li.dataset.index));
      });
    });

    blogListAdmin.querySelectorAll('.list-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBlogPost(parseInt(btn.dataset.index));
      });
    });
  }

  function renderProjectsList() {
    projectsListAdmin.innerHTML = projectsData.map((proj, i) => `
      <li data-index="${i}">
        <span class="list-item-title">${esc(proj.title)}</span>
        <button class="list-item-delete" data-type="project" data-index="${i}" title="Delete">×</button>
      </li>
    `).join('');

    projectsListAdmin.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', (e) => {
        if (e.target.classList.contains('list-item-delete')) return;
        openProjectEditor(parseInt(li.dataset.index));
      });
    });

    projectsListAdmin.querySelectorAll('.list-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteProject(parseInt(btn.dataset.index));
      });
    });
  }

  // ── Blog Editor ──
  let currentBlogIndex = -1;

  function openBlogEditor(index) {
    currentBlogIndex = index;
    editorEmpty.classList.add('hidden');
    projectEditor.classList.add('hidden');
    blogEditor.classList.remove('hidden');

    // Clear active states
    blogListAdmin.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    projectsListAdmin.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    if (index >= 0) {
      blogListAdmin.querySelector(`li[data-index="${index}"]`)?.classList.add('active');
    }

    const post = index >= 0 ? blogData[index] : null;
    document.getElementById('blog-editor-title').textContent = post ? 'Edit Blog Post' : 'New Blog Post';
    document.getElementById('blog-delete-btn').style.display = post ? '' : 'none';

    document.getElementById('blog-title-input').value = post ? post.title : '';
    document.getElementById('blog-slug-input').value = post ? post.slug : '';
    document.getElementById('blog-date-input').value = post ? post.date : new Date().toISOString().split('T')[0];
    document.getElementById('blog-excerpt-input').value = post ? post.excerpt : '';
    document.getElementById('blog-thumbnail-input').value = post ? (post.thumbnail || '') : '';
    document.getElementById('blog-tags-input').value = post ? (post.tags || []).join(', ') : '';

    blogQuill.root.innerHTML = post ? post.content : '';
  }

  function saveBlogPost() {
    const title = document.getElementById('blog-title-input').value.trim();
    if (!title) { showToast('Title is required', true); return; }

    let slug = document.getElementById('blog-slug-input').value.trim();
    if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const post = {
      slug,
      title,
      date: document.getElementById('blog-date-input').value,
      excerpt: document.getElementById('blog-excerpt-input').value.trim(),
      thumbnail: document.getElementById('blog-thumbnail-input').value.trim(),
      tags: document.getElementById('blog-tags-input').value.split(',').map(t => t.trim()).filter(Boolean),
      content: blogQuill.root.innerHTML
    };

    if (currentBlogIndex >= 0) {
      blogData[currentBlogIndex] = post;
    } else {
      blogData.push(post);
    }

    downloadJSON('blog.json', blogData);
    renderBlogList();
    showToast('Blog post saved! Place blog.json in data/ folder.');
  }

  function deleteBlogPost(index) {
    if (!confirm(`Delete "${blogData[index].title}"?`)) return;
    blogData.splice(index, 1);
    downloadJSON('blog.json', blogData);
    renderBlogList();
    blogEditor.classList.add('hidden');
    editorEmpty.classList.remove('hidden');
    currentBlogIndex = -1;
    showToast('Blog post deleted.');
  }

  // ── Project Editor ──
  let currentProjectIndex = -1;

  function openProjectEditor(index) {
    currentProjectIndex = index;
    editorEmpty.classList.add('hidden');
    blogEditor.classList.add('hidden');
    projectEditor.classList.remove('hidden');

    // Clear active states
    blogListAdmin.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    projectsListAdmin.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    if (index >= 0) {
      projectsListAdmin.querySelector(`li[data-index="${index}"]`)?.classList.add('active');
    }

    const proj = index >= 0 ? projectsData[index] : null;
    document.getElementById('project-editor-title').textContent = proj ? 'Edit Project' : 'New Project';
    document.getElementById('project-delete-btn').style.display = proj ? '' : 'none';

    document.getElementById('proj-title-input').value = proj ? proj.title : '';
    document.getElementById('proj-slug-input').value = proj ? proj.slug : '';
    document.getElementById('proj-org-input').value = proj ? proj.org : '';
    document.getElementById('proj-role-input').value = proj ? proj.role : '';
    document.getElementById('proj-date-input').value = proj ? proj.date : '';
    document.getElementById('proj-scope-input').value = proj ? proj.scope : '';
    document.getElementById('proj-status-input').value = proj ? proj.status : 'Completed';
    document.getElementById('proj-hero-class-input').value = proj ? (proj.heroClass || 'project-hero-network') : 'project-hero-network';
    document.getElementById('proj-hero-icon-input').value = proj ? (proj.heroIcon || '') : '';
    document.getElementById('proj-tags-input').value = proj ? (proj.tags || []).join(', ') : '';

    // Stats
    if (proj && proj.stats) {
      document.getElementById('proj-stats-input').value = proj.stats.map(s =>
        `${s.value} | ${s.label} | ${s.count || ''}`
      ).join('\n');
    } else {
      document.getElementById('proj-stats-input').value = '';
    }

    // Steps
    if (proj) {
      const approach = proj.sections.find(s => s.title === 'My Approach');
      if (approach && approach.steps) {
        document.getElementById('proj-steps-input').value = approach.steps.map(s =>
          `${s.num} | ${s.title} | ${s.desc}`
        ).join('\n');
      } else {
        document.getElementById('proj-steps-input').value = '';
      }
    } else {
      document.getElementById('proj-steps-input').value = '';
    }

    // Quill editors
    if (proj) {
      const challenge = proj.sections.find(s => s.title === 'The Challenge');
      const approach = proj.sections.find(s => s.title === 'My Approach');
      const results = proj.sections.find(s => s.title === 'Results');

      challengeQuill.root.innerHTML = challenge ? challenge.content : '';
      approachDescQuill.root.innerHTML = approach ? approach.content : '';
      resultsQuill.root.innerHTML = results ? results.content : '';

      // Extras: everything else
      const extraSections = proj.sections.filter(s =>
        !['The Challenge', 'My Approach', 'Results', 'Technology Stack'].includes(s.title)
      );
      extrasQuill.root.innerHTML = extraSections.map(s => `<h3>${s.title}</h3>`).join('');
    } else {
      challengeQuill.root.innerHTML = '';
      approachDescQuill.root.innerHTML = '';
      resultsQuill.root.innerHTML = '';
      extrasQuill.root.innerHTML = '';
    }
  }

  function saveProject() {
    const title = document.getElementById('proj-title-input').value.trim();
    if (!title) { showToast('Title is required', true); return; }

    let slug = document.getElementById('proj-slug-input').value.trim();
    if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Parse stats
    const statsLines = document.getElementById('proj-stats-input').value.split('\n').filter(Boolean);
    const stats = statsLines.map(line => {
      const [value, label, count] = line.split('|').map(s => s.trim());
      const obj = { value, label };
      if (count && !isNaN(parseInt(count))) obj.count = parseInt(count);
      return obj;
    });

    // Parse steps
    const stepsLines = document.getElementById('proj-steps-input').value.split('\n').filter(Boolean);
    const steps = stepsLines.map(line => {
      const [num, title, desc] = line.split('|').map(s => s.trim());
      return { num, title, desc };
    });

    // Build sections
    const sections = [];
    const challengeContent = challengeQuill.root.innerHTML;
    if (challengeContent && challengeContent !== '<p><br></p>') {
      sections.push({ title: 'The Challenge', content: challengeContent });
    }

    const approachContent = approachDescQuill.root.innerHTML;
    if (steps.length > 0 || (approachContent && approachContent !== '<p><br></p>')) {
      const approach = { title: 'My Approach', content: approachContent };
      if (steps.length > 0) approach.steps = steps;
      sections.push(approach);
    }

    const resultsContent = resultsQuill.root.innerHTML;
    if (resultsContent && resultsContent !== '<p><br></p>') {
      sections.push({ title: 'Results', content: resultsContent });
    }

    // Extras
    const extrasHtml = extrasQuill.root.innerHTML;
    if (extrasHtml && extrasHtml !== '<p><br></p>') {
      // Parse extras as raw HTML sections
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = extrasHtml;
      const h3s = tempDiv.querySelectorAll('h3');
      h3s.forEach(h3 => {
        const title = h3.textContent;
        let content = '';
        let next = h3.nextElementSibling;
        while (next && next.tagName !== 'H3') {
          content += next.outerHTML;
          next = next.nextElementSibling;
        }
        sections.push({ title, content });
      });
    }

    const project = {
      slug,
      title,
      org: document.getElementById('proj-org-input').value.trim(),
      role: document.getElementById('proj-role-input').value.trim(),
      date: document.getElementById('proj-date-input').value.trim(),
      scope: document.getElementById('proj-scope-input').value.trim(),
      status: document.getElementById('proj-status-input').value,
      heroClass: document.getElementById('proj-hero-class-input').value,
      heroIcon: document.getElementById('proj-hero-icon-input').value.trim(),
      stats,
      sections,
      tags: document.getElementById('proj-tags-input').value.split(',').map(t => t.trim()).filter(Boolean)
    };

    if (currentProjectIndex >= 0) {
      projectsData[currentProjectIndex] = project;
    } else {
      projectsData.push(project);
    }

    downloadJSON('projects.json', projectsData);
    renderProjectsList();
    showToast('Project saved! Place projects.json in data/ folder.');
  }

  function deleteProject(index) {
    if (!confirm(`Delete "${projectsData[index].title}"?`)) return;
    projectsData.splice(index, 1);
    downloadJSON('projects.json', projectsData);
    renderProjectsList();
    projectEditor.classList.add('hidden');
    editorEmpty.classList.remove('hidden');
    currentProjectIndex = -1;
    showToast('Project deleted.');
  }

  // ── Helpers ──
  function esc(str) {
    if (!str) return '';
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showToast(msg, isError) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function autoSlug(inputId, outputId) {
    const input = document.getElementById(inputId);
    const output = document.getElementById(outputId);
    input.addEventListener('input', () => {
      if (!output.dataset.manual) {
        output.value = input.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    });
    output.addEventListener('input', () => {
      output.dataset.manual = 'true';
    });
  }

  // ── Event Listeners ──
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', logout);
  addBlogBtn.addEventListener('click', () => openBlogEditor(-1));
  addProjectBtn.addEventListener('click', () => openProjectEditor(-1));

  document.getElementById('blog-save-btn').addEventListener('click', saveBlogPost);
  document.getElementById('blog-cancel-btn').addEventListener('click', () => {
    blogEditor.classList.add('hidden');
    editorEmpty.classList.remove('hidden');
    blogListAdmin.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    currentBlogIndex = -1;
  });
  document.getElementById('blog-delete-btn').addEventListener('click', () => {
    if (currentBlogIndex >= 0) deleteBlogPost(currentBlogIndex);
  });

  document.getElementById('project-save-btn').addEventListener('click', saveProject);
  document.getElementById('project-cancel-btn').addEventListener('click', () => {
    projectEditor.classList.add('hidden');
    editorEmpty.classList.remove('hidden');
    projectsListAdmin.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    currentProjectIndex = -1;
  });
  document.getElementById('project-delete-btn').addEventListener('click', () => {
    if (currentProjectIndex >= 0) deleteProject(currentProjectIndex);
  });

  autoSlug('blog-title-input', 'blog-slug-input');
  autoSlug('proj-title-input', 'proj-slug-input');

  // ── Init ──
  checkAuth();
})();
