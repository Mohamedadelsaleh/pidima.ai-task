(function () {
  'use strict';

  const root = document.documentElement;
  const chatToggle = document.getElementById('chat-toggle');
  const chatWidget = document.getElementById('chat-widget');
  const chatClose = document.getElementById('chat-close');
  const msgList = document.getElementById('chat-messages');
  const typing = document.getElementById('typing-indicator');
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const emojiToggle = document.getElementById('emoji-toggle');
  const emojiPanel = document.getElementById('emoji-panel');

  const STORAGE_KEY = 'pidima-chat-history';
  const THEME_KEY = 'pidima-theme';

  /**
   * Utilities
   */
  function formatTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hrs = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hrs}:${mins}`;
  }

  function sanitize(text) {
    // Minimal sanitization: escape < and >
    return text.replace(/[<>]/g, (m) => (m === '<' ? '&lt;' : '&gt;'));
  }

  function scrollToBottom() {
    // Ensure scrolling happens after layout
    requestAnimationFrame(() => {
      msgList.scrollTop = msgList.scrollHeight;
    });
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light') {
      root.setAttribute('data-theme', 'light');
      themeToggle.textContent = '🌙';
    } else {
      root.removeAttribute('data-theme');
      themeToggle.textContent = '🌞';
    }
  }

  function toggleTheme() {
    const isLight = root.getAttribute('data-theme') === 'light';
    if (isLight) {
      root.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'dark');
      themeToggle.textContent = '🌞';
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem(THEME_KEY, 'light');
      themeToggle.textContent = '🌙';
    }
  }

  /**
   * Storage for message history
   */
  function readHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  function writeHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  /**
   * Rendering
   */
  function renderMessages(messages) {
    msgList.innerHTML = '';
    for (const m of messages) {
      appendMessageElement(m);
    }
    scrollToBottom();
  }

  function messageStatusIcon(status) {
    // sent ▶ delivered ✓ ▶ read ✓✓ (green)
    if (status === 'read') return '✓✓';
    if (status === 'delivered') return '✓';
    return '•'; // sent (bullet)
  }

  function appendMessageElement(message) {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg' + (message.author === 'me' ? ' me' : '');

    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = sanitize(message.text);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const timeEl = document.createElement('span');
    timeEl.className = 'time';
    timeEl.textContent = formatTime(message.time);
    meta.appendChild(timeEl);

    if (message.author === 'me') {
      const statusEl = document.createElement('span');
      statusEl.className = 'status';
      statusEl.title = message.status;
      statusEl.textContent = messageStatusIcon(message.status);
      if (message.status === 'read') statusEl.style.color = getComputedStyle(document.documentElement).getPropertyValue('--success');
      meta.appendChild(statusEl);
    }

    wrapper.appendChild(content);
    wrapper.appendChild(meta);
    msgList.appendChild(wrapper);
  }

  /**
   * Emoji picker
   */
  const EMOJIS = [
    '😀','😁','😂','🤣','😊','😍','🤩','😘','😇','🙂','😉','🤔','😴','🙄','😬','😮\u200d\ud83d\ude2a','😮','😢','😭','😤','😅','😎','🤓','🤖','👍','👎','👏','🙏','🔥','✨','💡','💬','📎','📝','🧠','🔍','📚','✅','❌','⏳','🚀'
  ];
  function buildEmojiPanel() {
    emojiPanel.innerHTML = '';
    for (const e of EMOJIS) {
      const b = document.createElement('button');
      b.className = 'emoji-btn';
      b.type = 'button';
      b.textContent = e;
      b.addEventListener('click', () => {
        insertAtCursor(input, e);
        emojiPanel.classList.remove('show');
        input.focus();
      });
      emojiPanel.appendChild(b);
    }
  }
  function insertAtCursor(field, value) {
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const text = field.value;
    field.value = text.slice(0, start) + value + text.slice(end);
    const caret = start + value.length;
    field.selectionStart = field.selectionEnd = caret;
    autoResizeTextarea();
  }

  /**
   * Input autosize
   */
  function autoResizeTextarea() {
    input.style.height = 'auto';
    const newHeight = Math.min(input.scrollHeight, 160);
    input.style.height = `${newHeight}px`;
  }

  /**
   * Typing + AI simulation
   */
  let typingTimeout = null;
  function showTyping(show) {
    if (show) {
      typing.classList.add('show');
    } else {
      typing.classList.remove('show');
    }
  }
  function simulateAiReply(userText) {
    // Basic heuristic to craft a helpful response
    const reply = `You said: "${userText.trim()}"\n\nI can help summarize documentation, answer questions, and link you to relevant sections. Try asking something like: \n- "What does the onboarding API return?"\n- "Generate a summary of the deployment steps."`;

    showTyping(true);
    // After 900ms, deliver; after 1400ms, read; after 1600ms, display reply
    setTimeout(() => {
      updateLastOutgoingStatus('delivered');
    }, 900);
    setTimeout(() => {
      updateLastOutgoingStatus('read');
    }, 1400);
    // Show assistant reply slightly after status updates
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      showTyping(false);
      addMessage({ author: 'bot', text: reply });
    }, 1600);
  }

  /**
   * Message lifecycle
   */
  function addMessage({ author, text, status }) {
    const history = readHistory();
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author,
      text,
      time: new Date().toISOString(),
      status: status || (author === 'me' ? 'sent' : 'read')
    };
    history.push(message);
    writeHistory(history);
    appendMessageElement(message);
    scrollToBottom();
    return message;
  }

  function updateLastOutgoingStatus(newStatus) {
    const history = readHistory();
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].author === 'me') {
        history[i].status = newStatus;
        writeHistory(history);
        // Update the last my message's status in DOM
        const els = msgList.querySelectorAll('.msg.me .status');
        const last = els[els.length - 1];
        if (last) {
          last.textContent = messageStatusIcon(newStatus);
          last.title = newStatus;
          if (newStatus === 'read') {
            last.style.color = getComputedStyle(document.documentElement).getPropertyValue('--success');
          }
        }
        break;
      }
    }
  }

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    autoResizeTextarea();

    addMessage({ author: 'me', text });
    simulateAiReply(text);
  }

  /**
   * Open/Close widget
   */
  function openChat() {
    chatWidget.classList.add('open');
    chatToggle.setAttribute('aria-expanded', 'true');
    input.focus();
  }
  function closeChat() {
    chatWidget.classList.remove('open');
    chatToggle.setAttribute('aria-expanded', 'false');
  }

  /**
   * Init
   */
  function init() {
    // Theme
    loadTheme();

    // Emoji
    buildEmojiPanel();

    // History
    const history = readHistory();
    if (history.length === 0) {
      // Seed a welcome message
      addMessage({ author: 'bot', text: 'Hi! I\'m the Pidima Assistant. Ask me about your docs or say hello 👋' });
    } else {
      renderMessages(history);
    }

    // Events
    chatToggle.addEventListener('click', () => {
      if (chatWidget.classList.contains('open')) closeChat(); else openChat();
    });
    chatClose.addEventListener('click', closeChat);
    themeToggle.addEventListener('click', toggleTheme);
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    input.addEventListener('input', autoResizeTextarea);

    emojiToggle.addEventListener('click', () => {
      const isOpen = emojiPanel.classList.contains('show');
      if (isOpen) emojiPanel.classList.remove('show'); else emojiPanel.classList.add('show');
    });
    document.addEventListener('click', (e) => {
      if (!emojiPanel.contains(e.target) && e.target !== emojiToggle) {
        emojiPanel.classList.remove('show');
      }
    });

    // Open immediately on desktop for demo feel
    if (window.matchMedia('(min-width: 640px)').matches) {
      openChat();
    }
  }

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();


