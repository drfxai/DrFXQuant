# Changelog

## v5.1 — Manual Trading (2026-02-27)

### Manual Trading Section
- Full TradingView Advanced Chart embedded in-app
- Quick symbol switcher: EUR/USD, GBP/USD, USD/JPY, XAU/USD, BTC/USD, ETH/USD, SPX 500, NAS 100, US30, and more
- Timeframe selector: 1m, 5m, 15m, 1H, 4H, 1D, 1W
- Built-in indicators: SMA and RSI loaded by default, full indicator library available
- Native full-screen mode (browser Fullscreen API) with toggle button
- Landscape mode support with auto-resize chart redraw
- Symbol and interval preferences saved to localStorage
- Keyboard shortcut: Escape to close chart view
- Dark/Light theme auto-sync with app theme
- Accessible from sidebar menu for all users

## v5.0 — Public Release (2026-02-26)

### Core Platform
- Telegram-style DMs, groups, and channels with public/private visibility
- Real-time messaging via Socket.io with typing indicators and read receipts
- Image sharing with drag-and-drop upload
- Message edit and delete (long-press on mobile)
- Emoji picker, markdown formatting (bold, italic, code blocks)
- Unread message badges with sound notifications

### AI Trading Assistant
- Auto-created AI bot DM for every new user
- OpenRouter integration (Claude, GPT, and other models)
- Configurable free-tier daily message limits
- Trading-focused system prompt: technical analysis, risk management, Pine Script

### User System
- Unique @username for users and chats
- Login via email or @username
- Editable profile: name, bio, avatar
- Global search across users, groups, and channels

### Public/Private Join Rules
- Public groups and channels: users can search and self-join freely
- Private groups and channels: admin invitation only
- Full-screen join preview for public chats (Telegram-style)
- Visibility badges (🌐 / 🔒) in search results

### Admin Dashboard
- Live statistics: users, messages, chats, subscriptions, daily activity
- Search, block/unblock, delete users
- Grant Pro subscriptions
- Admin-only group and channel creation

### Payments
- Crypto subscriptions via NowPayments
- Free and Pro tiers with automatic expiry checking

### Mobile
- Keyboard-safe layout (position:fixed, width-only resize rebuild)
- 16px font-size on inputs (prevents iOS auto-zoom)
- Touch-optimized: long-press menus, swipe-safe tap targets
- Safe-area support for notched devices

### Deployment
- One-command VPS installer (Node.js, PostgreSQL, Nginx, PM2, SSL)
- Interactive setup with domain, admin credentials, API keys
- Clean uninstaller with optional dependency removal
- Auto-migration on startup (database schema versioning)

### Design
- Dual themes: Galaxy Dark and Crystal Light
- Professional login page with chart logo and quote card
- Responsive layout: phone, tablet, desktop

---

Built by **Dr. Pouria** — [t.me/Drfxai](https://t.me/Drfxai)
