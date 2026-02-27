<p align="center">
  <img src="https://raw.githubusercontent.com/drfxai/DrFXQuant/main/docs/logo.svg" width="80" alt="DrFX Quantum"/>
</p>

<h1 align="center">DrFX Quantum</h1>

<p align="center">
  <strong>Open-source, Telegram-style trading communication platform</strong><br/>
  Real-time messaging · AI assistant · Crypto payments · One-command deploy
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-5.2-blue?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square&logo=node.js" alt="Node"/>
  <img src="https://img.shields.io/badge/database-PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs"/>
</p>

---

## What is DrFX Quantum?

A self-hosted, real-time messaging platform built for trading communities. Think of it as your own private Telegram — with a built-in AI trading assistant, crypto subscription payments, and full admin control. Deploy on any VPS in under 5 minutes.

## Features

**Messaging**
- Direct messages, groups, and channels (public and private)
- Real-time delivery via WebSocket (Socket.io)
- Image sharing, emoji picker, message edit & delete
- Typing indicators, read receipts, unread badges with sound notifications
- Markdown formatting (bold, italic, code blocks)

**AI Trading Assistant**
- Built-in AI bot auto-created for every new user
- Powered by OpenRouter (Claude, GPT, etc.) — bring your own API key
- Technical analysis, chart patterns, risk management, Pine Script help
- Configurable daily limits for free-tier users

**Telegram-Style UX**
- Public groups/channels: anyone can search and join freely
- Private groups/channels: admin invitation only
- Full-screen join preview before entering public chats
- Global search across users, groups, and channels by name, email, or @username
- Unique @username system for users and chats

**Admin Dashboard**
- Live stats: users, messages, chats, subscriptions
- Search, block/unblock, delete users
- Grant Pro subscriptions
- Only admins can create groups and channels

**Manual Trading**
- Full TradingView Advanced Chart with all professional tools
- Quick symbol switcher: Forex, Crypto, Indices (EUR/USD, BTC/USD, SPX 500, etc.)
- Timeframe selector: 1m to 1W with one-click switching
- Full-screen and landscape modes for immersive charting
- Analysis Notes: save personal notes per symbol with direction tags
- Theme-synced (Galaxy Dark / Crystal Light)
- Preferences auto-saved between sessions

**Live Trading**
- Admin screen share via WebRTC for real-time trading sessions
- Users automatically see the live stream when entering the section
- Live status indicator with viewer count
- Stream timer and auto-cleanup on disconnect
- Professional UI with idle/streaming states

**Chat Actions**
- Reply, Copy, Edit, and Delete available on all messages for all users
- Reply quotes with sender name and message preview
- Click reply to scroll to the original message

**Payments**
- Crypto subscriptions via NowPayments
- Free tier with daily AI message limits
- Pro tier unlocks unlimited AI access

**Mobile-First Design**
- Fully responsive: phone, tablet, desktop
- Native mobile keyboard handling
- Dual themes: Galaxy Dark and Crystal Light
- PWA-ready with touch-optimized interactions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Real-time | Socket.io |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| AI | OpenRouter API |
| Payments | NowPayments |
| Uploads | Multer |
| Frontend | Vanilla JS SPA (zero framework dependencies) |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (Certbot) |

## Quick Start

### One-Command Install (Ubuntu/Debian VPS)

```bash
git clone https://github.com/drfxai/DrFXQuant.git
cd DrFXQuant
sudo bash install.sh
```

The installer handles everything: Node.js, PostgreSQL, Nginx, PM2, SSL, and creates your admin account interactively.

### Manual Setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/drfxai/DrFXQuant.git
cd DrFXQuant
npm install

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 3. Ensure PostgreSQL is running with credentials matching .env

# 4. Start
npm start
```

Open `http://localhost:3000` — the database schema and admin account are created automatically on first run.

### Uninstall

```bash
sudo bash uninstall.sh
```

Removes the app, Nginx config, PM2 process, and optionally the database.

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
JWT_SECRET=generate_with_openssl_rand_hex_32
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_password

# PostgreSQL
DB_USER=drfx
DB_PASS=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drfx_quantum

# AI (optional — get a key at openrouter.ai)
OPENROUTER_API_KEY=sk-or-...

# Payments (optional — get keys at nowpayments.io)
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...
```

## Project Structure

```
DrFXQuant/
├── server.js           # Express + Socket.io entry point
├── database.js         # PostgreSQL schema, migrations, seeding
├── package.json
├── .env.example
├── routes/
│   ├── auth.js         # Register, login, profile, username/email auth
│   ├── chats.js        # CRUD chats, messages, members, search, AI bot
│   ├── admin.js        # Dashboard stats, user management
│   ├── payment.js      # NowPayments crypto subscriptions
│   └── upload.js       # Image upload via Multer
├── public/
│   └── index.html      # Complete SPA frontend (single-file, ~430 lines)
├── install.sh          # One-command VPS installer
├── uninstall.sh        # Clean removal script
├── deploy.sh           # Quick re-deploy helper
└── nginx.conf          # Nginx reference config
```

## Permissions

| Action | User | Admin |
|--------|------|-------|
| Send DMs | ✅ | ✅ |
| Join public groups/channels | ✅ | ✅ |
| Join private groups/channels | ❌ | ✅ (invite) |
| Create groups/channels | ❌ | ✅ |
| Edit/delete own messages | ✅ | ✅ |
| Edit/delete any message | ❌ | ✅ |
| View private member list | ❌ | ✅ |
| Admin dashboard | ❌ | ✅ |

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in (email or @username) |
| `GET` | `/api/auth/me` | Current user profile |
| `PUT` | `/api/auth/profile` | Update name, bio, avatar, username |
| `GET` | `/api/chats` | List user's chats |
| `POST` | `/api/chats` | Create DM / group / channel |
| `GET` | `/api/chats/:id` | Chat details (public viewable by non-members) |
| `PUT` | `/api/chats/:id` | Update chat (admin) |
| `DELETE` | `/api/chats/:id` | Delete chat (admin) |
| `POST` | `/api/chats/:id/members` | Join public chat or add member (admin) |
| `DELETE` | `/api/chats/:id/members/:uid` | Leave or remove member |
| `GET` | `/api/chats/:id/messages` | Get messages (paginated) |
| `POST` | `/api/chats/:id/messages` | Send message (text and/or image) |
| `PUT` | `/api/chats/:cid/messages/:mid` | Edit message |
| `DELETE` | `/api/chats/:cid/messages/:mid` | Delete message |
| `GET` | `/api/chats/users/search?q=` | Global search (users + chats) |
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/users` | User list with search |
| `POST` | `/api/payment/create` | Create crypto invoice |
| `GET` | `/api/payment/status` | Subscription status |
| `POST` | `/api/upload` | Upload image |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat_message` | Server → Client | New message in a chat |
| `message_edited` | Server → Client | Message was edited |
| `message_deleted` | Server → Client | Message was deleted |
| `online_users` | Server → Client | Updated list of online user IDs |
| `typing` | Both | Typing indicator |

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE) — free for personal and commercial use.

---

<p align="center">
  Built by <strong>Dr. Pouria</strong> · <a href="https://t.me/Drfxai">t.me/Drfxai</a>
</p>
