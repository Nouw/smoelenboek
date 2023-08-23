#!/usr/bin/env sh

######################################################################
# @author      : fabiodijkshoorn (fabiodijkshoorn@$HOSTNAME)
# @file        : deploy
# @created     : Tuesday Aug 22, 2023 21:38:24 CEST
#
# @description :
######################################################################

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
scp -r dist/ deb95993@s243.webhostingserver.nl:domains/usvprotos.nl/smoelenboek/frontend
echo
echo "## Finished deploying ##"
