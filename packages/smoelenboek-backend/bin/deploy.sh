if [[ $* = *--patch* ]]; then
  yarn version patch
elif [[ $* = *--minor* ]]; then
  yarn version minor
fi

VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "## Compiling project ##"
yarn compile

read -p "If compilation went well, press any key to continue with deployment of ${VERSION}. Otherwise do CTRL+C"

echo
echo "## DEPLOYING ##"
ssh deploy@158.101.196.66 "./deploy-oci.sh"
echo
echo "## Finished deploying ##"
