/* ============================================================
   PORTFOLIO — script.js
   Pure vanilla ES6+ JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ----------------------------------------------------------
     UTILITY HELPERS
  ---------------------------------------------------------- */

  /**
   * Debounce — collapses rapid successive calls into one.
   * Default wait is ~1 frame (16 ms).
   */
  const debounce = (fn, wait = 16) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  };

  /** Shorthand for querySelector / querySelectorAll */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /** Safe check — only run callback if element exists */
  const ifExists = (el, cb) => { if (el) cb(el); };

  /** Detect desktop viewport */
  const isDesktop = () => window.innerWidth > 768;

  /** Media query for pointer/hover capable devices */
  const desktopMQ = window.matchMedia('(min-width: 769px)');


  /* ----------------------------------------------------------
     1. PRELOADER
  ---------------------------------------------------------- */

  const preloader = $('.preloader');
  
  const hidePreloader = () => {
    if (!preloader || preloader.classList.contains('hidden')) return;
    preloader.classList.add('hidden');
    setTimeout(() => {
      preloader.remove();
      // Trigger dashboard SLA counters after load
      animateSlaMonitor();
    }, 500);
  };

  // Safe window load listener
  window.addEventListener('load', () => {
    setTimeout(hidePreloader, 400);
  });

  // Safety fallback timeout to prevent infinite loading screen
  setTimeout(hidePreloader, 3500);

  // Live SLA monitor ticking effect
  const animateSlaMonitor = () => {
    const slaEl = $('.sla-percent');
    if (!slaEl) return;
    
    let currentSla = 99.900;
    const targetSla = 99.984;
    const duration = 2500; // ms
    const startTime = performance.now();
    
    const updateSla = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      const val = currentSla + (targetSla - currentSla) * easeProgress;
      
      slaEl.textContent = `${val.toFixed(3)}%`;
      
      if (progress < 1) {
        requestAnimationFrame(updateSla);
      } else {
        // Ticks slightly to simulate live changes
        setInterval(() => {
          const jitter = (Math.random() - 0.5) * 0.003;
          const finalVal = Math.min(Math.max(99.975, targetSla + jitter), 99.995);
          slaEl.textContent = `${finalVal.toFixed(3)}%`;
        }, 3000);
      }
    };
    
    requestAnimationFrame(updateSla);
  };

  /* ----------------------------------------------------------
     1.5. LIGHT & DARK MODE THEME TOGGLE
  ---------------------------------------------------------- */
  const themeToggleBtn = $('#theme-toggle');
  
  // Set theme from saved preference or systems preference
  const currentTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  
  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  ifExists(themeToggleBtn, (btn) => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      
      let theme = 'dark';
      if (document.body.classList.contains('light-theme')) {
        theme = 'light';
      }
      
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  });

  /* ----------------------------------------------------------
     2. NAVIGATION
  ---------------------------------------------------------- */

  const navbar    = $('.navbar');
  const hamburger = $('.hamburger');
  const navMenu   = $('.nav-menu');
  const navLinks  = $$('.nav-link');

  // 2a. Navbar background / shrink on scroll
  const handleNavScroll = debounce(() => {
    ifExists(navbar, (nav) => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  });

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  // Fire once on load to set initial state
  handleNavScroll();

  // 2b. Mobile hamburger toggle
  ifExists(hamburger, (btn) => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      navMenu?.classList.toggle('active');
    });
  });

  // 2c. Close mobile menu when a nav link is clicked
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('active');
      navMenu?.classList.remove('active');
    });
  });

  // 2d. Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      navMenu?.classList.contains('active') &&
      !navMenu.contains(e.target) &&
      !hamburger?.contains(e.target)
    ) {
      hamburger?.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });

  // 2e. Smooth scroll to sections
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        const target = $(href);
        ifExists(target, (el) => {
          el.scrollIntoView({ behavior: 'smooth' });
        });
      }
    });
  });


  /* ----------------------------------------------------------
     3. ACTIVE SECTION TRACKING (IntersectionObserver)
  ---------------------------------------------------------- */

  const sections = $$('section[id]');

  if (sections.length && navLinks.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            // Remove .active from all nav links
            navLinks.forEach((link) => link.classList.remove('active'));
            // Add .active to the matching link
            const activeLink = $(`.nav-link[href="#${id}"]`);
            activeLink?.classList.add('active');
            // Update URL hash without triggering scroll
            history.replaceState(null, '', `#${id}`);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }


  /* ----------------------------------------------------------
     4. SCROLL ANIMATIONS (IntersectionObserver)
  ---------------------------------------------------------- */

  const animatedElements = $$('.animate-on-scroll');

  if (animatedElements.length) {
    const animObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;

            if (el.classList.contains('stagger-children')) {
              // Staggered reveal — add .visible to each child sequentially
              const children = [...el.children];
              children.forEach((child, i) => {
                setTimeout(() => child.classList.add('visible'), i * 100);
              });
            }

            el.classList.add('visible');
            observer.unobserve(el); // Animate only once
          }
        });
      },
      { threshold: 0.15 }
    );

    animatedElements.forEach((el) => animObserver.observe(el));
  }





  /* ----------------------------------------------------------
     6. LANDING PAGE — Typing Effect
  ---------------------------------------------------------- */

  const typingEl = $('.typing-text');

  ifExists(typingEl, (el) => {
    const fullText = el.dataset.text || el.textContent.trim();
    el.textContent = '';
    el.style.visibility = 'visible';

    let charIndex = 0;
    let cursorVisible = true;

    // Blinking cursor interval
    const cursorInterval = setInterval(() => {
      cursorVisible = !cursorVisible;
      if (cursorVisible) {
        el.classList.add('blink');
      } else {
        el.classList.remove('blink');
      }
    }, 530);

    const typeChar = () => {
      if (charIndex < fullText.length) {
        el.textContent += fullText.charAt(charIndex);
        charIndex++;
        setTimeout(typeChar, 50);
      } else {
        // Typing complete — keep cursor blinking for a bit, then stop
        setTimeout(() => clearInterval(cursorInterval), 3000);
      }
    };

    // Start typing after 1-second delay
    setTimeout(typeChar, 1000);
  });


  /* ----------------------------------------------------------
     7. LANDING PAGE — Floating Particles
  ---------------------------------------------------------- */

  const heroSection = $('#hero');

  if (heroSection && isDesktop()) {
    const PARTICLE_COUNT = 30;
    const particles = [];

    // Create a container so particles don't affect layout
    const particleContainer = document.createElement('div');
    particleContainer.classList.add('particle-container');
    particleContainer.setAttribute('aria-hidden', 'true');
    Object.assign(particleContainer.style, {
      position: 'absolute',
      inset: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: '0',
    });
    heroSection.style.position = heroSection.style.position || 'relative';
    heroSection.appendChild(particleContainer);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const dot = document.createElement('div');
      const size = Math.random() * 4 + 2; // 2–6 px
      const x = Math.random() * 100; // % of container width
      const y = Math.random() * 100;
      const speedX = (Math.random() - 0.5) * 0.3;
      const speedY = (Math.random() - 0.5) * 0.3;
      const opacity = Math.random() * 0.4 + 0.1;

      Object.assign(dot.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `rgba(34, 211, 238, ${opacity})`,
        left: `${x}%`,
        top: `${y}%`,
        willChange: 'transform',
      });

      particleContainer.appendChild(dot);
      particles.push({ el: dot, x, y, speedX, speedY });
    }

    // Animate with requestAnimationFrame
    let particlesRunning = true;

    const animateParticles = () => {
      if (!particlesRunning) return;

      const containerW = particleContainer.offsetWidth;
      const containerH = particleContainer.offsetHeight;

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around edges
        if (p.x > 100) p.x = -2;
        if (p.x < -2) p.x = 100;
        if (p.y > 100) p.y = -2;
        if (p.y < -2) p.y = 100;

        // Translate relative to percentage position
        const tx = (p.x / 100) * containerW;
        const ty = (p.y / 100) * containerH;
        p.el.style.transform = `translate(${tx}px, ${ty}px)`;
        p.el.style.left = '0';
        p.el.style.top = '0';
      });

      requestAnimationFrame(animateParticles);
    };

    requestAnimationFrame(animateParticles);

    // Pause when hero is off-screen for performance
    const heroVisObserver = new IntersectionObserver(
      ([entry]) => {
        particlesRunning = entry.isIntersecting;
        if (particlesRunning) requestAnimationFrame(animateParticles);
      },
      { threshold: 0 }
    );
    heroVisObserver.observe(heroSection);
  }


  /* ----------------------------------------------------------
     8. STATS COUNTER ANIMATION
  ---------------------------------------------------------- */

  const statNumbers = $$('.stat-number[data-target]');

  if (statNumbers.length) {
    let statsAnimated = false;

    /** EaseOutQuad: fast start, slow finish */
    const easeOutQuad = (t) => t * (2 - t);

    const animateStats = () => {
      if (statsAnimated) return;
      statsAnimated = true;

      statNumbers.forEach((el) => {
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) return;

        const duration = 2000; // ms
        const startTime = performance.now();

        const step = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutQuad(progress);
          const current = Math.round(easedProgress * target);

          el.textContent = `${current}`;

          if (progress < 1) {
            requestAnimationFrame(step);
          }
        };

        requestAnimationFrame(step);
      });
    };

    // Observe the nearest stats section
    const statsSection = statNumbers[0]?.closest('section') || statNumbers[0]?.parentElement;
    if (statsSection) {
      const statsObserver = new IntersectionObserver(
        ([entry], observer) => {
          if (entry.isIntersecting) {
            animateStats();
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.3 }
      );
      statsObserver.observe(statsSection);
    }
  }


  /* ----------------------------------------------------------
     9. SKILL PILLS STAGGER
  ---------------------------------------------------------- */

  const skillsSection = $('#skills');
  const skillPills = $$('.skill-pill');

  if (skillsSection && skillPills.length) {
    const skillsObserver = new IntersectionObserver(
      ([entry], observer) => {
        if (entry.isIntersecting) {
          skillPills.forEach((pill, i) => {
            setTimeout(() => pill.classList.add('visible'), i * 50);
          });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    skillsObserver.observe(skillsSection);
  }


  /* ----------------------------------------------------------
     10. CONTACT FORM VALIDATION & SUBMISSION
  ---------------------------------------------------------- */

  const contactForm = $('#contact-form');

  ifExists(contactForm, (form) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * Show an error on a specific field.
     */
    const showError = (field, message) => {
      field.classList.add('error');
      let msgEl = field.parentElement?.querySelector('.error-message');
      if (!msgEl) {
        msgEl = document.createElement('span');
        msgEl.classList.add('error-message');
        field.parentElement?.appendChild(msgEl);
      }
      msgEl.textContent = message;
    };

    /**
     * Clear error from a field.
     */
    const clearError = (field) => {
      field.classList.remove('error');
      const msgEl = field.parentElement?.querySelector('.error-message');
      if (msgEl) msgEl.textContent = '';
    };

    // Remove error on focus / input
    form.querySelectorAll('input, textarea').forEach((field) => {
      field.addEventListener('focus', () => clearError(field));
      field.addEventListener('input', () => clearError(field));
    });

    /**
     * Validate the form and return true if valid.
     */
    const validate = () => {
      let valid = true;

      const name    = form.querySelector('[name="name"]');
      const email   = form.querySelector('[name="email"]');
      const subject = form.querySelector('[name="subject"]');
      const message = form.querySelector('[name="message"]');

      // Name
      if (name && !name.value.trim()) {
        showError(name, 'Please enter your name.');
        valid = false;
      }

      // Email
      if (email) {
        if (!email.value.trim()) {
          showError(email, 'Please enter your email address.');
          valid = false;
        } else if (!emailRegex.test(email.value.trim())) {
          showError(email, 'Please enter a valid email address.');
          valid = false;
        }
      }

      // Subject
      if (subject && !subject.value.trim()) {
        showError(subject, 'Please enter a subject.');
        valid = false;
      }

      // Message
      if (message) {
        if (!message.value.trim()) {
          showError(message, 'Please enter a message.');
          valid = false;
        } else if (message.value.trim().length < 10) {
          showError(message, 'Message must be at least 10 characters.');
          valid = false;
        }
      }

      return valid;
    };

    /**
     * Create and show a toast notification.
     */
    const showToast = (text, type = 'success') => {
      const toast = document.createElement('div');
      toast.classList.add('toast', `toast--${type}`);
      toast.innerHTML = `
        <span class="toast__icon">${type === 'success' ? '✓' : '✕'}</span>
        <span class="toast__text">${text}</span>
      `;

      Object.assign(toast.style, {
        position: 'fixed',
        top: '24px',
        right: '-400px',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 24px',
        borderRadius: '12px',
        background: 'rgba(26, 29, 35, 0.95)',
        backdropFilter: 'blur(12px)',
        border: type === 'success'
          ? '1px solid rgba(16, 185, 129, 0.4)'
          : '1px solid rgba(239, 68, 68, 0.4)',
        color: '#E8E8EC',
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      });

      document.body.appendChild(toast);

      // Slide in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toast.style.right = '24px';
        });
      });

      // Auto-remove after 4 seconds
      setTimeout(() => {
        toast.style.right = '-400px';
        setTimeout(() => toast.remove(), 500);
      }, 4000);
    };

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (validate()) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.style.opacity = '0.7';
        submitBtn.disabled = true;

        try {
          const formData = new FormData(form);
          const response = await fetch('https://formsubmit.co/ajax/dindokarnikhil23@gmail.com', {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            showToast('Message sent successfully! I\'ll get back to you soon.', 'success');
            form.reset();
          } else {
            showToast('Something went wrong. Please try again.', 'error');
          }
        } catch (error) {
          showToast('Network error. Please check your connection and try again.', 'error');
        } finally {
          submitBtn.innerHTML = originalContent;
          submitBtn.style.opacity = '1';
          submitBtn.disabled = false;
        }
      }
    });
  });


  /* ----------------------------------------------------------
     11. BACK TO TOP BUTTON
  ---------------------------------------------------------- */

  const backToTop = $('.back-to-top');

  ifExists(backToTop, (btn) => {
    const handleBackToTopVisibility = debounce(() => {
      if (window.scrollY > 500) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    window.addEventListener('scroll', handleBackToTopVisibility, { passive: true });
    handleBackToTopVisibility();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });


  /* ----------------------------------------------------------
     12. MOUSE PARALLAX ON HERO
  ---------------------------------------------------------- */

  if (heroSection && desktopMQ.matches) {
    const parallaxElements = $$('.parallax-element', heroSection);

    if (parallaxElements.length) {
      let mouseX = 0;
      let mouseY = 0;
      let currentX = 0;
      let currentY = 0;
      let parallaxRunning = true;

      const MAX_OFFSET = 20; // px — very subtle movement

      heroSection.addEventListener('mousemove', (e) => {
        // Calculate position relative to viewport center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        mouseX = ((e.clientX - centerX) / centerX) * MAX_OFFSET;
        mouseY = ((e.clientY - centerY) / centerY) * MAX_OFFSET;
      }, { passive: true });

      const animateParallax = () => {
        if (!parallaxRunning) return;

        // Smooth lerp for fluid movement
        currentX += (mouseX - currentX) * 0.08;
        currentY += (mouseY - currentY) * 0.08;

        parallaxElements.forEach((el, i) => {
          // Each element moves at a slightly different rate
          const factor = 1 - i * 0.15;
          const tx = currentX * factor;
          const ty = currentY * factor;
          el.style.transform = `translate(${tx}px, ${ty}px)`;
        });

        requestAnimationFrame(animateParallax);
      };

      requestAnimationFrame(animateParallax);

      // Pause parallax when hero is out of view
      const parallaxVisObserver = new IntersectionObserver(
        ([entry]) => {
          parallaxRunning = entry.isIntersecting;
          if (parallaxRunning) requestAnimationFrame(animateParallax);
        },
        { threshold: 0 }
      );
      parallaxVisObserver.observe(heroSection);
    }
  }


  /* ----------------------------------------------------------
     13. CERTIFICATE MODAL
  ---------------------------------------------------------- */

  const modal      = $('.modal');
  const modalClose = $('.modal-close');
  const certCards  = $$('.cert-card');

  if (modal && certCards.length) {
    const modalTitle       = $('.modal-title', modal);
    const modalProvider    = $('.modal-provider', modal);
    const modalDescription = $('.modal-description', modal);
    const modalImage       = $('.modal-image', modal);

    const openModal = (card) => {
      const title       = card.dataset.title       || card.querySelector('.cert-title')?.textContent    || '';
      const provider    = card.dataset.provider    || card.querySelector('.cert-provider')?.textContent || '';
      const description = card.dataset.description || card.querySelector('.cert-desc')?.textContent     || '';
      const image       = card.dataset.image       || card.querySelector('img')?.src                    || '';

      if (modalTitle)       modalTitle.textContent       = title;
      if (modalProvider)    modalProvider.textContent    = provider;
      if (modalDescription) modalDescription.textContent = description;
      if (modalImage && image) {
        modalImage.src = image;
        modalImage.alt = title;
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    // Open on card click
    certCards.forEach((card) => {
      card.addEventListener('click', () => openModal(card));
      // Keyboard accessible
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(card);
        }
      });
    });

    // Close on close-button click
    modalClose?.addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }


  /* ----------------------------------------------------------
     14. SMOOTH SCROLL FOR ALL ANCHOR LINKS
         (CTA buttons, footer links, etc.)
  ---------------------------------------------------------- */

  $$('a[href^="#"]').forEach((anchor) => {
    // Skip if it's already a nav link (handled above)
    if (anchor.classList.contains('nav-link')) return;

    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = $(href);
      ifExists(target, (el) => {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      });
    });
  });
  /* ----------------------------------------------------------
     14.5. GITOPS PIPELINE RUNNER SIMULATION
  ---------------------------------------------------------- */
  const steps = $$('.pipeline-step');
  const statusMsg = $('.status-msg');
  const statusInd = $('.status-indicator');

  if (steps.length > 0) {
    let currentStep = 0;
    const stepMessages = [
      "Cloning repository & querying latest Git commit...",
      "Building Docker container layers & pushing to Amazon ECR...",
      "Parsing Terraform configs & applying updates to Cloud resources...",
      "Triggering rolling updates to ECS Tasks on AP-SOUTH-1...",
      "SUCCESS: Deploy pipeline completed. SLA targets healthy!"
    ];

    const runPipeline = () => {
      // Reset all steps
      steps.forEach(step => {
        step.classList.remove('active', 'success');
      });
      if (statusInd) statusInd.className = 'status-indicator running';
      
      const executeStep = (index) => {
        if (index >= steps.length) {
          if (statusInd) statusInd.className = 'status-indicator success';
          if (statusMsg) statusMsg.textContent = stepMessages[index];
          setTimeout(runPipeline, 6000); // Wait 6 seconds before running next cycle
          return;
        }

        currentStep = index;
        const activeStep = steps[index];
        activeStep.classList.add('active');
        if (statusMsg) statusMsg.textContent = stepMessages[index];

        setTimeout(() => {
          activeStep.classList.remove('active');
          activeStep.classList.add('success');
          executeStep(index + 1);
        }, 2400); // 2.4s per build stage
      };

      executeStep(0);
    };

    // Auto-initiate run loop after 1s
    setTimeout(runPipeline, 1000);
  }

  /* ----------------------------------------------------------
     15. CONSOLE EASTER EGG
  ---------------------------------------------------------- */

  console.log(
    '%c👋 Hey there, curious developer!',
    'color: #22D3EE; font-size: 16px; font-weight: bold;'
  );
  console.log(
    '%cThis portfolio was handcrafted with vanilla JS.\n' +
    'Check out the source — it\'s clean, I promise.',
    'color: #9CA3AF; font-size: 12px;'
  );

}); // end DOMContentLoaded
