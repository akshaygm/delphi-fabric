#!/usr/bin/env bash
CURRENT=$(cd $(dirname ${BASH_SOURCE}); pwd)
set -e
fcn="$1"
if [ -n "$fcn" ]; then
	$fcn
fi
if ! node --version | grep 'v8.'; then
	# install nodejs
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo apt-get -qq install -y nodejs
	npm install $CURRENT
fi
