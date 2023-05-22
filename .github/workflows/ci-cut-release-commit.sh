LAST_CMT_FILES=$(git diff-tree --no-commit-id --name-only $(git rev-parse --short HEAD) -r)
LAST_CMT_FILE_COUNT=$(echo $LAST_CMT_FILES | wc -l | awk '{$1=$1};1')
PACKAGE_JSON_LAST_CMT=$(echo $LAST_CMT_FILES | grep "package.json" -c | cat)
if [ "$LAST_CMT_FILE_COUNT" != "$PACKAGE_JSON_LAST_CMT" ]; then exit 0; fi

VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json | grep -E "^\d+\.\d+\.\d+$" || echo "prerelease")
if [ "$VERSION" != "prerelease" ]; then exit 1; fi
