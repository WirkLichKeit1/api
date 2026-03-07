#!/bin/sh

echo "Rodando migrations..."
flask db upgrade

echo "Iniciando API..."
exec flask run --port=5000