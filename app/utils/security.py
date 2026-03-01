from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password: str):
    return generate_password_hash(password)

def verify_password(password: str, password_hash: str):
    return check_password_hash(password, password_hash)