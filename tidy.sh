#!/usr/bin/env bash
# Removes macOS junk (._ files, .DS_Store) from the project (not node_modules). Run any time: bash tidy.sh
cd "$(dirname "$0")" || exit 1
find . -path ./node_modules -prune -o \( -name '._*' -o -name '.DS_Store' \) -type f -print -delete | wc -l | xargs echo "junk files removed:"
