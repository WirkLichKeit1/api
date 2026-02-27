from database.db import get_db
from models.user import User
from sqlite3 import Error

class UserRepository:
    def getAll(self):
        try:
            with get_db() as cur:
                cur.execute(
                    "SELECT * FROM users"
                )
                rows = cur.fetchall()

                return [User(**row) for row in rows]
        
        except Error as e:
            print(f"Erro ao buscar usuários: {e}")
            return []
        except Exception as e:
            print(f"Erro ao buscar usuários: {str(e)}")
            return []

    def getById(self, id):
        try:
            with get_db() as cur:
                cur.execute(
                    "SELECT * FROM users WHERE id = ?",
                    (id,)
                )
                row = cur.fetchone()
                
                if row:
                    return User(**row)
                return None
        
        except Error as e:
            print(f"Erro ao buscar usuário pelo ID: {e}")
            return None
        except Exception as e:
            print(f"Erro ao buscar usuário pelo ID: {str(e)}")
            return None

    def getByEmail(self, email):
        try:
            with get_db() as cur:
                cur.execute(
                    "SELECT * FROM users WHERE email = ?",
                    (email,)
                )
                row = cur.fetchone()
                
                if row:
                    return User(**row)
                return None
        
        except Error as e:
            print(f"Erro ao buscar usuário pelo email: {e}")
            return None
        except Exception as e:
            print(f"Erro ao buscar usuário pelo email: {e}")
            return None

    def create(self, username, email, password):
        try:
            with get_db() as cur:
                cur.execute(
                    "INSERT INTO users (username, email, password) VALUES (?,?,?)",
                    (username, email, password)
                )
                id = cur.lastrowid
                
                return User(
                    id=id,
                    username=username,
                    email=email,
                    password=password
                )
        
        except Error as e:
            print(f"Erro ao criar usuário: {e}")
            return False
        except Exception as e:
            print(f"Erro ao criar usuário: {str(e)}")
            return False