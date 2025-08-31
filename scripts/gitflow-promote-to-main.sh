#!/usr/bin/env bash

set -euo pipefail

MAIN_BRANCH="main"
STAGING_BRANCH="preview"

if [[ ${1-} == "" ]]; then
  echo "Usage: $0 <release-name-or-version>" >&2
  exit 1
fi

RELEASE_NAME="$1"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

echo "Fetching latest refs..."
git fetch --all --prune

echo "Ensuring ${STAGING_BRANCH} is up to date..."
git checkout "${STAGING_BRANCH}"
git pull --rebase --autostash || git pull --rebase

echo "Creating PR ${STAGING_BRANCH} -> ${MAIN_BRANCH}..."
if command -v gh >/dev/null 2>&1; then
  gh pr create \
    --base "${MAIN_BRANCH}" \
    --head "${STAGING_BRANCH}" \
    --title "chore(release): ${RELEASE_NAME} to main" \
    --body "Promote preview to main for release ${RELEASE_NAME}. Tagging and git-flow finish happen after merge." \
    --draft || true
  echo "Opened draft PR to main (or it already exists)."
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
  echo "Open PR: ${REPO_URL}/compare/${MAIN_BRANCH}...${STAGING_BRANCH}?expand=1"
fi

echo "After merge to main, manually tag and finish release if desired:"
echo "  git tag -a v${RELEASE_NAME} -m 'Release ${RELEASE_NAME}' && git push origin --tags"
echo "  git flow release finish -m 'Release ${RELEASE_NAME}' '${RELEASE_NAME}' && git push origin dev main"


