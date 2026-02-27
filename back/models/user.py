class User:
    def __init__(self, id, username, email, password, createdAt=None):
        self.id = id
        self.username = username
        self.email = email
        self.password = password
        self.createdAt = createdAt

    def to_dict(self, include_pass=False):
        data = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "createdAt": self.createdAt
        }

        if include_pass:
            data["password"] = self.password

        return data