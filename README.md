# URL Shortener API

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 📄 Descrição

API RESTful para um encurtador de URLs, desenvolvida como parte de um desafio técnico para uma posição de desenvolvedor backend. O projeto permite que usuários (autenticados ou anônimos) criem, gerenciem e acessem URLs encurtadas.

A arquitetura foi construída utilizando **NestJS**, seguindo princípios de design modular e separação de responsabilidades (controllers, services, use cases, repositories) para garantir um código limpo, escalável e de fácil manutenção.

## ✨ Features

- **Criação de Contas**: Usuários podem se registrar para gerenciar suas URLs.
- **Autenticação JWT**: Sistema de login seguro utilizando JSON Web Tokens.
- **Encurtamento de URLs**:
    - Usuários autenticados podem criar URLs curtas personalizadas e associadas à sua conta.
    - Usuários anônimos também podem criar URLs curtas, que não são vinculadas a nenhuma conta.
- **Gerenciamento de URLs**: Usuários autenticados podem listar, atualizar e deletar as URLs que criaram.
- **Redirecionamento**: Acesso rápido à URL original através do link encurtado.
- **Contagem de Cliques**: Monitoramento do número de acessos para cada URL encurtada.

## 🛠️ Tecnologias Utilizadas

- **Backend**: [NestJS](https://nestjs.com/), [TypeScript](https://www.typescriptlang.org/)
- **Banco de Dados**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Autenticação**: [JWT](https://jwt.io/), [Passport.js](http://www.passportjs.org/)
- **Containerização**: [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)
- **Testes**: [Jest](https://jestjs.io/) (Unitários e E2E)
- **Linting & Formatting**: [ESLint](https://eslint.org/), [Prettier](https://prettier.io/)

## 📂 Estrutura do Projeto

O projeto é organizado em módulos para separar as principais funcionalidades da aplicação:

```
src
├── modules
│   ├── auth/         # Módulo de autenticação (registro, login)
│   └── url/          # Módulo de URLs (encurtar, gerenciar, redirecionar)
└── shared/           # Lógica compartilhada (guards, strategies, database)
```

Dentro de cada módulo, a estrutura segue o padrão:
- **Controllers**: Recebem as requisições HTTP e retornam as respostas.
- **Use Cases**: Orquestram a lógica de negócio principal.
- **Repositories**: Abstraem o acesso e a manipulação de dados do banco.
- **DTOs**: Definem os objetos de transferência de dados.

## 🚀 Como Executar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (v18+)
- [Docker](https://www.docker.com/get-started) e [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto, copiando o conteúdo de `.env.example` (se houver) ou usando o modelo abaixo:

```env
# URL de conexão do PostgreSQL para o Prisma
DATABASE_URL="postgresql://docker:docker@localhost:5432/short-code?schema=public"

# Segredo para a geração dos tokens JWT
JWT_SECRET="seu-segredo-super-secreto"
```

### 4. Inicie o Banco de Dados com Docker

O `docker-compose.yml` irá configurar e iniciar um container com o PostgreSQL.

```bash
docker-compose up -d
```

### 5. Aplique as Migrações do Banco

Este comando irá criar as tabelas no banco de dados com base no schema do Prisma.

```bash
npx prisma migrate dev
```

### 6. Inicie a Aplicação

```bash
# Modo de desenvolvimento com hot-reload
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

## ✅ Executando os Testes

Para rodar os testes e garantir que tudo está funcionando como esperado:

```bash
# Rodar testes unitários
npm run test

# Rodar testes end-to-end (E2E)
npm run test:e2e
```

## Endpoints da API

As requisições de exemplo podem ser encontradas na pasta `/http requests` e podem ser utilizadas com o cliente API [Bruno](https://www.usebruno.com/).

| Método | Rota                  | Descrição                                | Requer Autenticação |
|--------|-----------------------|------------------------------------------|---------------------|
| `POST` | `/auth/register`      | Cria uma nova conta de usuário.          | Não                 |
| `POST` | `/auth/login`         | Autentica um usuário e retorna um token. | Não                 |
| `POST` | `/url`                | Cria uma nova URL encurtada.             | Opcional            |
| `GET`  | `/url`                | Lista as URLs do usuário autenticado.    | Sim                 |
| `PATCH`| `/url/:id`            | Atualiza uma URL existente.              | Sim                 |
| `DELETE`| `/url/:id`           | Deleta uma URL.                          | Sim                 |
| `GET`  | `/:shortUrl`          | Redireciona para a URL original.         | Não                 |

---

_Projeto desenvolvido por [Seu Nome](https://github.com/seu-usuario)._