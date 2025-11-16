#!/usr/bin/env bash
# agent/src/start.sh
# Context: supervisor for agent collector. Keeps collector alive and pings backend health endpoint.
# Place at: agent/src/start.sh (chmod +x)
set -e

CONFIG_DIR="${HOME}/.ecosync"
HEARTBEAT_FILE="${CONFIG_DIR}/heartbeat.json"
COLLECTOR_CMD="node src/collector.js"
PING_INTERVAL=${PING_INTERVAL:-15}     # seconds to ping backend
RESTART_MAX_BACKOFF=${RESTART_MAX_BACKOFF:-300} # max backoff seconds

mkdir -p "${CONFIG_DIR}"

# function to write heartbeat
write_heartbeat() {
  echo "{\"timestamp\":\"$(date --iso-8601=seconds)\",\"status\":\"running\"}" > "${HEARTBEAT_FILE}"
}

# exponential backoff restart loop
backoff=1
while true; do
  echo "[agent-supervisor] starting collector: ${COLLECTOR_CMD}"
  write_heartbeat
  # start collector in background and capture pid
  ${COLLECTOR_CMD} &
  pid=$!
  echo "[agent-supervisor] collector pid=${pid}"

  # background process to ping backend periodically (non-blocking)
  ( while kill -0 ${pid} 2>/dev/null; do
      # heartbeat file write
      write_heartbeat
      sleep "${PING_INTERVAL}"
    done ) &

  wait ${pid}
  exitCode=$?
  echo "[agent-supervisor] collector exited with ${exitCode}"

  # if exited 0, shutdown supervisor
  if [ "${exitCode}" -eq 0 ]; then
    echo "[agent-supervisor] collector exited normally. Supervisor stops."
    exit 0
  fi

  # restart with backoff
  echo "[agent-supervisor] restarting collector in ${backoff}s..."
  sleep "${backoff}"
  backoff=$((backoff * 2))
  if [ ${backoff} -gt ${RESTART_MAX_BACKOFF} ]; then
    backoff=${RESTART_MAX_BACKOFF}
  fi
done
