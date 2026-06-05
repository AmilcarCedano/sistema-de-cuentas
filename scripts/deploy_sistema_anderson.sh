#!/usr/bin/env bash
# =============================================================
#  deploy_sistema_anderson.sh
#  Despliega Sistema de Cuentas en VPS Contabo con datos locales
#  Dominio: sistema-anderson.213.199.58.162.sslip.io
# =============================================================

set -e

VPS_IP="213.199.58.162"
VPS_USER="root"
APP_DIR="/opt/sistema-anderson/app"
REPO_URL="https://github.com/AmilcarCedano/sistema-de-cuentas.git"
DB_PASS="SistemaCuentas2026Secure"
DB_NAME="sistema_cuentas"

echo "============================================================"
echo "  DEPLOY SISTEMA ANDERSON → VPS $VPS_IP"
echo "============================================================"

echo ""
echo "▶ [1/6] Creando directorio en VPS..."
ssh ${VPS_USER}@${VPS_IP} "mkdir -p ${APP_DIR}"

echo ""
echo "▶ [2/6] Clonando/actualizando repositorio..."
ssh ${VPS_USER}@${VPS_IP} "
  if [ -d '${APP_DIR}/.git' ]; then
    cd ${APP_DIR} && git pull
  else
    git clone ${REPO_URL} ${APP_DIR}
  fi
"

echo ""
echo "▶ [3/6] Subiendo dump de base de datos..."
scp dump_sistema_cuentas.sql ${VPS_USER}@${VPS_IP}:/tmp/dump_sistema_cuentas.sql

echo ""
echo "▶ [4/6] Iniciando contenedores Docker..."
ssh ${VPS_USER}@${VPS_IP} "
  cd ${APP_DIR}
  docker compose down --remove-orphans 2>/dev/null || true
  docker compose build --no-cache
  docker compose up -d
"

echo ""
echo "▶ [5/6] Esperando que MySQL arranque (30s)..."
sleep 30

echo ""
echo "▶ [6/6] Importando datos en la BD..."
ssh ${VPS_USER}@${VPS_IP} "
  docker exec -i sistemacuentas-mysql mysql -uroot -p${DB_PASS} ${DB_NAME} < /tmp/dump_sistema_cuentas.sql
  rm /tmp/dump_sistema_cuentas.sql
  echo 'Datos importados correctamente.'
"

echo ""
echo "============================================================"
echo "  ✅ DESPLIEGUE COMPLETADO"
echo ""
echo "  🌐 Sistema:  https://sistema-anderson.213.199.58.162.sslip.io"
echo "  🔗 API:      https://api-sistema-anderson.213.199.58.162.sslip.io"
echo ""
echo "  El certificado HTTPS (Let's Encrypt) se activará"
echo "  automáticamente en ~30 segundos via Traefik."
echo "============================================================"
