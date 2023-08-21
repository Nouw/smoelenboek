cd frontend

GIT_COMMIT=1

if [[ $* = *--patch* ]]; then
  yarn version patch
elif [[ $* = *--minor* ]]; then
  yarn version minor
elif [[ $* = *--none* ]]; then
    GIT_COMMIT=0
else
  echo "Run with either --patch / --minor for version change or --none to not create a git tag"
  exit
fi

VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

yarn build

if [[ "${GIT_COMMIT}" = 1 ]]; then
  read -p "If compilation went well, press any key to continue with deployment of ${VERSION}. Otherwise do CTRL+C"
else
  read -p "If compilation went well, press any key to continue with creating distribution files for ${VERSION}. NO GIT TAG WILL BE CREATED! Otherwise do CTRL+C"
fi

echo
echo "## DEPLOYING ##"

if [[ "${GIT_COMMIT}" = 1 ]]; then
  echo "Adding all changes to GIT"
  git add -A
  read -p "About to commit changes, press any key to continue. Do CTRL+C to abort."
  git commit --allow-empty-message
  if [ $? -eq 0 ]
  then
    echo "GIT commit completed"
    git tag -a "v${VERSION}" -m "Version ${VERSION}"
    echo "Pushing version to remote"
    git push --follow-tags --set-upstream origin "$(git branch --show-current)"

    scp -r dist/ deb95993@s243.webhostingserver.nl:/domains/usvprotos.nl/smoelenboek/frontend
  else
    echo "GIT commit failed, aborting!"
    exit
  fi
fi

