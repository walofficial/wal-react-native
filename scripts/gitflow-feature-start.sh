#!/usr/bin/env bash

set -euo pipefail

if [[ ${1-} == "" ]]; then
  echo "Usage: $0 <feature-name>" >&2
  exit 1
fi

FEATURE_NAME="$1"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

echo "Fetching latest refs..."
git fetch --all --prune

echo "Checking out dev and updating..."
git checkout dev
git pull --rebase --autostash || git pull --rebase

echo "Starting feature ${FEATURE_NAME}..."
git flow feature start "${FEATURE_NAME}"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Feature branch created: ${CURRENT_BRANCH}"
git push -u origin "${CURRENT_BRANCH}"


