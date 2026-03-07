#!/bin/sh

echo "Rodando migrations..."
flask db upgrade

echo "Iniciando API..."
exec flask run --host=0.0.0.0 --port=5000
