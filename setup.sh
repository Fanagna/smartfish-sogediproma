#!/bin/bash
# =============================================================
#  🐟 SmartFish Sogediproma — Setup Script
#  Installation complète en un clic
#  Usage: chmod +x setup.sh && ./setup.sh
# =============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
title(){ echo -e "\n${BOLD}━━━ $1 ━━━${NC}\n"; }

# ─── Vérification des prérequis ───
title "Prérequis"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    log "$1 trouvé : $($1 --version 2>&1 | head -1)"
    return 0
  else
    warn "$1 n'est pas installé"
    return 1
  fi
}

HAS_NODE=false; HAS_NPM=false; HAS_PSQL=false; HAS_DOCKER=false

check_cmd node && HAS_NODE=true
check_cmd npm && HAS_NPM=true
check_cmd psql && HAS_PSQL=true
check_cmd docker && HAS_DOCKER=true

if ! $HAS_NODE && ! $HAS_DOCKER; then
  err "Node.js ou Docker requis. Installez l'un des deux."
  exit 1
fi

# ─── Configuration ───
title "Configuration"

if [ ! -f server/.env ]; then
  info "Création du fichier server/.env..."
  cat > server/.env << EOF
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://smartfish:smartfish123@localhost:5432/smartfish
JWT_SECRET=smartfish-jwt-secret-$(date +%s)
GEMINI_API_KEY=
CLIENT_URL=http://localhost:5173
EOF
  log "server/.env créé"
else
  log "server/.env existe déjà"
fi

if [ ! -f client/.env ]; then
  info "Création du fichier client/.env..."
  echo "VITE_API_URL=http://localhost:5000/api" > client/.env
  log "client/.env créé"
else
  log "client/.env existe déjà"
fi

# ─── Mode Docker ───
if $HAS_DOCKER && [ "$1" = "--docker" ]; then
  if [ ! -f .env ]; then
    info "Création du fichier .env racine pour Docker Compose..."
    cat > .env << EOF
JWT_SECRET=smartfish-jwt-secret-$(date +%s)
GEMINI_API_KEY=
EOF
    log ".env racine créé"
  fi

  title "🚢 Démarrage Docker Compose"
  docker-compose up -d
  log "Services démarrés !"
  info "Client : http://localhost:5173"
  info "API    : http://localhost:5000/api/health"
  info "DB     : postgresql://smartfish:smartfish123@localhost:5432/smartfish"
  echo ""
  warn "Configurez GEMINI_API_KEY dans le fichier .env (racine du projet)"
  echo ""
  exit 0
fi

# ─── Installation manuelle ───
title "📦 Installation du serveur"

cd server

info "Installation des dépendances npm..."
npm install
log "Dépendances serveur installées"

info "Génération du client Prisma..."
npx prisma generate
log "Client Prisma généré"

info "Push du schéma vers la base de données..."
npx prisma db push 2>/dev/null && log "Schéma synchronisé" || warn "Impossible de pusher le schéma. PostgreSQL est-il lancé ?"

if [ "$1" = "--seed" ]; then
  info "Seed de la base de données..."
  node prisma/seed.js 2>/dev/null && log "Données de seed importées" || warn "Seed ignoré (peut-être déjà fait)"
fi

cd ..

# ─── Client ───
title "🎨 Installation du client"

cd client

info "Installation des dépendances npm..."
npm install
log "Dépendances client installées"

cd ..

# ─── Démarrage ───
title "🚀 Démarrage"

echo ""
echo -e "  ${BOLD}SmartFish Sogediproma${NC}"
echo ""
echo -e "  ${GREEN}Serveur API${NC}  : http://localhost:5000"
echo -e "  ${GREEN}Health check${NC} : http://localhost:5000/api/health"
echo -e "  ${GREEN}Client${NC}      : http://localhost:5173"
echo ""
echo -e "  ${YELLOW}Pour démarrer les services :${NC}"
echo ""
echo -e "    cd server && npm run dev    # Terminal 1"
echo -e "    cd client && npm run dev    # Terminal 2"
echo ""
echo -e "  ${YELLOW}Ou avec Docker :${NC}"
echo -e "    ./setup.sh --docker"
echo ""
echo -e "  ${YELLOW}Variables requises :${NC}"
echo -e "    GEMINI_API_KEY  → Google AI Studio (https://aistudio.google.com/)"
echo ""

# ─── Vérification finale ───
title "✅ Vérification"

[ -f server/src/index.js ] && log "Serveur : prêt" || err "Serveur : fichier manquant"
[ -f client/src/main.jsx ] && log "Client  : prêt" || err "Client  : fichier manquant"
[ -f server/prisma/schema.prisma ] && log "Prisma  : prêt" || err "Prisma : schéma manquant"
[ -f docker-compose.yml ] && log "Docker  : prêt" || warn "Docker : docker-compose.yml manquant"
[ -f README.md ] && log "README  : présent" || warn "README.md manquant"

echo ""
log "Installation terminée ! 🐟"
echo ""
