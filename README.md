# delphi-fabric

_after first time clone this repository, run   
```$ git submodule update --init --recursive```_
### test on single host:


1. run `$ ./testLocal.sh`
    - it includes
        1. load others config from orgs.json
        2. npm fabric-* updating
        3. generate crypto-config file(default crypto-config.yaml)
        4. run 'cryptogen' binary to generate crypto-materials
        5. generate channel, block config file (default configtx.yaml)
        6. run 'configtxgen' to generate channel, block file
        7. generate docker-compose.yaml

2. in another terminal, run `$ ./docker.sh` to clean and restart network      
 
    
3. Then come back to previous terminal running testBin.sh   
  run `$ node app/testChannel.js`
  to create-channel and join-channel 
4. `$ node app/testInstall.js` to install chaincode and instantiate chaincode
5. `$ node app/testInvoke.js` to invoke chaincode

### channel update (single host mode)

__Description:__  
- assume we have already channel named 'delphiChannel' with 2 orgs 'BU', 'PM'  
- we want to create a new docker container named 'AMContainerName' belonging to a new org 'AM'
- the new peer should work as other existing peers, supporting all chaincode action like instantiate, invoke, etc.
- org 'AM' should be added to 'delphiChannel' config as a 'online update'(not to re-create current channel).

__Steps:__


1. run first 3 steps of `testing on single host'
    ```
    terminal 1:$ ./testLocal.sh
    ...
    terminal 2:$ ./docker.sh
    ...
    terminal 1:$ node app/testChannel.js
        
    ```
2. run:  
    ```
    terminal 1 $ ./testNewOrg.sh
    ```     

### test Swarm mode()
assume we have two physical machine,with main hostName 'ubuntu' with ip `192.168.0.167`,'fabric-swarm-manager' with ip `192.168.0.144`  
0. Prepare:  
    1. if you have run through above 'single host test', you should clean your environment before start. For example, run `$ ./docker.sh down`
    2. on 'ubuntu', run `$ cluster/leaderNode/install.sh` and then `$ cluster/leaderNode/prepare.sh`
    3. on 'fabric-swarm-manager', run `$ cluster/managerNode/install.sh` and then `$ cluster/managerNode/prepare.sh`
1. build up swarm across nodes(1 node means 1 physical machine),   
    my solution is
    
 - On 'ubuntu',run 'docker swarm init'(if you have multiple network adapter, option `--advertise-addr 192.168.0.167` is needed for specify which ip is used to identify this machine)
   
 - On 'ubuntu', run 'docker swarm join-token manager' to print a message like
 >To add a manager to this swarm, run the following command:  
 >     docker swarm join --token SWMTKN-1-3vgv9jebyhdqzid9o5zcyufeciahegbew7mtbfykfpjfk73jbn-e4p28p30jxv1eu5o2lcvcaa2d 192.168.0.167:2377
 - On 'fabric-swarm-manager', run above printed message `docker swarm join --token SWMTKN-1-3vgv9jebyhdqzid9o5zcyufeciahegbew7mtbfykfpjfk73jbn-e4p28p30jxv1eu5o2lcvcaa2d 192.168.0.167:2377` to join swarm  
    (if there is network problem, 'nmap' is a recommended network probing tools:`apt install nmap`)
 - On 'ubuntu' or 'fabric-swarm-manager', check if joining swarm success by `docker node ls` (*means current node)
 > ID                            HOSTNAME               STATUS              AVAILABILITY        MANAGER STATUS  
 > lhpmolwzw60dclsjmr4suufno *   ubuntu                   Ready               Active              Leader
 > tatl890bgusrzww4x5w1ktvjk     fabric-swarm-manager                Ready               Active              Reachable
2. run ./testSwarm.sh   
    it includes:
     - addLabels to node 'ubuntu' as a metadata of NFS shared path
     - generate compose-file for swarm
3. run ./docker-swarm.sh to deploy service   
    TODO: I will optimize this later about preparing and cleaning of swarm             
4.   run `$ node app/testChannel.js`
     to create-channel and join-channel 
5. `$ node app/testInstall.js` to install chaincode and instantiate chaincode
6. `$ node app/testInvoke.js` to invoke chaincode        
 
    
## TODO
- ca-service in node-sdk (in progress)
- endorsement policy config

