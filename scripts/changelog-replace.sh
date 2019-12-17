#!/bin/bash

set -o errexit

npx replace '\([^\s]*github\.com[^\s]*\)' '' CHANGELOG.md
npx replace '^.*standard-version.*$' '' CHANGELOG.md
npx replace '# Change Log' '## Change Log' CHANGELOG.md
npx replace '^##? (\[\d+\.\d+\.\d+\] .*)$' '### $1' CHANGELOG.md