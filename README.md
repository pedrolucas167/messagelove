# MessageLove ❤️

![License: MIT](https://img.shields.io/badge/License-MIT-f7b267?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/pedrolucas167/messagelove?style=for-the-badge&color=e74c3c)
![Repo size](https://img.shields.io/github/repo-size/pedrolucas167/messagelove?style=for-the-badge&color=8e44ad)

> Uma plataforma completa para criar e compartilhar mensagens personalizadas e memoráveis para momentos especiais.

---

## ✨ Funcionalidades

-   **Autenticação Segura de Usuários** Sistema completo de registro e login com senhas criptografadas e tokens de sessão (JWT).

-   **Dashboard Pessoal** Após o login, cada usuário tem acesso a um painel para visualizar todos os cartões que já criou.

-   **Cartões 100% Personalizáveis** Permite adicionar nome, destinatário, data, mensagem pessoal e mídias.

-   **Upload Seguro de Fotos para a Nuvem** As imagens são enviadas diretamente para a **AWS S3**, garantindo segurança, performance e escalabilidade.

-   **Integração com Vídeos do YouTube** Incorpore vídeos do YouTube em seus cartões, com a opção de definir um tempo de início específico.

-   **Segurança Reforçada** O backend conta com middlewares de segurança como Helmet, CORS configurado e Rate Limiting para proteção contra ataques.

-   **Links Únicos e Compartilháveis** Cada cartão gerado possui um link único para fácil envio e acesso por qualquer pessoa.

---

## 🚀 Tecnologias Utilizadas

O projeto foi construído com uma arquitetura moderna separando Frontend e Backend.

### Frontend

-   **HTML5 & CSS3:** Estrutura semântica com estilização moderna e responsiva.
-   **Tailwind CSS:** Framework utility-first para a criação da nova interface, garantindo um design elegante e adaptável.
-   **JavaScript Puro (Vanilla JS ES6+):** Lógica de frontend modularizada (IIFE), gerenciamento de estado e interatividade completa com a API, sem a necessidade de frameworks.
-   **YouTube IFrame Player API:** Para a incorporação e controle de vídeos.

### Backend

-   **Node.js & Express.js:** Base do servidor, gerenciando rotas, middlewares e a lógica da API RESTful.
-   **PostgreSQL & Sequelize (ORM):** Banco de dados relacional robusto gerenciado pelo Sequelize, que mapeia os modelos de dados e facilita as queries.
-   **Autenticação e Segurança:**
    -   **`jsonwebtoken` (JWT):** Geração de tokens para gerenciamento de sessões seguras.
    -   **`bcrypt`:** Criptografia de senhas para armazenamento seguro.
    -   **`cors`:** Middleware para permitir requisições cross-origin de forma segura.
    -   **`helmet`:** Adiciona uma camada de segurança ao definir diversos cabeçalhos HTTP.
    -   **`express-rate-limit`:** Proteção contra ataques de força bruta.
-   **Upload de Arquivos:**
    -   **`multer`:** Middleware para lidar com o upload de arquivos `multipart/form-data`.
    -   **AWS SDK v3 (`@aws-sdk/client-s3`):** Integração para enviar os arquivos para o bucket S3 da Amazon.
-   **Validação e Logging:**
    -   **`express-validator`:** Validação e sanitização robusta dos dados de entrada nas rotas.
    -   **`winston`:** Sistema de logging avançado para monitoramento e debug em produção.
-   **Gerenciamento de Ambiente:**
    -   **`dotenv`:** Para gerenciar variáveis de ambiente de forma segura.

---

## 📝 Licença

Distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais informações.

---

Feito com ❤️ por [**Pedro Marques**](https://pedrolucas167.github.io/portfolio/)
