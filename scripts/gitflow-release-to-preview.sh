#!/usr/bin/env bash

set -euo pipefail

STAGING_BRANCH="preview"

if [[ ${1-} == "" ]]; then
  echo "Usage: $0 <release-name-or-version>" >&2
  exit 1
fi

RELEASE_NAME="$1"
RELEASE_BRANCH="release/${RELEASE_NAME}"

if ! git rev-parse --verify -q "${RELEASE_BRANCH}" >/dev/null; then
  echo "Release branch ${RELEASE_BRANCH} does not exist. Start it first." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

echo "Fetching latest refs..."
git fetch --all --prune

echo "Ensuring ${RELEASE_BRANCH} is up to date and pushed..."
git checkout "${RELEASE_BRANCH}"
git pull --rebase --autostash || git pull --rebase
git push -u origin "${RELEASE_BRANCH}"

echo "Preparing PR ${RELEASE_BRANCH} -> ${STAGING_BRANCH}..."
if command -v gh >/dev/null 2>&1; then
  gh pr create \
    --base "${STAGING_BRANCH}" \
    --head "${RELEASE_BRANCH}" \
    --title "chore(release): ${RELEASE_NAME} to preview" \
    --body "This PR merges release ${RELEASE_NAME} into preview for validation." \
    --draft || true
  echo "Opened draft PR to preview (or it already exists)."
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
  echo "Open PR: ${REPO_URL}/compare/${STAGING_BRANCH}...${RELEASE_BRANCH}?expand=1"
fi

echo "Validate on preview after PR merge."


