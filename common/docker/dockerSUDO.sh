#!/usr/bin/env bash
# NOTE PLEASE run this without 'sudo', otherwise ENV $USER will be 'root' instead of current user.
sudo gpasswd -a $USER docker
# NOTE newgrp starts a subshell with the group you specified. So that line in your script will not finish until that subshell is done.
newgrp docker