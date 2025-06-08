# MessageLove ❤️

![License: MIT](https://img.shields.io/badge/License-MIT-f7b267?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/pedrolucas167/messagelove?style=for-the-badge&color=e74c3c)
![Repo size](https://img.shields.io/github/repo-size/pedrolucas167/messagelove?style=for-the-badge&color=8e44ad)


## ✨ Funcionalidades

-   **Totalmente Personalizável:** Adicione nome, data especial e uma mensagem pessoal.
-   **Armazenamento na Nuvem:** **Upload seguro de fotos para a AWS S3**, garantindo que suas imagens fiquem salvas de forma permanente e escalável.
-   **Suporte a Mídia:** Incorporação de vídeos do YouTube para enriquecer ainda mais a mensagem.
-   **Animações Impactantes:** Uma revelação suave em cascata e um "envelope" interativo para criar antecipação.
-   **Chuva de Emojis:** Uma surpresa final para celebrar o momento e encantar quem recebe.
-   **Link Compartilhável:** Cada cartão gerado possui um link único para ser enviado facilmente.

<br>

## 🚀 Stack Tecnológica

O projeto é dividido em duas partes principais:

-   **Frontend:**
    -   HTML5
    -   CSS3 (com Variáveis e Animações)
    -   JavaScript (Vanilla JS)
    -   YouTube IFrame Player API

-   **Backend:**
    -   Node.js
    -   Express.js
    -   **AWS S3** para armazenamento de objetos (uploads)
    -   **SDK da AWS V3** (`@aws-sdk/client-s3`)
    -   Banco de Dados (ex: PostgreSQL, MongoDB)

<br>

## 🔧 Como Rodar o Projeto Localmente

Para contribuir ou simplesmente testar o projeto na sua máquina, siga estes passos:

### Pré-requisitos

-   [Node.js](https://nodejs.org/) (versão 18 ou superior)
-   [Git](https://git-scm.com/)
-   **Uma conta na AWS** (necessária para o upload de arquivos)

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU-USUARIO/messagelove.git](https://github.com/SEU-USUARIO/messagelove.git)
    cd messagelove
    ```

2.  **Configure o Backend:**

    **2.1. Configuração da AWS S3 (Obrigatório)**

    Este projeto usa AWS S3 para armazenar os uploads de imagens. Para rodar localmente, você precisará configurar seu próprio bucket e credenciais:
    -   No serviço **S3** da AWS, crie um novo bucket e configure-o para acesso público.
    -   No serviço **IAM**, crie um novo usuário com permissões de acesso programático (`AmazonS3FullAccess` para começar).
    -   Gere e guarde o `Access Key ID` e o `Secret Access Key` para este usuário.

    **2.2. Instalação das dependências e variáveis de ambiente**
    ```bash
    cd backend
    npm install
    ```
    -   Copie o arquivo de exemplo de variáveis de ambiente:
    ```bash
    cp .env.example .env
    ```
    -   Abra o arquivo `.env` e preencha **TODAS** as variáveis com suas credenciais do banco de dados e da AWS que você acabou de criar. O arquivo deve se parecer com isto:

    ```env
    # Porta do servidor
    PORT=3001

    # Credenciais do Banco de Dados
    DATABASE_URL="sua_string_de_conexao_aqui"

    # Credenciais e Configurações do AWS S3
    AWS_BUCKET_NAME="o-nome-unico-do-seu-bucket"
    AWS_BUCKET_REGION="a-regiao-que-voce-escolheu"
    AWS_ACCESS_KEY_ID="SUA_ACCESS_KEY_ID_AQUI"
    AWS_SECRET_ACCESS_KEY="SEU_SECRET_ACCESS_KEY_AQUI"
    ```

3.  **Inicie o servidor do Backend:**
    ```bash
    npm start
    ```
    O servidor estará rodando em `http://localhost:3001` (ou na porta que você configurar).

4.  **Visualize o Frontend:**
    -   A maneira mais fácil de visualizar os arquivos da pasta `/frontend` é usando uma extensão como o **Live Server** no VS Code.

<br>

## 🤝 Como Contribuir

Fico muito feliz com seu interesse em contribuir! Toda ajuda é bem-vinda. Por favor, leia nosso **[GUIA DE CONTRIBUIÇÃO](CONTRIBUTING.md)** para entender nosso fluxo de trabalho.

Não se esqueça de seguir nosso **[CÓDIGO DE CONDUTA](CODE_OF_CONDUCT.md)** para mantermos uma comunidade amigável e respeitosa.

<br>

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

<br>

---

Feito com ❤️ por **[[Pedro Marques](https://pedrolucas167.github.io/portfolio/)]**.