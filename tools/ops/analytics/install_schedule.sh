#!/usr/bin/env bash
# Install (or reinstall) the hourly launchd job that refreshes the analytics
# snapshot once per day after 17:00 Asia/Bangkok.   Uninstall:  $0 --uninstall
set -euo pipefail

LABEL="com.pimsuea.analytics"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
TOOLS_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PY="$TOOLS_DIR/.venv/bin/python"
LOG="$TOOLS_DIR/ops/data/analytics/schedule.log"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
if [[ "${1:-}" == "--uninstall" ]]; then
  rm -f "$PLIST"; echo "Removed $LABEL"; exit 0
fi

[[ -x "$PY" ]] || { echo "Missing $PY — create the venv first (see tools/ops/README.md)"; exit 1; }
mkdir -p "$(dirname "$LOG")" "$(dirname "$PLIST")"

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$PY</string><string>-m</string><string>ops.analytics.snapshot</string><string>--if-due</string>
  </array>
  <key>WorkingDirectory</key><string>$TOOLS_DIR</string>
  <key>StartInterval</key><integer>3600</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST

launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Installed $LABEL (hourly check, pulls once/day after 17:00 Bangkok). Log: $LOG"
