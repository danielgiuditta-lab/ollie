#!/usr/bin/env bash
#
# fix-ssh.sh - macOS recovery script for stale SSH sessions, locked ports & Google security agents
#

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

HOST="${1:-dan1.c.googlers.com}"
PORT="${2:-3000}"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE} macOS SSH & Network Port Cleanup for ${HOST}${NC}"
echo -e "${BLUE}=====================================================${NC}\n"

# 1. Kill SSH processes forwarding port 3000 specifically
echo -e "${YELLOW}[1/4] Killing background SSH tunnels forwarding port ${PORT}...${NC}"
pkill -9 -f "ssh.*${PORT}" 2>/dev/null || true
pkill -9 -f "${PORT}:localhost:${PORT}" 2>/dev/null || true
pkill -9 -f "L ${PORT}" 2>/dev/null || true

# 2. Free Local Port (TCP/IPv4/IPv6)
echo -e "${YELLOW}[2/4] Scanning for any remaining processes on local port ${PORT}...${NC}"
PIDS=$(lsof -ti tcp:${PORT} 2>/dev/null || lsof -ti :${PORT} 2>/dev/null) || true

if [ -n "${PIDS}" ]; then
  echo -e "  Found process(es) holding port ${PORT}: ${PIDS}"
  kill -9 ${PIDS} 2>/dev/null || true
  sleep 1
  echo -e "  ${GREEN}✓ Port ${PORT} successfully freed.${NC}"
else
  echo -e "  ${GREEN}✓ Port ${PORT} is clean.${NC}"
fi

# 3. Clear Stale Multiplexing Sockets
echo -e "\n${YELLOW}[3/4] Clearing stale SSH ControlMaster sockets...${NC}"
ssh -O exit "${HOST}" 2>/dev/null || true

SOCKET_DIRS=("${HOME}/.ssh" "${HOME}/.ssh/sockets" "/tmp")
SOCKETS_REMOVED=0

for DIR in "${SOCKET_DIRS[@]}"; do
  if [ -d "${DIR}" ]; then
    FOUND=$(find "${DIR}" -maxdepth 2 \( -name "control-*" -o -name "master-*" -o -name "cm-*" -o -name "ssh-*" \) 2>/dev/null) || true
    if [ -n "${FOUND}" ]; then
      echo -e "  Cleaning socket files in ${DIR}:"
      for file in ${FOUND}; do
        echo -e "    - Removing ${file}"
        rm -f "${file}" 2>/dev/null || true
      done
      SOCKETS_REMOVED=1
    fi
  fi
done

if [ ${SOCKETS_REMOVED} -eq 0 ]; then
  echo -e "  ${GREEN}✓ No stale SSH multiplexing sockets found.${NC}"
else
  echo -e "  ${GREEN}✓ Stale multiplexing sockets cleared.${NC}"
fi

# 4. Reset Google Security Agents & standard ssh-agent
echo -e "\n${YELLOW}[4/4] Terminating hung SSH agents & kickstarting launchctl...${NC}"
pkill -9 -f "gnubby-ssh-agent" 2>/dev/null || true
pkill -9 -f "ssh-agent" 2>/dev/null || true
rm -f /tmp/gnubby-* ~/.gnubby/*socket 2>/dev/null || true

USER_ID=$(id -u)
GNUBBY_SERVICE="gui/${USER_ID}/com.google.corp.gnubby-ssh-agent"

launchctl kickstart -k "${GNUBBY_SERVICE}" 2>/dev/null || launchctl stop com.google.corp.gnubby-ssh-agent 2>/dev/null || true
launchctl start com.google.corp.gnubby-ssh-agent 2>/dev/null || true

if command -v ssh-add &>/dev/null; then
  ssh-add -D &>/dev/null || true
  ssh-add &>/dev/null || true
fi

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN} Success! Port ${PORT} freed and SSH agents reset. ${NC}"
echo -e "${GREEN}=====================================================${NC}\n"
