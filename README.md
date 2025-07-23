# URL Shortener API

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Instalação e Execução](#instalação-e-execução)
- [Documentação da API](#documentação-da-api)
- [Autenticação](#autenticação)
- [Exemplos de Uso](#exemplos-de-uso)
- [Testes](#testes)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Troubleshooting](#troubleshooting)
- [Performance e Otimizações](#performance-e-otimizações)
- [Segurança](#segurança)

## Sobre o Projeto

Esta é uma **API RESTful para encurtamento de URLs**. O projeto demonstra conhecimentos em arquitetura limpa, boas práticas de desenvolvimento, testes automatizados e tecnologias modernas do ecossistema Node.js.

### Casos de Uso

- **Usuários Anônimos**: Podem criar URLs encurtadas sem necessidade de cadastro
- **Usuários Autenticados**: Têm acesso completo ao CRUD de URLs e controle de acesso

## Arquitetura

O projeto segue os princípios da **Clean Architecture** e **Domain-Driven Design (DDD)**, organizando o código em camadas bem definidas:

```
┌─────────────────────────────────────────┐
│           Controllers Layer             │  ← HTTP Requests/Responses
├─────────────────────────────────────────┤
│            Use Cases Layer              │  ← Business Logic
├─────────────────────────────────────────┤
│           Repository Layer              │  ← Data Access Abstraction
├─────────────────────────────────────────┤
│            Database Layer               │  ← Prisma ORM + PostgreSQL
└─────────────────────────────────────────┘
```

### Padrões de Design Implementados

- **Repository Pattern**: Abstração do acesso a dados
- **Use Case Pattern**: Encapsulamento da lógica de negócio
- **Dependency Injection**: Inversão de dependências via NestJS
- **DTO Pattern**: Validação e transformação de dados
- **Strategy Pattern**: Implementado na autenticação JWT

## Funcionalidades

### Autenticação & Autorização

- **Registro de usuários** com validação de email único
- **Login com JWT** e tokens com expiração configurável
- **Proteção de rotas** com guards personalizados
- **Hash seguro de senhas** usando bcrypt

### Gerenciamento de URLs

- **Encurtamento de URLs** com códigos únicos de 6 caracteres
- **URLs anônimas** (não vinculadas a usuários)
- **URLs autenticadas** (vinculadas ao usuário criador)
- **Redirecionamento automático** com contagem de cliques
- **CRUD completo** para usuários autenticados:
  - Listar URLs do usuário
  - Atualizar URL original
  - Deletar URLs (soft delete)

### Analytics & Monitoramento

- **Contagem de cliques** para cada URL
- **Timestamps** de criação e atualização
- **Soft delete** para manutenção do histórico
- **Logs estruturados** para auditoria

### Validação & Segurança

- **Validação de URLs** com class-validator
- **Sanitização de dados** de entrada
- **Controle de acesso** baseado em propriedade

## Tecnologias

### Backend Core

- **[NestJS](https://nestjs.com/)** `^10.0.0` - Framework backend progressivo
- **[TypeScript](https://www.typescriptlang.org/)** `^5.1.3` - Superset tipado do JavaScript
- **[Node.js](https://nodejs.org/)** - Runtime JavaScript

### Banco de Dados & ORM

- **[PostgreSQL](https://www.postgresql.org/)** `16-alpine` - Banco de dados relacional
- **[Prisma](https://www.prisma.io/)** `^6.12.0` - ORM moderno e type-safe

### Autenticação & Segurança

- **[Passport.js](http://www.passportjs.org/)** `^0.7.0` - Middleware de autenticação
- **[JWT](https://jwt.io/)** `^11.0.0` - JSON Web Tokens
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** `^6.0.0` - Hash de senhas

### Validação & Transformação

- **[class-validator](https://github.com/typestack/class-validator)** `^0.14.2` - Validação baseada em decorators
- **[class-transformer](https://github.com/typestack/class-transformer)** `^0.5.1` - Transformação de objetos

### Documentação

- **[Swagger](https://swagger.io/)** `^7.4.2` - Documentação automática da API

### Testes

- **[Jest](https://jestjs.io/)** `^29.5.0` - Framework de testes
- **[Supertest](https://github.com/visionmedia/supertest)** `^7.0.0` - Testes de HTTP

### DevOps & Ferramentas

- **[Docker](https://www.docker.com/)** - Containerização
- **[ESLint](https://eslint.org/)** `^8.0.0` - Linting de código
- **[Prettier](https://prettier.io/)** `^3.0.0` - Formatação de código

### Utilitários

- **[nanoid](https://github.com/ai/nanoid)** `^5.1.5` - Geração de IDs únicos
- **[dotenv](https://github.com/motdotla/dotenv)** `^17.2.0` - Gerenciamento de variáveis de ambiente

## Estrutura do Projeto

```
short-code/
├── src/                          # Código fonte principal
│   ├── modules/                  # Módulos funcionais da aplicação
│   │   ├── auth/                 # Módulo de autenticação
│   │   │   ├── auth.controller.ts    # Controller de autenticação
│   │   │   ├── auth.service.ts       # Serviço de autenticação
│   │   │   ├── auth.module.ts        # Módulo de autenticação
│   │   │   ├── dto/                  # Data Transfer Objects
│   │   │   │   ├── create-auth.dto.ts
│   │   │   │   └── update-auth.dto.ts
│   │   │   ├── use-cases/           # Casos de uso do negócio
│   │   │   │   ├── create-account.use-case.ts
│   │   │   │   ├── login.use-case.ts
│   │   │   │   └── index.ts
│   │   │   ├── repository/          # Camada de acesso aos dados
│   │   │   │   ├── create-account.repository.ts
│   │   │   │   ├── find-by-email.repository.ts
│   │   │   │   ├── login.repository.ts
│   │   │   │   └── index.ts
│   │   │   └── test/                # Testes unitários
│   │   │       ├── auth.controller.spec.ts
│   │   │       ├── auth.service.spec.ts
│   │   │       ├── create-account.use-case.spec.ts
│   │   │       └── login.use-case.spec.ts
│   │   └── url/                  # Módulo de URLs
│   │       ├── url.controller.ts     # Controller de URLs
│   │       ├── url.service.ts        # Serviço de URLs
│   │       ├── url.module.ts         # Módulo de URLs
│   │       ├── dto/                  # Data Transfer Objects
│   │       │   ├── create-url.dto.ts
│   │       │   └── update-url.dto.ts
│   │       ├── use-case/            # Casos de uso do negócio
│   │       │   ├── shorten-url.use-case.ts
│   │       │   ├── redirect-to-original.use-case.ts
│   │       │   ├── find-url-by-user.use-case.ts
│   │       │   ├── update-url.use-case.ts
│   │       │   ├── delete-url.use-case.ts
│   │       │   └── index.ts
│   │       ├── repository/          # Camada de acesso aos dados
│   │       │   ├── create-url.repository.ts
│   │       │   ├── find-by-short-url.repository.ts
│   │       │   ├── find-by-id.repository.ts
│   │       │   ├── find-url-by-user.repository.ts
│   │       │   ├── update-url.repository.ts
│   │       │   ├── delete-url.repository.ts
│   │       │   ├── increment-click.repository.ts
│   │       │   └── index.ts
│   │       └── test/                # Testes unitários
│   │           ├── url.controller.spec.ts
│   │           ├── shorten-url.use-case.spec.ts
│   │           ├── redirect-to-original.use-case.spec.ts
│   │           ├── find-by-user.use-case.spec.ts
│   │           ├── update-url.use-case.spec.ts
│   │           └── delete-url.use-case.spec.ts
│   ├── shared/                   # Código compartilhado
│   │   ├── databases/            # Configuração de banco
│   │   │   └── prisma.database.ts
│   │   ├── interfaces/           # Interfaces TypeScript
│   │   │   └── User.ts
│   │   ├── strategies/           # Estratégias de autenticação
│   │   │   └── jwt.strategy.ts
│   │   └── utils/               # Funções utilitárias
│   │       ├── createToken.ts
│   │       ├── password.utils.ts
│   │       └── shortenUrl.ts
│   ├── app.controller.ts         # Controller principal
│   ├── app.service.ts           # Serviço principal
│   ├── app.module.ts            # Módulo raiz da aplicação
│   └── main.ts                  # Ponto de entrada da aplicação
├── prisma/                      # Configuração do Prisma ORM
│   ├── schema.prisma            # Schema do banco de dados
│   └── migrations/              # Migrações do banco
│       ├── 20250721153910_create_db/
│       │   └── migration.sql
│       └── migration_lock.toml
├── test/                        # Testes end-to-end
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── http requests/               # Coleção de requisições HTTP (Bruno)
│   ├── auth/                    # Requisições de autenticação
│   │   ├── create account.bru
│   │   └── login.bru
│   ├── url/                     # Requisições de URLs
│   │   ├── short url.bru
│   │   ├── list.bru
│   │   ├── update.bru
│   │   ├── delete.bru
│   │   └── redirect short url.bru
│   ├── environments/            # Ambientes de desenvolvimento
│   │   └── development.bru
│   └── bruno.json
├── docker-compose.yml           # Configuração do Docker
├── package.json                 # Dependências e scripts
├── tsconfig.json                # Configuração TypeScript
├── tsconfig.build.json          # Configuração de build
├── nest-cli.json                # Configuração do NestJS CLI
├── .eslintrc.js                 # Configuração do ESLint
├── .prettierrc                  # Configuração do Prettier
├── .gitignore                   # Arquivos ignorados pelo Git
└── README.md                    # Documentação do projeto
```

### Padrões de Organização

1. **Modularização**: Cada feature possui seu próprio módulo independente
2. **Separação de Responsabilidades**: Controllers, Services, Use Cases e Repositories
3. **Testes Colocados**: Testes próximos ao código que testam
4. **Configuração Centralizada**: Variáveis de ambiente e configurações
5. **Documentação Viva**: Coleção de requisições HTTP para testes manuais

## Configuração do Ambiente

### Pré-requisitos

- **[Node.js](https://nodejs.org/)** v18 ou superior
- **[Docker](https://www.docker.com/)** e **[Docker Compose](https://docs.docker.com/compose/)**
- **[Git](https://git-scm.com/)**

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"

# DB CREDENTIALS
POSTGRES_USER=postgres
POSTGRES_PASSWORD=4bV38FPQwXh6
POSTGRES_DB=url_shortener_db

# JWT KEY
JWT_SECRET=SRprIra9nPg2F5vl
EXPIRES_IN="1d"

```


## Instalação e Execução

### 1. Clone o Repositório

```bash
git clone https://github.com/VitorSLima/short-url.git
cd short-code
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Inicie o Banco de Dados

```bash
# Inicia o PostgreSQL em container Docker
docker-compose up -d

# Verifica se o container está rodando
docker ps
```

### 4. Execute as Migrações

```bash
# Aplica as migrações do banco de dados
npx prisma migrate dev

# (Opcional) Visualiza o banco com Prisma Studio
npx prisma studio
```

### 5. Inicie a Aplicação

```bash
# Modo desenvolvimento (com hot-reload)
npm run start:dev

# Modo produção
npm run build
npm run start:prod

# Modo debug
npm run start:debug
```

### 6. Verifique a Instalação

- **API**: http://localhost:3000
- **Documentação Swagger**: http://localhost:3000/api
- **Prisma Studio**: http://localhost:5555 (se executado)

## Documentação da API

A API possui documentação automática gerada com **Swagger** disponível em:
**[http://localhost:3000/api](http://localhost:3000/api)**

### Resumo dos Endpoints

| Método   | Endpoint               | Descrição                      | Auth     | Request Body          |
| -------- | ---------------------- | ------------------------------ | -------- | --------------------- |
| `POST`   | `/auth/create-account` | Criar nova conta               | Não      | `{ email, password }` |
| `POST`   | `/auth/login`          | Fazer login                    | Não      | `{ email, password }` |
| `POST`   | `/short-url`           | Encurtar URL                   | Opcional | `{ originalUrl }`     |
| `GET`    | `/urls`                | Listar URLs do usuário         | Sim      | -                     |
| `GET`    | `/:shortCode`          | Redirecionar para URL original | Não      | -                     |
| `PATCH`  | `/url/:id`             | Atualizar URL                  | Sim      | `{ originalUrl }`     |
| `DELETE` | `/url/:id`             | Deletar URL                    | Sim      | -                     |

**Legenda**: Sim = Obrigatório | Opcional | Não = Não necessário

### Detalhamento dos Endpoints

#### Autenticação

**POST** `/auth/create-account`

```json
{
  "email": "usuario@exemplo.com",
  "password": "MinhaSenh@123"
}
```

**Resposta**:

```json
{
  "id": "uuid",
  "email": "usuario@exemplo.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**POST** `/auth/login`

```json
{
  "email": "usuario@exemplo.com",
  "password": "MinhaSenh@123"
}
```

#### URLs

**POST** `/short-url`

```json
{
  "originalUrl": "https://www.exemplo.com/pagina-muito-longa"
}
```

**Resposta**:

```json
{
  "shortUrl": "http://localhost:3000/abc123"
}
```

**GET** `/urls` (Requer autenticação)

```json
[
  {
    "id": "uuid",
    "originalUrl": "https://www.exemplo.com",
    "shortCode": "abc123",
    "clicks": 42,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## Autenticação

### JWT (JSON Web Tokens)

A API utiliza **JWT** para autenticação. Após o login ou criação de conta, você receberá um token que deve ser enviado no header `Authorization`:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Fluxo de Autenticação

1. **Criar conta** ou **fazer login**
2. **Receber o token JWT** na resposta
3. **Incluir o token** no header `Authorization` nas requisições protegidas
4. **Token expira** conforme configurado (padrão: 1 dia)

### Endpoints Protegidos

- `GET /urls` - Lista URLs do usuário
- `PATCH /url/:id` - Atualiza URL (apenas do próprio usuário)
- `DELETE /url/:id` - Deleta URL (apenas do próprio usuário)

## Exemplos de Uso

### Usando cURL

**Criar conta**:

```bash
curl -X POST http://localhost:3000/auth/create-account \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

**Fazer login**:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

**Encurtar URL**:

```bash
curl -X POST http://localhost:3000/short-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"originalUrl":"https://www.google.com"}'
```

**Listar URLs**:

```bash
curl -X GET http://localhost:3000/urls \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Usando Bruno (Cliente HTTP)

O projeto inclui uma coleção completa de requisições HTTP na pasta `http requests/` que podem ser utilizadas com o cliente **[Bruno](https://www.usebruno.com/)**.

Para usar:

1. Instale o Bruno
2. Abra a pasta `http requests/`
3. Configure o ambiente em `environments/development.bru`
4. Execute as requisições

### Exemplo Completo de Fluxo

```javascript
// 1. Criar uma conta
const createAccount = await fetch('http://localhost:3000/auth/create-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@teste.com',
    password: 'MinhaSenh@123',
  }),
});

const { token } = await createAccount.json();

// 2. Encurtar uma URL
const shortenResponse = await fetch('http://localhost:3000/short-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    originalUrl: 'https://www.exemplo.com/pagina-muito-longa',
  }),
});

const { shortUrl } = await shortenResponse.json();

// 3. Acessar a URL encurtada (será redirecionado)
window.location.href = shortUrl;
```

## Testes

O projeto possui uma suíte completa de testes unitários e de integração.

### Executando os Testes

```bash
# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com coverage
npm run test:cov

# Testes E2E
npm run test:e2e

# Testes em modo debug
npm run test:debug
```

### Cobertura de Testes

Os testes cobrem:

- **Controllers**: Validação de entrada e saída
- **Use Cases**: Lógica de negócio
- **Repositories**: Acesso aos dados
- **E2E**: Fluxos completos da aplicação

### Estrutura de Testes

```
src/
├── modules/
│   ├── auth/
│   │   └── test/           # Testes unitários do módulo auth
│   └── url/
│       └── test/           # Testes unitários do módulo url
└── test/                   # Testes E2E
```

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run start          # Inicia em modo produção
npm run start:dev      # Inicia com hot-reload
npm run start:debug    # Inicia em modo debug

# Build
npm run build          # Compila o projeto

# Testes
npm run test           # Roda testes unitários
npm run test:watch     # Testes em modo watch
npm run test:cov       # Testes com cobertura
npm run test:e2e       # Testes end-to-end

# Qualidade de Código
npm run lint           # Executa ESLint
npm run format         # Formata código com Prettier

# Banco de Dados
npx prisma migrate dev    # Aplica migrações
npx prisma studio         # Interface visual do banco
npx prisma generate       # Gera cliente Prisma
```

## Troubleshooting

### Problemas Comuns

**1. Erro de conexão com o banco**

```bash
# Verifique se o Docker está rodando
docker ps

# Reinicie o container do banco
docker-compose down && docker-compose up -d
```

**2. Erro "Port 3000 already in use"**

```bash
# Mate o processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Ou use uma porta diferente
PORT=3001 npm run start:dev
```

**3. Prisma Client não atualizado**

```bash
# Regenera o cliente Prisma
npx prisma generate
```

**4. Testes falhando**

```bash
# Limpa cache do Jest
npm test -- --clearCache

# Roda testes individualmente
npm test -- auth.controller.spec.ts
```

### Logs e Debug

**Verificar logs da aplicação**:

```bash
# Logs detalhados em desenvolvimento
LOG_LEVEL=debug npm run start:dev
```

**Verificar logs do banco**:

```bash
# Logs do container PostgreSQL
docker logs postgres_url_shortener
```

### Reset Completo do Ambiente

```bash
# Para e remove containers
docker-compose down -v

# Remove node_modules
rm -rf node_modules

# Reinstala dependências
npm install

# Reinicia ambiente
docker-compose up -d
npx prisma migrate dev
npm run start:dev
```

## Performance e Otimizações

### Otimizações Implementadas

- **Indexação do Banco**: Índices únicos em `email` e `shortCode`
- **Conexão Pool**: Pool de conexões do Prisma otimizado
- **Validação Eficiente**: Validações rápidas com class-validator
- **Soft Delete**: Manutenção do histórico sem perda de dados


### Métricas de Performance

| Operação         | Tempo Médio | Observações           |
| ---------------- | ----------- | --------------------- |
| Login            | ~100ms      | Incluindo hash bcrypt |
| Encurtamento     | ~50ms       | Geração + inserção BD |
| Redirecionamento | ~20ms       | Busca + incremento    |

## Segurança

### Medidas de Segurança Implementadas

- **Hash de Senhas**: bcrypt com salt rounds configurável
- **JWT Seguro**: Tokens com expiração e assinatura
- **Validação de Entrada**: Sanitização de todos os inputs
- **Controle de Acesso**: Usuários só acessam próprios recursos
- **CORS**: Configuração adequada para produção

### Boas Práticas de Segurança

- **Senhas Fortes**: Validação de complexidade
- **Rotação de Secrets**: JWT_SECRET único por ambiente
- **Auditoria**: Logs de todas as operações críticas
- **Sanitização**: Prevenção contra XSS e injeção

### Alertas de Segurança

- **Nunca** exponha `JWT_SECRET` em logs
- **Sempre** use HTTPS em produção
- **Configure** rate limiting para endpoints públicos
- **Monitore** tentativas de acesso não autorizado

---

_Projeto desenvolvido por [Vitor Lima](https://github.com/vitorslima)._
