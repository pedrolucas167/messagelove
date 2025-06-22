# MessageLove ❤️

![License: MIT](https://img.shields.io/badge/License-MIT-f7b267?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/pedrolucas167/messagelove?style=for-the-badge&color=e74c3c)
![Repo size](https://img.shields.io/github/repo-size/pedrolucas167/messagelove?style=for-the-badge&color=8e44ad)

> Uma plataforma completa para criar e compartilhar mensagens personalizadas e memoráveis para momentos especiais. 🥰

---

## ✨ Funcionalidades Atuais

- **Autenticação Segura de Usuários:** Sistema de registro e login com senhas criptografadas (`bcrypt`) e tokens de sessão (`JWT`) para acesso seguro.
- **Dashboard Pessoal:** Painel exclusivo para cada usuário visualizar e gerenciar seus cartões criados.
- **Cartões 100% Personalizáveis:** Adicione destinatário, mensagem, imagem e vídeos do YouTube com suporte a tempo de início específico.
- **Upload Seguro de Fotos para a Nuvem:** Imagens são armazenadas na **AWS S3** com integração via `multer` e `AWS SDK`, garantindo escalabilidade e segurança.
- **Integração com Vídeos do YouTube:** Incorpore vídeos diretamente nos cartões usando a **YouTube IFrame Player API**.
- **Segurança Reforçada:** Middlewares como `helmet`, `cors`, `express-rate-limit` e validação com `express-validator` protegem contra XSS, CSRF, ataques de força bruta e injeções.
- **Links Únicos e Compartilháveis:** Cada cartão tem um URL único (ex.: `/card.html?id=<cardId>`) para fácil compartilhamento.

---

## 🚀 Funcionalidades Futuras

- **Esquecer Senha:** Implementar recuperação de senha via e-mail com links de redefinição seguros e tokens temporários (expiração em 1 hora).
- **Autenticação pelo Google:** Adicionar login via OAuth 2.0 com Google, permitindo acesso rápido e seguro sem necessidade de senha.
- **Pré-visualização de Cartões:** Exibir miniaturas dos cartões no dashboard com opção de edição ou exclusão.
- **Notificações por E-mail:** Enviar confirmações de criação de cartões ou compartilhamento para o destinatário.
- **Temas Personalizados:** Permitir escolha de temas visuais para os cartões (ex.: cores, fundos).

---

## 🛠️ Tecnologias Utilizadas

O projeto adota uma arquitetura moderna com separação clara entre **Frontend** e **Backend**, utilizando middlewares para segurança, validação e eficiência.

### Frontend

- **HTML5 & CSS3:** Estrutura semântica com design responsivo.
- **Tailwind CSS:** Framework utility-first para estilização ágil e elegante.
- **JavaScript Puro (Vanilla JS ES6+):** Lógica modular com IIFE, gerenciamento de estado e interação com API sem dependência de frameworks.
- **YouTube IFrame Player API:** Controle de vídeos incorporados nos cartões.

### Backend

- **Node.js & Express.js:** Servidor robusto com rotas RESTful e middlewares para processamento de requisições.
- **MongoDB & Mongoose (ODM):** Banco de dados NoSQL com Mongoose para modelagem de dados (usuários, cartões) e queries eficientes.

#### Autenticação e Segurança

- `jsonwebtoken` (JWT): Tokens para sessões seguras.
- `bcrypt`: Criptografia de senhas.
- `cors`: Controle de acesso cross-origin.
- `helmet`: Cabeçalhos HTTP seguros.
- `express-rate-limit`: Proteção contra ataques de força bruta.
- **Middleware Personalizado:** Autenticação de rotas protegidas (`authenticateToken`).

#### Upload de Arquivos

- `multer`: Processamento de uploads `multipart/form-data`.
- `@aws-sdk/client-s3`: Armazenamento de imagens na AWS S3.

#### Validação e Logging

- `express-validator`: Sanitização e validação de entradas.
- `winston`: Logging para monitoramento e depuração.

#### Gerenciamento de Ambiente

- `dotenv`: Variáveis de ambiente seguras.

---

## 📝 Licença

Distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais informações.

---

Feito com ❤️ por [**Pedro Marques**](https://pedrolucas167.github.io/portfolio/)
