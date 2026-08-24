#!/usr/bin/env bash
# Launches N minimal Chrome windows tiled across the screen, all pointed at
# the same CrossTalk URL so they join the same windowSync channel.
#
# --app=<url> mode drops the tab strip, address bar, and bookmarks bar —
# what's left is just the native macOS traffic-light buttons (close /
# minimize / maximize) plus normal edge/corner resize.
#
# Each window gets its own --user-data-dir. Without that, `open -na` hands
# the URL to Chrome's *already-running* process over IPC, which ignores
# --window-size/--window-position — you'd get one window per call, but all
# stacked in the same spot. A fresh user-data-dir forces a genuinely new
# process, so the size/position flags actually apply.
#
# macOS only (uses `open -na`). Requires the dev server running (npm run
# dev:https) since the scene uses window.screenX/screenY for sync, which
# needs a real served origin, not file://.
#
# Usage:
#   ./launch-crossTalk.sh [count] [preset] [url]
#   ./launch-crossTalk.sh 3
#   ./launch-crossTalk.sh 3 RadianceCascades
#   ./launch-crossTalk.sh 3 FluidSim https://localhost:3000/crossTalk
#
# The preset is appended as ?preset=<name> so every window deep-links
# straight into it (matched case-insensitively by usePresetsFolder) instead
# of opening on the scene default. A URL in the second slot still works for
# back-compat with the old [count] [url] [preset] order.

set -euo pipefail

COUNT="${1:-3}"
PRESET="${2:-}"
URL="${3:-https://localhost:3000/crossTalk}"

if [[ "$PRESET" == http* ]]; then
  URL="$PRESET"
  PRESET="${3:-}"
fi

rawurlencode() {
  local input="$1"
  local i char encoded=""

  for ((i = 0; i < ${#input}; i++)); do
    char="${input:i:1}"
    case "$char" in
      [a-zA-Z0-9.~_-])
        encoded+="$char"
        ;;
      *)
        printf -v encoded '%s%%%02X' "$encoded" "'$char"
        ;;
    esac
  done

  printf '%s' "$encoded"
}

if [[ -n "$PRESET" ]]; then
  ENCODED_PRESET="$(rawurlencode "$PRESET")"
  if [[ "$URL" == *"?"* ]]; then
    URL+="&preset=$ENCODED_PRESET"
  else
    URL+="?preset=$ENCODED_PRESET"
  fi
fi

SCREEN_W=$(system_profiler SPDisplaysDataType 2>/dev/null | awk '/Resolution/{print $2; exit}')
SCREEN_H=$(system_profiler SPDisplaysDataType 2>/dev/null | awk '/Resolution/{print $4; exit}')
SCREEN_W="${SCREEN_W:-1920}"
SCREEN_H="${SCREEN_H:-1080}"

WIN_W=$(( SCREEN_W / COUNT ))
WIN_H=$(( SCREEN_H * 2 / 3 ))
WIN_Y=80

for ((i = 0; i < COUNT; i++)); do
  WIN_X=$(( i * WIN_W ))
  open -na "Google Chrome" --args \
    --app="$URL" \
    --window-size="$WIN_W,$WIN_H" \
    --window-position="$WIN_X,$WIN_Y" # \
done

#    --user-data-dir="/tmp/eye-candy-crosstalk-1"
