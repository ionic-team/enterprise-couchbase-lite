#!/bin/bash
cat README.md > docs/couchbase-lite.md
cat CHANGELOG.md >> docs/couchbase-lite.md
PACKAGE_VERSION=$(node -p "require('./package.json').version")
npx replace 'PLUGIN_VERSION' $PACKAGE_VERSION docs/couchbase-lite.md