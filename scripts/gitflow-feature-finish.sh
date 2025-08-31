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

echo "Finishing feature ${FEATURE_NAME}..."
git flow feature finish -m "Finish feature ${FEATURE_NAME}" "${FEATURE_NAME}"

echo "Pushing dev after feature finish..."
git checkout dev
git push origin dev

echo "Feature ${FEATURE_NAME} merged back to dev."


