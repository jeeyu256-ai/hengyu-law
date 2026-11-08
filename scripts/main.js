/* ============================================================
   衡与律师事务所 · 交互脚本
   纯原生实现：导航状态、章节高亮、滚动入场、业务领域选项卡、表单校验
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. 吸顶导航的滚动状态 ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 2. 移动端导航 ---------- */
  const nav = document.getElementById('primaryNav');
  const toggle = document.getElementById('navToggle');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 960) setMenu(false); }, { passive: true });

  /* ---------- 3. 滚动入场（只触发一次） ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => revealObserver.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 4. 当前章节高亮 ---------- */
  const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('is-current', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-38% 0px -56% 0px' });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- 5. 业务领域选项卡（含完整键盘支持） ---------- */
  const tablist = document.getElementById('practiceTabs');
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('.practice__panel'));

  const activateTab = (index, moveFocus) => {
    const i = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, n) => {
      const active = n === i;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel, n) => {
      const active = n === i;
      panel.hidden = !active;
      // 重新触发一次入场动画：先移除类，强制回流后再加上
      panel.classList.remove('is-active');
      if (active) {
        void panel.offsetWidth;
        panel.classList.add('is-active');
      }
    });
    if (moveFocus) tabs[i].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(i, false));
    tab.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown': e.preventDefault(); activateTab(i + 1, true); break;
        case 'ArrowLeft':
        case 'ArrowUp': e.preventDefault(); activateTab(i - 1, true); break;
        case 'Home': e.preventDefault(); activateTab(0, true); break;
        case 'End': e.preventDefault(); activateTab(tabs.length - 1, true); break;
        default: break;
      }
    });
  });

  /* ---------- 6. 咨询表单：校验 / 错误 / 加载 / 成功 ---------- */
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnLabel = submitBtn.querySelector('.btn__label');
  const status = document.getElementById('formStatus');

  const rules = [
    { id: 'f-name', check: (v) => v.trim().length > 0, message: '请填写您的称呼' },
    { id: 'f-email', check: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), message: '请填写有效的电子邮箱' },
    { id: 'f-topic', check: (v) => v !== '', message: '请选择咨询事项' },
    { id: 'f-message', check: (v) => v.trim().length >= 10, message: '请至少用 10 个字简述情况' }
  ];

  const showStatus = (text, isError) => {
    status.textContent = text;
    status.hidden = false;
    status.classList.toggle('is-error', Boolean(isError));
  };

  rules.forEach((rule) => {
    const input = document.getElementById(rule.id);
    input.addEventListener('input', () => {
      const field = input.closest('.field');
      const errorEl = document.getElementById('e-' + rule.id.slice(2));
      if (rule.check(input.value)) {
        field.classList.remove('is-invalid');
        errorEl.textContent = '';
        input.removeAttribute('aria-invalid');
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.hidden = true;
    let firstInvalid = null;

    rules.forEach((rule) => {
      const input = document.getElementById(rule.id);
      const field = input.closest('.field');
      const errorEl = document.getElementById('e-' + rule.id.slice(2));
      const valid = rule.check(input.value);
      field.classList.toggle('is-invalid', !valid);
      errorEl.textContent = valid ? '' : rule.message;
      if (valid) input.removeAttribute('aria-invalid');
      else { input.setAttribute('aria-invalid', 'true'); if (!firstInvalid) firstInvalid = input; }
    });

    if (firstInvalid) {
      showStatus('表单尚有 ' + rules.filter((r) => !r.check(document.getElementById(r.id).value)).length + ' 处需要补充，请检查标红项。', true);
      firstInvalid.focus();
      return;
    }

    // 演示站点的提交态：正式上线时在此处接入邮件或 CRM 接口
    submitBtn.disabled = true;
    btnLabel.textContent = '提交中…';
    window.setTimeout(() => {
      submitBtn.disabled = false;
      btnLabel.textContent = '提交咨询';
      showStatus('已收到您的咨询信息。对应领域的合伙人会在一个工作日内与您联系。', false);
      form.reset();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      status.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }, 900);
  });
})();
