#!/usr/bin/env bash
fcn=$1
remain_params=""
for ((i = 2; i <= $#; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done
function createLocal() {
	local name=$1
	local path=$2
	docker volume create --name $name --opt o=bind --opt device=$path --opt type=none
}
function delete() {
	docker volume rm --force $1
}
$fcn $remain_params
