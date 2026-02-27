#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  📈 DrFX Quantum v5.0 — Installer (PostgreSQL + Telegram-style)
#  Usage: sudo bash install.sh
#  Uninstall: sudo bash uninstall.sh
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
APP_DIR="/var/www/drfx-quantum"

clear
echo ""
echo -e "${CYAN}  ╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}  ║                                            ║${NC}"
echo -e "${CYAN}  ║   📈 ${BOLD}DrFX Quantum${NC}${CYAN} v5.0 — Installer         ║${NC}"
echo -e "${CYAN}  ║   Telegram-style Trading Platform          ║${NC}"
echo -e "${CYAN}  ║                                            ║${NC}"
echo -e "${CYAN}  ╚════════════════════════════════════════════╝${NC}"
echo ""

if [ "$EUID" -ne 0 ]; then echo -e "${RED}✘ Run as root: sudo bash install.sh${NC}"; exit 1; fi

echo -e "${BOLD}── Step 1: Configuration ──${NC}\n"

echo -ne "${YELLOW}➤ Domain (e.g. chat.drfx.com): ${NC}"; read -r DOMAIN
while [ -z "$DOMAIN" ]; do echo -ne "${RED}  Required: ${NC}"; read -r DOMAIN; done

echo -ne "${YELLOW}➤ Admin email: ${NC}"; read -r ADMIN_EMAIL
while [ -z "$ADMIN_EMAIL" ]; do echo -ne "${RED}  Required: ${NC}"; read -r ADMIN_EMAIL; done

while true; do
  echo -ne "${YELLOW}➤ Admin password (min 6): ${NC}"; read -rs ADMIN_PASSWORD; echo
  [ ${#ADMIN_PASSWORD} -lt 6 ] && echo -e "${RED}  Too short${NC}" && continue
  echo -ne "${YELLOW}➤ Confirm: ${NC}"; read -rs ADMIN_PASSWORD2; echo
  [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD2" ] && echo -e "${RED}  Mismatch${NC}" && continue; break
done

DB_NAME="drfx_quantum"; DB_USER="drfx"; DB_PASS=$(openssl rand -hex 16)

echo ""; echo -e "${BOLD}── Optional API Keys (Enter to skip) ──${NC}"; echo ""
echo -ne "${YELLOW}➤ OpenRouter API key: ${NC}"; read -r OPENROUTER_KEY
echo -ne "${YELLOW}➤ NowPayments API key: ${NC}"; read -r NP_API_KEY
echo -ne "${YELLOW}➤ NowPayments IPN secret: ${NC}"; read -r NP_IPN_SECRET

echo ""; echo -e "${BOLD}── Confirm ──${NC}"; echo ""
echo -e "  Domain:   ${GREEN}$DOMAIN${NC}"
echo -e "  Admin:    ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "  Database: ${GREEN}PostgreSQL ($DB_NAME)${NC}"
echo ""; echo -ne "${YELLOW}➤ Proceed? (y/n): ${NC}"; read -r CONFIRM
[[ ! "$CONFIRM" =~ ^[Yy]$ ]] && echo -e "${RED}Cancelled.${NC}" && exit 0

echo ""; echo -e "${BOLD}── Step 2: System Packages ──${NC}"; echo ""

echo -e "${CYAN}▸ Updating system...${NC}"
apt update -y -qq && apt upgrade -y -qq

if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 18 ]]; then
  echo -e "${CYAN}▸ Installing Node.js 20...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt install -y -qq nodejs
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

apt install -y -qq build-essential python3 git > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} Build tools"

echo -e "${CYAN}▸ Installing PostgreSQL...${NC}"
apt install -y -qq postgresql postgresql-contrib > /dev/null 2>&1
systemctl enable postgresql; systemctl start postgresql
echo -e "  ${GREEN}✓${NC} PostgreSQL $(psql --version 2>/dev/null | awk '{print $3}' || echo 'installed')"

echo -e "${CYAN}▸ Setting up database...${NC}"
sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
echo -e "  ${GREEN}✓${NC} Database ready"

apt install -y -qq nginx > /dev/null 2>&1; echo -e "  ${GREEN}✓${NC} Nginx"
npm install -g pm2 > /dev/null 2>&1; echo -e "  ${GREEN}✓${NC} PM2"

echo ""; echo -e "${BOLD}── Step 3: Application ──${NC}"; echo ""
mkdir -p "$APP_DIR" "$APP_DIR/uploads"

if [ -f "server.js" ]; then
  cp server.js database.js package.json "$APP_DIR/"
  cp -r routes public "$APP_DIR/"
  [ -f "uninstall.sh" ] && cp uninstall.sh "$APP_DIR/"
  echo -e "  ${GREEN}✓${NC} Files copied"
fi

cd "$APP_DIR"
JWT_SECRET=$(openssl rand -hex 32)
cat > .env << ENVFILE
PORT=3000
JWT_SECRET=$JWT_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
OPENROUTER_API_KEY=${OPENROUTER_KEY:-your_openrouter_api_key_here}
NOWPAYMENTS_API_KEY=${NP_API_KEY:-your_nowpayments_api_key_here}
NOWPAYMENTS_IPN_SECRET=${NP_IPN_SECRET:-your_nowpayments_ipn_secret_here}
ENVFILE
chmod 600 .env; echo -e "  ${GREEN}✓${NC} .env created"

npm install --production 2>&1 | tail -1; echo -e "  ${GREEN}✓${NC} Dependencies installed"

echo ""; echo -e "${BOLD}── Step 4: Nginx ──${NC}"; echo ""
cat > /etc/nginx/sites-available/drfx-quantum << NGINX
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 12M;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/drfx-quantum /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1 && systemctl restart nginx
echo -e "  ${GREEN}✓${NC} Nginx configured"

echo ""; echo -e "${BOLD}── Step 5: Start ──${NC}"; echo ""
pm2 delete drfx-quantum > /dev/null 2>&1 || true
pm2 start server.js --name drfx-quantum --cwd "$APP_DIR"
pm2 save > /dev/null 2>&1; pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true
echo -e "  ${GREEN}✓${NC} Running with PM2"

echo ""; echo -e "${BOLD}── Step 6: SSL ──${NC}"; echo ""
command -v certbot &> /dev/null || apt install -y -qq certbot python3-certbot-nginx > /dev/null 2>&1
echo -ne "${YELLOW}➤ Setup SSL now? (y/n): ${NC}"; read -r SSL
if [[ "$SSL" =~ ^[Yy]$ ]]; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL" 2>&1 | tail -3 || echo -e "${YELLOW}  ⚠ Run: certbot --nginx -d $DOMAIN${NC}"
fi

echo ""
echo -e "${GREEN}  ╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║  ✅ ${BOLD}DrFX Quantum v5.0 installed!${NC}${GREEN}                  ║${NC}"
echo -e "${GREEN}  ╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}  ║  🌐 ${BOLD}http://$DOMAIN${NC}${GREEN}"
echo -e "${GREEN}  ║  👤 ${BOLD}$ADMIN_EMAIL${NC}${GREEN}"
echo -e "${GREEN}  ║  🗄️  ${BOLD}PostgreSQL ($DB_NAME)${NC}${GREEN}"
echo -e "${GREEN}  ╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}  ║  ${NC}pm2 logs drfx-quantum       ${GREEN}# Logs${NC}"
echo -e "${GREEN}  ║  ${NC}pm2 restart drfx-quantum     ${GREEN}# Restart${NC}"
echo -e "${GREEN}  ║  ${NC}nano $APP_DIR/.env   ${GREEN}# Config${NC}"
echo -e "${GREEN}  ║  ${NC}sudo bash uninstall.sh       ${GREEN}# Uninstall${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════════════════╝${NC}"
echo ""
