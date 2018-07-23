#!/usr/bin/env bash
# Install
curl -sSL https://shipyard-project.com/deploy | sudo bash -s
# docker: Error response from daemon: driver failed programming external connectivity on endpoint shipyard-proxy (1a7e920dba7c2b448df12f807f8ba67ab5c52d125347404a8bea49ae329563a0): Error starting userland proxy: listen tcp 0.0.0.0:2375: bind: address already in use.


# uninstall
curl -sSL https://shipyard-project.com/deploy | ACTION=remove sudo -E bash -s cause -E preserves environmental vaiables set

# refresh
curl -sSL https://shipyard-project.com/deploy | ACTION=upgrade sudo bash -s