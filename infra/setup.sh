#!/bin/bash
# ============================================================
#  setup.sh — Preparación inicial de la VM MiniMarket
#  Se ejecuta ANTES de Ansible (provision shell)
# ============================================================

set -e
echo "======================================================="
echo "  MiniMarket — Configuración inicial de la VM"
echo "======================================================="

# 1. Actualizar lista de paquetes
echo "[1/4] Actualizando repositorios..."
sudo apt-get update -y

# 2. Instalar Ansible (requerido por ansible_local)
echo "[2/4] Instalando Ansible..."
sudo apt-get install -y ansible

# 3. Instalar curl y git (necesarios para el playbook)
echo "[3/4] Instalando curl y git..."
sudo apt-get install -y curl git

# 4. Instalar ufw (firewall interno de la VM)
echo "[4/4] Instalando ufw..."
sudo apt-get install -y ufw

echo "======================================================="
echo "  Setup inicial completado — lanzando Ansible..."
echo "======================================================="
