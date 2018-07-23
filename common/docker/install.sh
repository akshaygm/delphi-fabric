#!/usr/bin/env bash
set -e
fcn=$1
remain_params=""
for ((i = 2; i <= ${#}; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done

dockerVersion=17.12
composeVersion=1.14.0
jqVersion=1.5
while getopts "d:c:j:" shortname $remain_params; do
	case $shortname in
	d)
		echo "docker-ce version (default: ${dockerVersion}) ==> $OPTARG"
		dockerVersion="$OPTARG"
		;;
	c)
		echo "docker-compose version (default: $composeVersion) ==> $OPTARG"
		composeVersion="$OPTARG"
		;;
	j)
		echo "jq version (default: $jqVersion) ==> $OPTARG"
		jqVersion="$OPTARG"
		;;
	?)
		echo "unknown argument"
		exit 1
		;;
	esac
done

function installjq() {
	if ! jq --version | grep $jqVersion; then
	    if [ $(uname)=="Darwin" ];then
	        brew install jq
	        return
	    fi
		# install jq for parsing json content
		sudo apt-get update
		sudo apt-get -qq install -y jq=${jqVersion}*
	fi
}

function installCompose() {
	if ! docker-compose version | grep $composeVersion; then
		curl -L https://github.com/docker/compose/releases/download/${composeVersion}/docker-compose-$(uname -s)-$(uname -m) >docker-compose
		chmod +x docker-compose
		sudo mv docker-compose /usr/local/bin/docker-compose
	fi
}

function default() {
	if ! docker version | grep $dockerVersion; then
		# install docker-ce
		curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
		sudo apt-key fingerprint 0EBFCD88
		sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
		sudo apt-get update
		sudo apt-get -qq install -y --allow-downgrades docker-ce=${dockerVersion}*
	fi
	installjq
}

if [ -n "$fcn" ]; then
	$fcn
else
	default
fi
