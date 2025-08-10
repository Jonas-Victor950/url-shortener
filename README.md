# URL Shortener – NestJS + TypeScript + Prisma

Encurtador de URLs com autenticação JWT, contagem de cliques, soft delete e documentação Swagger. Preparado para rodar via Docker Compose, com testes unitários e validações em DTOs.

---

## Índice
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar (recrutador)](#como-rodar-recrutador)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Endpoints principais](#endpoints-principais)
- [Autenticação (JWT)](#autenticação-jwt)
- [Validação & Tratamento de erros](#validação--tratamento-de-erros)
- [Testes](#testes)

---

## Arquitetura

Aplicação **monolítica** NestJS organizada em módulos (auth, urls) com **Prisma** como ORM para Postgres. O redirecionamento incrementa métricas de clique em **transação**.

```
           +-------------------+
           |   Client/Browser  |
           +---------+---------+
                     |
                     | HTTP
                     v
            +--------+---------+
            |   NestJS API     |
            |  - Auth (JWT)    |
            |  - URLs          |
            |  - Swagger       |
            |  - Validation    |
            +----+--------+----+
                 |        |
     Prisma ORM  |        | Redirect 302 + contabilização
                 v        v
           +-----+--------+-----+
           |   PostgreSQL DB    |
           |  User, Url, Click  |
           +--------------------+
```

- **Soft delete:** registros com `deletedAt != null` são ignorados em leituras/escritas.
- **Código curto:** 6 caracteres (base62), com retry em colisão (`nanoid`).
- **Clicks:** grava `Click` + incrementa `Url.clickCount` na mesma transação.

---

## Tecnologias
- **Node.js** + **TypeScript**
- **NestJS** (REST, Guards, Pipes, Swagger)
- **Prisma** (ORM) + **PostgreSQL**
- **JWT** (`@nestjs/jwt`, `passport-jwt`)
- **class-validator / class-transformer**
- **Jest** (testes unitários)
- **Docker / docker-compose**
- **Swagger/OpenAPI**

---

## Funcionalidades
- Cadastro e login de usuário (email/senha) → **JWT Bearer**
- **POST /shorten** público (com ou sem autenticação)
  - Se autenticado, associa `userId` ao encurtado
- **GET /:code** redireciona e contabiliza clique
- **GET /user/urls** (auth) lista encurtados do usuário + `clickCount`
- **PATCH /user/urls/:id** (auth) atualiza destino (`original`)
- **DELETE /user/urls/:id** (auth) **soft delete**
- **Swagger** com exemplos e Bearer auth
- **Validação** de entrada em todos os DTOs

---

## Estrutura de pastas
```
src/
 ├─ auth/
 │   ├─ dto/
 │   │   ├─ login.dto.ts
 │   │   └─ register.dto.ts
 │   ├─ auth.controller.ts
 │   ├─ auth.module.ts
 │   ├─ auth.service.ts
 │   ├─ jwt.strategy.ts
 │   └─ optional-jwt.guard.ts
 ├─ urls/
 │   ├─ dto/
 │   │   ├─ shorten.dto.ts
 │   │   └─ update-url.dto.ts
 │   ├─ urls.controller.ts
 │   ├─ urls.module.ts
 │   └─ urls.service.ts
 ├─ prisma/
 │   ├─ prisma.service.ts
 ├─ main.ts
prisma/
 └─ schema.prisma
test/
 ├─ mocks/prisma.mock.ts
 └─ (specs *.spec.ts)
Dockerfile
docker-compose.yml
.env.example
README.md
```

---

## Como rodar (recrutador)

### 1) Clonar e preparar ENV
```bash
git clone <repo-url> url-shortener
cd url-shortener
cp .env.example .env
```

**`.env`** (exemplo):
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/urlshortener?schema=public
JWT_SECRET=super-secret-jwt
JWT_EXPIRATION=1d
NODE_ENV=development
PORT=3000
APP_DOMAIN=http://localhost:3000
```

### 2) Subir com Docker Compose
```bash
docker compose up -d --build
```

### 3) Abrir documentação (Swagger)
- **http://localhost:3000/api/docs**

### 4) Fluxo de teste rápido (via Swagger)
1. **POST /auth/register**
2. Authorize com Bearer token
3. **POST /shorten**
4. **GET /user/urls**
5. Acesse shortUrl no navegador
6. **PATCH /user/urls/{id}**
7. **DELETE /user/urls/{id}**

---

## Endpoints principais

### Público
- **POST `/shorten`**
- **GET `/:code`**

### Autenticados (Bearer)
- **GET `/user/urls`**
- **PATCH `/user/urls/:id`**
- **DELETE `/user/urls/:id`**

### Auth
- **POST `/auth/register`**
- **POST `/auth/login`**

---

## Autenticação (JWT)
- **Geração**: `AuthService` assina com `JWT_SECRET`.
- **Validação**: `JwtStrategy` valida token.
- **Guards**: `AuthGuard('jwt')` e `OptionalJwtAuthGuard`.

---

## Validação & Tratamento de erros
- **Validação**: `ValidationPipe` global
- **Erros de domínio**: Exceptions do NestJS
- **Prisma**: filtrados por Exception Filter global

---

## Testes
- **Unitários (Jest)** para Auth e URLs
- **npm test**
