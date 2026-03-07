from pydantic import BaseModel, EmailStr, Field

class RegisterSchema(BaseModel):
    name: str = Field(min_length=3, examples=["João Silva"])
    email: EmailStr = Field(examples=["joao@empresa.com"])
    password: str = Field(min_length=6, examples=["senha123"])

class LoginSchema(BaseModel):
    email: EmailStr = Field(examples=["joao@empresa.com"])
    password: str = Field(examples=["senha123"])

class LogoutSchema(BaseModel):
    refresh_token: str

class RefreshSchema(BaseModel):
    refresh_token: str

class LoginResponseSchema(BaseModel):
    access_token: str
    refresh_token: str
    user: dict

class RegisterResponseSchema(BaseModel):
    id: int
    email: str