from repositories.user_repository import UserRepository
from datetime import datetime, timedelta
from flask import jsonify
from dotenv import load_dotenv
import bcrypt
import jwt
import os

load_dotenv()

repo = UserRepository()
JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET ESTÁ VAZIO OU NÃO FOI POSSÍVEL CARREGAR")

class UserService:
    def getAll(self):
        try:
            users = repo.getAll()
            if not users:
                return jsonify({
                    "error": "Nenhum usuário encontrado"
                }), 404
            
            return jsonify({
                "users": [u.to_dict() for u in users]
            })
        
        except Exception as e:
            return jsonify({
                "error": "Erro interno",
                "message": str(e)
            }), 500

    def getById(self, id):
        try:
            user = repo.getById(id)
            if not user:
                return jsonify({"error": "Usuário não encontrado"}), 404

            return jsonify({
                "user": user.to_dict()
            })
        
        except Exception as e:
            return jsonify({
                "error": "Erro interno",
                "message": str(e)
            }), 500

    def register(self, username, email, password):
        try:
            user = repo.getByEmail(email)
            if user:
                return jsonify({
                    "error": "Email existente"
                }), 400

            hash = bcrypt.hashpw(
                password.encode("utf-8"),
                bcrypt.gensalt()
            )

            success = repo.create(
                username,
                email,
                hash
            )
        
            if not success:
                return jsonify({
                    "error": "Erro ao criar usuário"
                }), 400

            return jsonify({
                "message": "Usuário criado com sucesso"
            })
        except Exception as e:
            return jsonify({
                "error": "Erro interno",
                "message": str(e)
            }), 500

    def login(self, email, password):
        try:
            user = repo.getByEmail(email)
            if not user:
                return jsonify({
                    "error": "Email inválido"
                }), 401

            if not bcrypt.checkpw(
                password.encode("utf-8"),
                user.password
            ):
                return jsonify({
                    "error": "Senha inválida"
                }), 401

            token = jwt.encode(
                {
                    "id": user.id,
                    "exp": datetime.utcnow() + timedelta(hours=1)
                },
                JWT_SECRET,
                algorithm="HS256"
            )
            
            return jsonify({
                "token": token,
                "user": user.to_dict()
            })
        
        except Exception as e:
            print(f"Erro: {e}")
            return jsonify({
                "error": "Erro interno",
                "message": str(e)
            }), 500