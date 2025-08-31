#!/usr/bin/env bash

set -euo pipefail

MAIN_BRANCH="main"
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

echo "Ensure preview contains ${RELEASE_BRANCH}..."
git checkout "${STAGING_BRANCH}"
git pull --rebase --autostash || git pull --rebase
git merge --no-ff "${RELEASE_BRANCH}" || true

echo "Promoting to ${MAIN_BRANCH}..."
git checkout "${MAIN_BRANCH}"
git pull --rebase --autostash || git pull --rebase
git merge --no-ff "${STAGING_BRANCH}"

echo "Tagging release v${RELEASE_NAME}..."
git tag -a "v${RELEASE_NAME}" -m "Release ${RELEASE_NAME}"

echo "Pushing ${MAIN_BRANCH} and tags..."
git push origin "${MAIN_BRANCH}"
git push origin --tags

echo "Finishing git-flow release ${RELEASE_NAME} (will merge back to dev)..."
git flow release finish -m "Release ${RELEASE_NAME}" "${RELEASE_NAME}"

echo "Pushing dev and main updates after finish..."
git push origin dev
git push origin main

echo "Release promoted to main and finished."


