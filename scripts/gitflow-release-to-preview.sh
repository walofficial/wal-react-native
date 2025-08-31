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

echo "Updating ${RELEASE_BRANCH}..."
git checkout "${RELEASE_BRANCH}"
git pull --rebase --autostash || git pull --rebase

echo "Updating ${STAGING_BRANCH}..."
git checkout "${STAGING_BRANCH}"
git pull --rebase --autostash || git pull --rebase

echo "Merging ${RELEASE_BRANCH} -> ${STAGING_BRANCH}..."
git merge --no-ff "${RELEASE_BRANCH}"

echo "Pushing ${STAGING_BRANCH} to origin..."
git push origin "${STAGING_BRANCH}"

echo "Release merged to preview. Validate on preview before promoting to main."


