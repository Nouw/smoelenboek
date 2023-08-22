#!/usr/bin/env sh

######################################################################
# @author      : fabiodijkshoorn (fabiodijkshoorn@$HOSTNAME)
# @file        : deploy
# @created     : Tuesday Aug 22, 2023 21:33:53 CEST
#
# @description :
######################################################################

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

echo "Compiling project"
yarn compile

if [[ "${GIT_COMMIT}" = 1 ]]; then
  read -p "If compilation went well, press any key to continue with deployment of ${VERSION}. Otherwise do CTRL+C"

echo
echo "## DEPLOYING ##"
