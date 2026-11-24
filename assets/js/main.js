/* ═══════════════════════════════════════════════════════════
   绘锦 HUIJIN ESTATE — 交互与动效
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, n) => a + (b - a) * n;

  /* ───────── 加载完成 ───────── */
  const finishLoad = () => document.documentElement.classList.add('is-loaded');
  window.addEventListener('load', () => setTimeout(finishLoad, 450), { once: true });
  setTimeout(finishLoad, 2600); // 兜底

  /* ───────── 首屏图片自动轮播 ───────── */
  const heroEl = $('.hero');
  const heroSlides = $$('.hero-slide');
  if (heroEl && heroSlides.length > 1) {
    const HERO_DELAY = 6000;
    const slideData = [
      { title: '河石庄园 · 山景别墅', meta: '北京 · 朝阳区 · 8 室 4 卫', thumb: 'assets/img/space-living.webp' },
      { title: '云顶宅邸 · 城市臻品', meta: '北京 · 海淀区 · 5 室 4 卫', thumb: 'assets/img/space-dining.webp' },
      { title: '湖畔别院 · 无边泳池', meta: '北京 · 顺义区 · 6 室 5 卫', thumb: 'assets/img/space-pool.webp' }
    ];
    const heroCard = $('#heroCard');
    const heroThumb = $('#heroThumb');
    const heroTitleEl = $('#heroCardTitle');
    const heroMetaEl = $('#heroCardMeta');
    const heroDots = $$('#heroDots .hero-dot');
    const heroPrev = $('#heroPrev');
    const heroNext = $('#heroNext');
    let heroIndex = 0;
    let heroTimer = null;
    let swapTimer = null;

    const syncDots = () => {
      heroDots.forEach((d, i) => {
        d.classList.toggle('is-active', i === heroIndex);
        d.setAttribute('aria-selected', String(i === heroIndex));
      });
    };

    const renderHeroCard = () => {
      const data = slideData[heroIndex] || slideData[0];
      heroCard.classList.add('is-swapping');
      clearTimeout(swapTimer);
      swapTimer = setTimeout(() => {
        heroTitleEl.textContent = data.title;
        heroMetaEl.textContent = data.meta;
        heroThumb.src = data.thumb;
        heroThumb.alt = `${data.title} 室内预览`;
        heroCard.classList.remove('is-swapping');
      }, 220);
    };

    const startHeroTimer = () => {
      clearInterval(heroTimer);
      heroEl.classList.remove('is-paused');
      if (reduceMotion.matches) return;
      heroTimer = setInterval(() => goHero(heroIndex + 1), HERO_DELAY);
    };

    function goHero(i, manual) {
      heroIndex = (i + heroSlides.length) % heroSlides.length;
      heroSlides.forEach((s, si) => s.classList.toggle('is-active', si === heroIndex));
      syncDots();
      renderHeroCard();
      if (manual) startHeroTimer();
    }

    const pauseHero = () => {
      clearInterval(heroTimer);
      heroEl.classList.add('is-paused');
    };
    const resumeHero = () => { if (!document.hidden) startHeroTimer(); };

    heroPrev.addEventListener('click', () => goHero(heroIndex - 1, true));
    heroNext.addEventListener('click', () => goHero(heroIndex + 1, true));
    heroDots.forEach((d, di) => {
      d.addEventListener('click', () => { if (di !== heroIndex) goHero(di, true); });
    });

    heroEl.addEventListener('pointerenter', pauseHero);
    heroEl.addEventListener('pointerleave', resumeHero);
    heroEl.addEventListener('focusin', pauseHero);
    heroEl.addEventListener('focusout', resumeHero);
    heroEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goHero(heroIndex + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goHero(heroIndex - 1, true); }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseHero(); else resumeHero();
    });

    syncDots();
    startHeroTimer();
  }

  /* ───────── 自定义光标 ───────── */
  if (!isTouch && !reduceMotion.matches) {
    const cursor = $('#cursor');
    const dot = $('.cursor-dot', cursor);
    const ring = $('.cursor-ring', cursor);
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add('is-visible');
      dot.style.translate = `${mx}px ${my}px`;
    }, { passive: true });

    const renderCursor = () => {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ring.style.translate = `${rx}px ${ry}px`;
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('a, button, [data-cursor], input, select, textarea, label');
      cursor.classList.toggle('is-hover', !!target);
      cursor.classList.toggle('is-view', !!(target && target.dataset.cursor === 'view'));
      cursor.classList.toggle('is-drag', !!(target && target.dataset.cursor === 'drag'));
    });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
  }

  /* ───────── 滚动进度 / 导航状态 ───────── */
  const header = $('#siteHeader');
  const scrollBar = $('#scrollBar');
  const toTop = $('#toTop');
  let lastScroll = -1;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    document.documentElement.classList.toggle('is-scrolled', y > 42);
    toTop.classList.toggle('is-visible', y > 640);
    lastScroll = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ───────── 返回上一页 ───────── */
  $$('[data-back]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (document.referrer && window.history.length > 1) window.history.back();
      else window.location.href = 'index.html';
    });
  });

  /* ───────── 移动端菜单 ───────── */
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  const closeNav = () => {
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '打开导航菜单');
  };
  navToggle.addEventListener('click', () => {
    const open = !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  });
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); });
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('nav-open')) return;
    if (e.target.closest('.nav-shell')) return;
    closeNav();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1024) closeNav(); });

  /* ───────── 滚动揭示 ───────── */
  const revealItems = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.dataset.delay || 0);
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('is-in');
        revealIO.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((el) => revealIO.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('is-in'));
  }

  /* ───────── 数字滚动 ───────── */
  const countEls = $$('[data-count]');
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1700;
    const start = performance.now();
    const step = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString('en-US').replace(/,/g, '') + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        countIO.unobserve(entry.target);
      });
    }, { threshold: 0.55 });
    countEls.forEach((el) => countIO.observe(el));
  } else {
    countEls.forEach((el) => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
  }

  /* ───────── 3D 倾斜 ───────── */
  if (!isTouch && !reduceMotion.matches) {
    $$('[data-tilt]').forEach((card) => {
      let raf = null;
      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 7}deg) translateY(-3px)`;
        });
      };
      const reset = () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = '';
      };
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', reset);
    });
  }

  /* ───────── 磁性按钮 ───────── */
  if (!isTouch && !reduceMotion.matches) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ───────── 视差 ───────── */
  const parallaxEls = $$('[data-parallax]');
  let parallaxRaf = null;
  const runParallax = () => {
    parallaxRaf = null;
    if (reduceMotion.matches) return;
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const speed = Number(el.dataset.parallax) || 0.1;
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const offset = (r.top + r.height / 2 - vh / 2) * speed * -1;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });
  };
  const requestParallax = () => { if (!parallaxRaf) parallaxRaf = requestAnimationFrame(runParallax); };
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax);

  /* ───────── 城市轮播 ───────── */
  const cityTrack = $('#cityTrack');
  if (cityTrack) {
    const prevBtn = $('#cityPrev');
    const nextBtn = $('#cityNext');
    const meter = $('#cityMeter');
    let dragging = false, startX = 0, startScroll = 0, moved = 0;

    const stepSize = () => {
      const card = cityTrack.querySelector('.city-card');
      if (!card) return 320;
      const gap = parseFloat(getComputedStyle(cityTrack).columnGap || '16') || 16;
      return card.getBoundingClientRect().width + gap;
    };

    const updateCarousel = () => {
      const max = cityTrack.scrollWidth - cityTrack.clientWidth;
      const ratio = max > 0 ? cityTrack.scrollLeft / max : 0;
      if (meter) meter.style.transform = `translateX(${ratio * 300}%)`;
      prevBtn.disabled = cityTrack.scrollLeft <= 2;
      nextBtn.disabled = cityTrack.scrollLeft >= max - 2;
    };

    prevBtn.addEventListener('click', () => cityTrack.scrollBy({ left: -stepSize(), behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => cityTrack.scrollBy({ left: stepSize(), behavior: 'smooth' }));
    cityTrack.addEventListener('scroll', updateCarousel, { passive: true });
    window.addEventListener('resize', updateCarousel);
    updateCarousel();

    cityTrack.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startScroll = cityTrack.scrollLeft;
      cityTrack.classList.add('is-dragging');
      cityTrack.setPointerCapture(e.pointerId);
    });
    cityTrack.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      cityTrack.scrollLeft = startScroll - dx;
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      cityTrack.classList.remove('is-dragging');
      if (cityTrack.hasPointerCapture?.(e.pointerId)) cityTrack.releasePointerCapture(e.pointerId);
      if (moved > 6) {
        const stop = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
        cityTrack.addEventListener('click', stop, { capture: true, once: true });
        setTimeout(() => cityTrack.removeEventListener('click', stop, { capture: true }), 60);
      }
    };
    cityTrack.addEventListener('pointerup', endDrag);
    cityTrack.addEventListener('pointercancel', endDrag);
    cityTrack.addEventListener('pointerleave', endDrag);
    cityTrack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevBtn.click(); }
    });
  }

  /* ───────── 客户评价轮播 ───────── */
  const track = $('#testiTrack');
  if (track) {
    const slides = $$('.testimonial', track);
    const dots = $$('.dot', $('#testiDots'));
    const shell = $('.testimonial-shell');
    let index = 0, timer = null;

    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => {
        d.classList.toggle('is-active', di === index);
        d.setAttribute('aria-selected', String(di === index));
      });
      slides.forEach((s, si) => s.setAttribute('aria-hidden', String(si !== index)));
    };
    const play = () => {
      stop();
      if (reduceMotion.matches) return;
      timer = setInterval(() => goTo(index + 1), 7000);
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

    $('#testiPrev').addEventListener('click', () => { goTo(index - 1); play(); });
    $('#testiNext').addEventListener('click', () => { goTo(index + 1); play(); });
    dots.forEach((d, di) => d.addEventListener('click', () => { goTo(di); play(); }));
    shell.addEventListener('pointerenter', stop);
    shell.addEventListener('pointerleave', play);
    shell.addEventListener('focusin', stop);
    shell.addEventListener('focusout', play);

    let touchX = 0;
    track.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; stop(); }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 46) goTo(index + (dx < 0 ? 1 : -1));
      play();
    });
    goTo(0);
    play();
  }

  /* ───────── FAQ 手风琴 ───────── */
  $$('.faq-item').forEach((item) => {
    const btn = $('.faq-q', item);
    btn.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      $$('.faq-item').forEach((other) => {
        other.classList.remove('is-open');
        $('.faq-q', other).setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ───────── 预约 / 登录弹窗 ───────── */
  const modal = $('#bookingModal');
  const form = $('#bookingForm');
  const success = $('#bookingSuccess');
  const authView = $('#bookingAuth');
  const formView = $('#bookingFormView');
  const loginForm = $('#loginForm');
  const registerForm = $('#registerForm');
  let lastFocused = null;

  const showView = (name) => {
    if (!authView || !formView) return;
    const isAuth = name === 'auth';
    authView.classList.toggle('is-active', isAuth);
    formView.classList.toggle('is-active', !isAuth);
    authView.setAttribute('aria-hidden', isAuth ? 'false' : 'true');
    formView.setAttribute('aria-hidden', isAuth ? 'true' : 'false');
  };

  const switchAuth = (which, focus = true) => {
    $$('.auth-tab', modal).forEach((tab) => {
      const on = tab.dataset.authTab === which;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (loginForm) loginForm.classList.toggle('is-active', which === 'login');
    if (registerForm) registerForm.classList.toggle('is-active', which === 'register');
    if (!focus) return;
    const pane = which === 'login' ? loginForm : registerForm;
    const first = pane && pane.querySelector('input');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 160);
  };

  const goHome = () => {
    const veilEl = $('.page-veil');
    try { sessionStorage.setItem('hj-veil', '1'); } catch (err) {}
    if (veilEl) {
      veilEl.classList.add('is-active');
      setTimeout(() => { window.location.href = 'index.html'; }, 660);
    } else {
      window.location.href = 'index.html';
    }
  };

  const redirecting = (f, text) => {
    const btn = f.querySelector('.auth-submit');
    if (btn) {
      btn.setAttribute('disabled', 'disabled');
      const span = btn.querySelector('span');
      if (span) span.textContent = text;
    }
    goHome();
  };

  const openModal = () => {
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    if (success) success.classList.remove('is-on');
    showView('auth');
    switchAuth('login', false);
    setTimeout(() => { const first = loginForm && loginForm.querySelector('input'); if (first) first.focus({ preventScroll: true }); }, 260);
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
  };

  $$('[data-open-booking]').forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
  $$('[data-close-booking]').forEach((btn) => btn.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* 视图切换：标签页 / 返回预约表单 */
  if (modal) {
    modal.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-auth-tab]');
      if (tab) { switchAuth(tab.dataset.authTab); return; }
      if (e.target.closest('[data-auth-back]')) {
        showView('form');
        const first = formView && formView.querySelector('input');
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 160);
      }
    });
  }

  /* 登录 */
  if (loginForm) {
    const phone = loginForm.querySelector('input[name="phone"]');
    phone.addEventListener('input', () => phone.setCustomValidity(''));
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!loginForm.checkValidity()) { loginForm.reportValidity(); return; }
      if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) {
        phone.setCustomValidity('请输入有效的手机号');
        phone.reportValidity();
        return;
      }
      redirecting(loginForm, '正在登录…');
    });
  }

  /* 注册 */
  if (registerForm) {
    const phone = registerForm.querySelector('input[name="phone"]');
    const pwd = registerForm.querySelector('input[name="password"]');
    const confirmPwd = registerForm.querySelector('input[name="confirm"]');
    phone.addEventListener('input', () => phone.setCustomValidity(''));
    confirmPwd.addEventListener('input', () => confirmPwd.setCustomValidity(''));
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!registerForm.checkValidity()) { registerForm.reportValidity(); return; }
      if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) {
        phone.setCustomValidity('请输入有效的手机号');
        phone.reportValidity();
        return;
      }
      if (pwd.value !== confirmPwd.value) {
        confirmPwd.setCustomValidity('两次输入的密码不一致');
        confirmPwd.reportValidity();
        return;
      }
      redirecting(registerForm, '正在注册…');
    });
  }

  if (form) {
    const phone = form.querySelector('input[name="phone"]');
    phone.addEventListener('input', () => phone.setCustomValidity(''));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (!/^[\d\s+\-()]{6,20}$/.test(phone.value.trim())) {
        phone.setCustomValidity('请填写有效的联系电话');
        phone.reportValidity();
        return;
      }
      success.classList.add('is-on');
      form.reset();
      setTimeout(closeModal, 2600);
    });
  }

  /* ───────── 返回顶部 ───────── */
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ───────── 图片灯箱 ───────── */
  const zoomables = $$('.space-media, .prop-media, .blog-media, .city-card');
  if (zoomables.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<button class="lightbox-close" aria-label="关闭预览"><svg class="ico"><use href="#i-close"/></svg></button><img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">';
    document.body.appendChild(box);
    const boxImg = $('img', box);

    const closeBox = () => {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
    };
    const openBox = (src, alt) => {
      boxImg.src = src;
      boxImg.alt = alt || '';
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
    };

    zoomables.forEach((el) => {
      const img = el.querySelector('img');
      if (!img) return;
      el.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        e.preventDefault();
        openBox(img.currentSrc || img.src, img.alt);
      });
    });
    box.addEventListener('click', (e) => {
      if (e.target === box || e.target.closest('.lightbox-close')) closeBox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && box.classList.contains('is-open')) closeBox();
    });
  }

  /* ───────── 导航高亮 ───────── */
  const sections = $$('main section[id]');
  const linkMap = new Map();
  $$('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) linkMap.set(href.slice(1), a);
  });
  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        linkMap.forEach((a, key) => a.classList.toggle('is-active', key === id));
      });
    }, { rootMargin: '-42% 0px -52% 0px' });
    sections.forEach((s) => navIO.observe(s));
  }

  /* ───────── 页面切换动效 ───────── */
  const docRoot = document.documentElement;
  const veil = $('.page-veil');

  if (docRoot.classList.contains('veil-in')) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      docRoot.classList.add('veil-out');
      setTimeout(() => docRoot.classList.remove('veil-in', 'veil-out'), 950);
    }));
  }

  if (veil) {
    let leaving = false;
    document.addEventListener('click', (e) => {
      if (leaving || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.getAttribute('href'), location.href);
      if (url.origin !== location.origin) return;
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      const sameDoc = url.pathname === location.pathname && url.search === location.search;
      if (sameDoc) return; // 页内锚点保持默认滚动

      e.preventDefault();
      if (reduceMotion.matches) { location.href = url.href; return; }

      leaving = true;
      try { sessionStorage.setItem('hj-veil', '1'); } catch (err) {}
      veil.classList.add('is-active');
      setTimeout(() => { location.href = url.href; }, 660);
    });

    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        leaving = false;
        veil.classList.remove('is-active');
      }
    });
  }

  /* ───────── 年份 ───────── */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ───────── 首帧 ───────── */
  onScroll();
  requestParallax();
  requestAnimationFrame(() => document.body.classList.add('ready'));
})();
