# Task Management API

API REST corporativa para gestão de tarefas, construída com Flask. Inspirada em ferramentas como Jira e Trello, oferece suporte a organizações, projetos, tarefas e comentários com autenticação JWT e isolamento multi-tenant.

---

## Tecnologias

- **Python 3.11** + **Flask**
- **Flask-OpenAPI3** — documentação automática Swagger/ReDoc
- **SQLAlchemy** + **Flask-Migrate** — ORM e migrações
- **PyJWT** — autenticação via tokens JWT com rotação de refresh token
- **Pydantic v2** — validação de schemas
- **SQLite** (desenvolvimento) / **MySQL** (produção)
- **Docker** + **Docker Compose**
- **pytest** — testes automatizados

---

## Estrutura do projeto

```
.
├── app/
│   ├── api/v1/          # Blueprints e rotas
│   ├── models/          # Modelos SQLAlchemy
│   ├── repositories/    # Camada de acesso a dados
│   ├── schemas/         # Schemas Pydantic
│   ├── services/        # Lógica de negócio
│   ├── middlewares/     # Autenticação
│   ├── utils/           # JWT, segurança, serialização
│   └── config.py        # Configurações por ambiente
├── migrations/          # Migrações Alembic
├── tests/               # Testes com pytest
├── docker-compose.yml
├── Dockerfile
└── entrypoint.sh
```

---

## Instalação e execução

### Requisitos

- Python 3.11+
- pip

### 1. Clone o repositório e crie o ambiente virtual

```bash
git clone <url-do-repo>
cd <nome-do-repo>
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

```env
SECRET_KEY=sua_chave_secreta_aqui
FLASK_ENV=dev
DATABASE_URL=sqlite:///dev.db  # opcional em dev, usa SQLite por padrão
```

### 3. Execute as migrações e suba a aplicação

```bash
flask db upgrade
flask run
```

A API estará disponível em `http://localhost:5000`.

---

## Docker

Para rodar com Docker em produção:

```bash
cp .env.example .env
# edite o .env com as credenciais do banco

docker compose up --build
```

> O `entrypoint.sh` já executa as migrações automaticamente antes de iniciar a API.

---

## Documentação interativa

Com a aplicação rodando, acesse:

- **Swagger UI** → `http://localhost:5000/openapi/swagger`
- **ReDoc** → `http://localhost:5000/openapi/redoc`

---

## Autenticação

A API usa JWT com dois tokens:

| Token | Duração | Uso |
|---|---|---|
| `access_token` | 15 minutos | Autenticar requisições |
| `refresh_token` | 7 dias | Obter novos tokens |

Envie o `access_token` no header de todas as rotas protegidas:

```
Authorization: Bearer <access_token>
```

O refresh token é de uso único — após ser usado, é invalidado (rotação automática). O logout também invalida o refresh token via blacklist.

---

## Endpoints principais

### Auth

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/register` | Registrar usuário |
| `POST` | `/api/v1/login` | Login |
| `POST` | `/api/v1/refresh` | Renovar tokens |
| `POST` | `/api/v1/logout` | Logout |

### Organizations

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/organizations` | Criar organização |
| `POST` | `/api/v1/organizations/:id/join` | Entrar em uma organização |
| `GET` | `/api/v1/organizations/:id` | Buscar organização |
| `PATCH` | `/api/v1/organizations/:id` | Atualizar organização *(admin)* |
| `DELETE` | `/api/v1/organizations/:id` | Deletar organização *(admin)* |

### Projects

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/projects` | Criar projeto |
| `GET` | `/api/v1/projects` | Listar projetos da organização |
| `GET` | `/api/v1/projects/:id` | Buscar projeto |
| `PATCH` | `/api/v1/projects/:id` | Atualizar projeto |
| `DELETE` | `/api/v1/projects/:id` | Deletar projeto |

### Tasks

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/projects/:id/tasks` | Criar tarefa |
| `GET` | `/api/v1/projects/:id/tasks` | Listar tarefas (com filtros e paginação) |
| `GET` | `/api/v1/projects/:id/tasks/:id` | Buscar tarefa |
| `PATCH` | `/api/v1/projects/:id/tasks/:id` | Atualizar tarefa |
| `DELETE` | `/api/v1/projects/:id/tasks/:id` | Deletar tarefa (soft delete) |

**Filtros disponíveis em `GET /tasks`:** `status`, `priority`, `assigned_to`, `page`, `per_page`

### Comments

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/projects/:id/tasks/:id/comments` | Criar comentário |
| `GET` | `/api/v1/projects/:id/tasks/:id/comments` | Listar comentários |
| `DELETE` | `/api/v1/projects/:id/tasks/:id/comments/:id` | Deletar comentário (somente o autor) |

---

## Multi-tenancy

Todos os recursos (projetos, tarefas, comentários) são isolados por organização. Um usuário só acessa dados da organização à qual pertence. Tentativas de acessar recursos de outra organização retornam `404` — sem revelar que o recurso existe.

O usuário que cria uma organização recebe automaticamente o papel de `admin`.

---

## Testes

```bash
pytest
```

Os testes usam SQLite em memória e são executados em ambiente isolado (`FLASK_ENV=test`). Cada teste roda com o banco limpo.

Para rodar um arquivo específico:

```bash
pytest tests/test_auth.py -v
```

---

## Ambientes

| Variável `FLASK_ENV` | Banco | Debug |
|---|---|---|
| `dev` | SQLite (arquivo local) | ✓ |
| `test` | SQLite (memória) | ✗ |
| `prod` | MySQL via `DATABASE_URL` | ✗ |