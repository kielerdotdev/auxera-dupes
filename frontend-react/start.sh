#!/bin/bash
set -e
echo "Copying client to storage"

if [ -f "$STORAGE_DIR/index.html" ]; then
    rm -r ${STORAGE_DIR}/*
fi

cp -r /app/build/* ${STORAGE_DIR}/
echo "Client copied to ${STORAGE_DIR}"