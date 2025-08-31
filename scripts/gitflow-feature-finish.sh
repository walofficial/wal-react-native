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

FEATURE_BRANCH="feature/${FEATURE_NAME}"

echo "Ensuring ${FEATURE_BRANCH} is pushed..."
git checkout "${FEATURE_BRANCH}" || {
  echo "Feature branch ${FEATURE_BRANCH} not found. Did you run feature:start?" >&2
  exit 1
}
git pull --rebase --autostash || git pull --rebase
git push -u origin "${FEATURE_BRANCH}"

echo "Creating PR ${FEATURE_BRANCH} -> dev..."
if command -v gh >/dev/null 2>&1; then
  gh pr create \
    --base dev \
    --head "${FEATURE_BRANCH}" \
    --title "feat: ${FEATURE_NAME}" \
    --body "Merge feature ${FEATURE_NAME} into dev." \
    --draft || true
  echo "Opened draft PR to dev (or it already exists)."
else
  ORIGIN_URL=$(git remote get-url origin)
  if [[ "${ORIGIN_URL}" =~ ^git@github.com:(.*)\.git$ ]]; then
    REPO_PATH="${BASH_REMATCH[1]}"
    REPO_URL="https://github.com/${REPO_PATH}"
  elif [[ "${ORIGIN_URL}" =~ ^https://github.com/(.*)\.git$ ]]; then
    REPO_PATH="${BASH_REMATCH[1]}"
    REPO_URL="https://github.com/${REPO_PATH}"
  else
    echo "Could not parse origin URL ${ORIGIN_URL}. Please open PR manually." >&2
    exit 1
  fi
  echo "Open PR: ${REPO_URL}/compare/dev...${FEATURE_BRANCH}?expand=1"
fi

echo "Review and merge the PR from ${FEATURE_BRANCH} into dev when ready."


