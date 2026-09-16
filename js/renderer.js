/* ════════════════════════════════════════
   RENDERER.JS — Dynamic Blog & Project Renderer
   ════════════════════════════════════════ */

const Renderer = (() => {
  'use strict';

  const isLive = location.hostname === 'shaimulakkas.github.io';
  const BASE = isLive ? '/shaimulakkas' : '';

  function dataPath(file) {
    return `${BASE}/data/${file}`;
  }

  function blogPostUrl(slug) {
    return `${BASE}/blog/post.html?slug=${slug}`;
  }

  function projectDetailUrl(slug) {
    return `${BASE}/projects/detail.html?slug=${slug}`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }

  function esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  /* ── Blog Listing ── */
  async function renderBlogList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const res = await fetch(dataPath('blog.json'));
      const posts = await res.json();

      posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      container.innerHTML = posts.map(post => `
        <a href="${blogPostUrl(post.slug)}" class="blog-card" style="text-decoration: none;">
          ${post.thumbnail ? `<img src="${esc(post.thumbnail)}" alt="${esc(post.title)}" class="blog-thumb">` : ''}
          <p class="blog-date">${formatDate(post.date)}</p>
          <p class="blog-title">${esc(post.title)}</p>
          <p class="blog-excerpt">${esc(post.excerpt)}</p>
          ${post.tags && post.tags.length ? `<div class="blog-tags">${post.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
          <span class="blog-link">Read More →</span>
        </a>
      `).join('');

      container.classList.add('stagger-children');
    } catch (e) {
      container.innerHTML = '<p style="color: var(--muted);">Failed to load blog posts.</p>';
    }
  }

  /* ── Blog Post Detail ── */
  async function renderBlogPost() {
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) return;

    const container = document.getElementById('post-content');
    const titleEl = document.getElementById('post-title');
    const dateEl = document.getElementById('post-date');
    if (!container) return;

    try {
      const res = await fetch(dataPath('blog.json'));
      const posts = await res.json();
      const post = posts.find(p => p.slug === slug);

      if (!post) {
        container.innerHTML = '<p>Post not found.</p>';
        return;
      }

      document.title = `${post.title} — Shaimul Akkas Shahin`;
      if (titleEl) titleEl.textContent = post.title;
      if (dateEl) dateEl.textContent = formatDate(post.date);

      let html = post.content;

      // Render tables from HTML if present
      container.innerHTML = html;

      // Re-init animations
      if (typeof initScrollAnimations === 'function') initScrollAnimations();
    } catch (e) {
      container.innerHTML = '<p style="color: var(--muted);">Failed to load post.</p>';
    }
  }

  /* ── Projects Listing ── */
  async function renderProjectsList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const res = await fetch(dataPath('projects.json'));
      const projects = await res.json();

      container.innerHTML = projects.map(p => `
        <a href="${projectDetailUrl(p.slug)}" class="project-card" style="text-decoration: none;">
          <div class="project-thumb ${p.heroClass || ''}"><span class="project-thumb-icon">${p.heroIcon || '📁'}</span></div>
          <div class="project-body">
            <p class="project-title">${esc(p.title)}</p>
            <p class="project-org">${esc(p.org)}</p>
            <ul class="project-details">
              ${p.sections.find(s => s.title === 'The Challenge') ? `<li>${esc(p.sections.find(s => s.title === 'The Challenge').content.replace(/<[^>]*>/g, '').substring(0, 120))}...</li>` : ''}
            </ul>
            <div class="tags">
              ${(p.tags || []).slice(0, 4).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
            </div>
          </div>
        </a>
      `).join('');

      container.classList.add('stagger-children');
    } catch (e) {
      container.innerHTML = '<p style="color: var(--muted);">Failed to load projects.</p>';
    }
  }

  /* ── Project Detail ── */
  async function renderProjectDetail() {
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) return;

    const container = document.getElementById('project-content');
    if (!container) return;

    try {
      const res = await fetch(dataPath('projects.json'));
      const projects = await res.json();
      const project = projects.find(p => p.slug === slug);

      if (!project) {
        container.innerHTML = '<p>Project not found.</p>';
        return;
      }

      document.title = `${project.title} — Shaimul Akkas Shahin`;

      const currentIdx = projects.indexOf(project);
      const prevProject = projects[(currentIdx - 1 + projects.length) % projects.length];
      const nextProject = projects[(currentIdx + 1) % projects.length];

      let html = '';

      // Breadcrumb
      html += `
        <nav class="breadcrumb animate-in" aria-label="Breadcrumb">
          <a href="${BASE}/index.html">Home</a>
          <span class="breadcrumb-sep">/</span>
          <a href="${BASE}/projects.html">Projects</a>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">${esc(project.title)}</span>
        </nav>
        <a href="${BASE}/projects.html" class="back-link animate-in">← Back to Projects</a>
      `;

      // Hero
      html += `
        <div class="project-hero ${esc(project.heroClass || '')} animate-in delay-1">
          <span class="project-hero-icon">${project.heroIcon || '📁'}</span>
        </div>
      `;

      // Title + meta
      html += `
        <div class="animate-in delay-2" style="margin-bottom: 2rem;">
          <h1 style="margin-bottom: 0.5rem;">${esc(project.title)}</h1>
          <p class="project-org" style="font-size: 0.88rem; margin-bottom: 0.8rem;">${esc(project.org)}</p>
          <div class="project-meta">
            <span class="meta-badge">📅 ${esc(project.date)}</span>
            <span class="meta-badge">👤 ${esc(project.role)}</span>
            <span class="meta-badge">🏫 ${esc(project.scope)}</span>
            <span class="meta-badge meta-badge-done">✅ ${esc(project.status)}</span>
          </div>
        </div>
      `;

      // Stats
      if (project.stats && project.stats.length) {
        html += '<div class="project-stats stagger-children">';
        project.stats.forEach(s => {
          html += `
            <div class="stat-card">
              <span class="stat-num" ${s.count ? `data-count="${s.count}"` : ''}>${s.count ? '0' : esc(s.value)}</span>
              ${s.count ? `<span class="stat-num">${esc(s.value.replace(String(s.count), ''))}</span>` : ''}
              <span class="stat-label">${esc(s.label)}</span>
            </div>
          `;
        });
        html += '</div>';
      }

      // Sections
      project.sections.forEach(sec => {
        html += `<div class="project-section animate-in">`;
        html += `<h3>${esc(sec.title)}</h3>`;

        if (sec.content) html += sec.content;

        if (sec.steps) {
          html += '<div class="approach-steps">';
          sec.steps.forEach(step => {
            html += `
              <div class="approach-step">
                <span class="step-num">${esc(step.num)}</span>
                <div>
                  <p class="step-title">${esc(step.title)}</p>
                  <p class="step-desc">${esc(step.desc)}</p>
                </div>
              </div>
            `;
          });
          html += '</div>';
        }

        if (sec.architecture) {
          const a = sec.architecture;
          html += `
            <div class="architecture-placeholder">
              <div class="arch-inner">
                <span class="arch-icon">${a.icon}</span>
                <p class="arch-title">${esc(a.title)}</p>
                <p class="arch-desc">${esc(a.desc)}</p>
                <div class="arch-diagram">
                  <div class="arch-node arch-core">${esc(a.core)}<br><small>${esc(a.coreSub)}</small></div>
                  <div class="arch-branches">
                    ${a.branches.map(b => `<div class="arch-node">${b.icon} ${esc(b.label)}<br><small>${esc(b.sub)}</small></div>`).join('')}
                  </div>
                </div>
                <p class="arch-note">${esc(a.note)}</p>
              </div>
            </div>
          `;
        }

        if (sec.highlights) {
          html += '<div class="highlights-grid">';
          sec.highlights.forEach(h => {
            html += `
              <div class="highlight-card">
                <span class="highlight-icon">${h.icon}</span>
                <div>
                  <p class="highlight-title">${esc(h.title)}</p>
                  <p class="highlight-desc">${esc(h.desc)}</p>
                </div>
              </div>
            `;
          });
          html += '</div>';
        }

        if (sec.techGroups) {
          sec.techGroups.forEach(g => {
            html += `
              <div class="tech-group">
                <p class="tech-group-label">${esc(g.label)}</p>
                <div class="tags">
                  ${g.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
                </div>
              </div>
            `;
          });
        }

        if (sec.config) {
          html += `
            ${sec.configNote ? `<p style="font-size: 0.88rem; color: var(--muted); margin-bottom: 1rem;">${esc(sec.configNote)}</p>` : ''}
            <div class="config-block">
              <div class="config-header">
                <span class="config-dot config-dot-red"></span>
                <span class="config-dot config-dot-yellow"></span>
                <span class="config-dot config-dot-green"></span>
                <span class="config-title">${esc(sec.config.filename)}</span>
              </div>
              <pre class="config-code"><code>${esc(sec.config.code)}</code></pre>
            </div>
          `;
        }

        if (sec.beforeAfter) {
          html += `
            <div class="before-after-grid">
              <div class="before-after-card">
                <div class="before-after-img placeholder-img placeholder-before">
                  <span>📸</span>
                  <p>${esc(sec.beforeAfter.before.label)}</p>
                </div>
                <p class="before-after-label">Before</p>
              </div>
              <div class="before-after-card">
                <div class="before-after-img placeholder-img placeholder-after">
                  <span>📸</span>
                  <p>${esc(sec.beforeAfter.after.label)}</p>
                </div>
                <p class="before-after-label">After</p>
              </div>
            </div>
          `;
        }

        if (sec.testimonial) {
          const t = sec.testimonial;
          html += `
            <div class="testimonial-card">
              <div class="testimonial-quote">
                <span class="testimonial-mark">"</span>
                <p>${esc(t.quote)}</p>
              </div>
              <div class="testimonial-author">
                <div class="testimonial-avatar placeholder-avatar"><span>👤</span></div>
                <div>
                  <p class="testimonial-name">${esc(t.name)}</p>
                  <p class="testimonial-role">${esc(t.role)}</p>
                </div>
              </div>
            </div>
          `;
        }

        html += '</div>';
      });

      // Prev/Next nav
      html += `
        <div class="project-nav">
          <a href="${projectDetailUrl(prevProject.slug)}" class="project-nav-link project-nav-prev">
            <span class="project-nav-dir">← Previous</span>
            <span class="project-nav-title">${esc(prevProject.title)}</span>
          </a>
          <a href="${projectDetailUrl(nextProject.slug)}" class="project-nav-link project-nav-next">
            <span class="project-nav-dir">Next →</span>
            <span class="project-nav-title">${esc(nextProject.title)}</span>
          </a>
        </div>
      `;

      container.innerHTML = html;

      // Re-init animations
      if (typeof initScrollAnimations === 'function') initScrollAnimations();
    } catch (e) {
      container.innerHTML = '<p style="color: var(--muted);">Failed to load project.</p>';
    }
  }

  return {
    renderBlogList,
    renderBlogPost,
    renderProjectsList,
    renderProjectDetail
  };
})();
