# Pidima Chat Experience (Vanilla HTML/CSS/JS)

This project implements a modern, production-quality chat experience that can integrate with Pidima's AI-powered documentation tools.

## Highlights
- Floating popup chat widget (Intercom-style)
- Core features: message input/display, scrollable history, timestamps, subtle animations, responsive layout
- Advanced features: typing indicator, message status (sent/delivered/read), emoji picker, dark/light theme toggle
- LocalStorage persistence for chat history and theme
- Pure HTML, CSS, and JavaScript (no frameworks/libraries)

## Getting Started
1. Open `index.html` in a modern browser (Chrome, Firefox, Safari).
2. The chat widget appears as a floating button. Click to open/close. On desktop it auto-opens for demo.

## Files
- `index.html`: Markup for the floating chat widget
- `styles.css`: Theming, layout, animations, responsive rules
- `script.js`: Chat behavior, history, typing simulation, status updates, emoji picker

## Design Decisions
- **Floating popup** was chosen for minimal invasiveness and easy drop-in to existing pages.
- **Dark-first design** with a **theme toggle** ensures great contrast and readability in both modes.
- **Animations** are subtle and performant (opacity/transform), avoiding layout thrash.
- **LocalStorage** persists conversation and theme without a backend; this can be swapped for real APIs later.
- **Accessible semantics**: ARIA roles/labels, `aria-live` for messages, keyboard-friendly input.

## Assumptions for Pidima Integration
- The assistant messages currently simulate responses. Integrating with Pidima would replace the `simulateAiReply` in `script.js` to call a real endpoint and stream/deliver replies.
- Message status transitions (sent → delivered → read) are time-based now; in production these would be driven by server acknowledgements and read receipts.
- Authentication, rate limiting, and secure content handling will be handled by the host application when connected to Pidima services.

## Notes
- Works on mobile and desktop; the input resizes up to 160px height.
- Emoji panel uses a curated set for simplicity (no external sprite sheets).
- No dependencies — just static files; host via any static server or open directly.
