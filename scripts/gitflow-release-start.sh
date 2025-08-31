#!/usr/bin/env bash

set -euo pipefail

DEV_BRANCH="dev"

if [[ ${1-} == "" ]]; then
  echo "Usage: $0 <release-name-or-version>" >&2
  exit 1
fi

RELEASE_NAME="$1"
RELEASE_BRANCH="release/${RELEASE_NAME}"

# Ensure clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

echo "Fetching latest refs..."
git fetch --all --prune

echo "Checking out ${DEV_BRANCH} and updating..."
git checkout "${DEV_BRANCH}"
git pull --rebase --autostash || git pull --rebase

if git rev-parse --verify -q "${RELEASE_BRANCH}" >/dev/null; then
  echo "Release branch ${RELEASE_BRANCH} already exists locally. Resuming..."
else
  echo "Starting git-flow release ${RELEASE_NAME} from ${DEV_BRANCH}..."
  git flow release start "${RELEASE_NAME}"
fi

echo "Pushing ${RELEASE_BRANCH} to origin..."
git push -u origin "${RELEASE_BRANCH}"

echo "Release branch created: ${RELEASE_BRANCH}"
echo "Next: run 'npm run release:preview -- ${RELEASE_NAME}' to merge it into preview."


