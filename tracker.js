(function() {
  'use strict';

  const API_URL = window.HMP_API_URL || 'https://your-api-url.com';
  let projectId = null;
  let sessionId = localStorage.getItem('hmp_session') || generateId();
  let startTime = Date.now();
  let attentionTimer = null;
  let attentionTime = 0;

  function generateId() {
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    localStorage.setItem('hmp_session', id);
    return id;
  }

  function sendEvent(type, data) {
    fetch(`${API_URL}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        type,
        sessionId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          device: /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'mobile' : 'desktop'
        },
        ...data
      })
    }).catch(() => {}); // Silent fail
  }

  // Track clicks
  document.addEventListener('click', function(e) {
    const el = e.target.closest('a, button, [role="button"], input, textarea, select');
    sendEvent('clicks', {
      x: e.pageX,
      y: e.pageY,
      element: el ? {
        tag: el.tagName,
        id: el.id,
        class: el.className,
        text: el.textContent?.substring(0, 100),
        href: el.href || null
      } : null
    });
  });

  // Track mouse movement (throttled)
  let moveTimeout;
  document.addEventListener('mousemove', function(e) {
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => {
      sendEvent('move', {
        x: e.pageX,
        y: e.pageY
      });
    }, 100);
  });

  // Track scroll depth
  let maxScroll = 0;
  window.addEventListener('scroll', function() {
    const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    if (scrollPercent > maxScroll) {
      maxScroll = scrollPercent;
      sendEvent('scroll', { scrollDepth: scrollPercent });
    }
  }, { passive: true });

  // Track attention time
  function startAttention() {
    attentionTimer = setInterval(() => {
      attentionTime += 1;
      if (attentionTime % 5 === 0) {
        sendEvent('attention', { attentionTime });
      }
    }, 1000);
  }

  function stopAttention() {
    clearInterval(attentionTimer);
  }

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) stopAttention();
    else startAttention();
  });

  // Track custom events
  window.HeatMapPro = {
    init: function(pid) {
      projectId = pid;
      sendEvent('pageview', { url: window.location.href, title: document.title });
      startAttention();
    },

    track: function(eventName, properties = {}) {
      sendEvent('custom', { eventName, properties });
    },

    identify: function(userId, traits = {}) {
      sendEvent('identify', { userId, traits });
    }
  };

  // Auto-init if projectId is in script tag
  const script = document.currentScript;
  if (script && script.dataset.projectId) {
    HeatMapPro.init(script.dataset.projectId);
  }
})();
