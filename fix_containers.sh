#!/bin/bash

# Reiniciar y mostrar logs

NAS_USER="smp"
NAS_IP="192.168.178.60"
NAS_PORT="8222"

echo "Reparando estados y obteniendo logs..."
ssh -p ${NAS_PORT} -t ${NAS_USER}@${NAS_IP} "source /etc/profile && \
echo '--- ESTADO DOCKER ---' && sudo docker ps -a && \
echo '--- LOGS GESTOR EVENTOS ---' && sudo docker logs gestoreventos_prod --tail 20"
