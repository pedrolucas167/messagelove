# Como Contribuir com o MessageLove

Ficamos muito felizes pelo seu interesse em contribuir! ❤️

Toda ajuda é bem-vinda, desde a correção de bugs e melhoria na documentação até a sugestão de novas funcionalidades. Para garantir que o projeto continue organizado e a experiência seja positiva para todos, pedimos que siga algumas diretrizes.

Antes de começar, por favor, leia e siga nosso [**Código de Conduta**](CODE_OF_CONDUCT.md).

## 💬 Como Posso Ajudar?

Existem várias maneiras de contribuir:

* **Reportando Bugs:** Encontrou algo que não funciona como esperado? Nos avise!
* **Sugerindo Melhorias:** Tem uma ideia para uma nova funcionalidade ou uma melhoria em algo que já existe? Adoraríamos ouvir.
* **Escrevendo Código:** Ajude a corrigir um bug ou a implementar uma nova funcionalidade.
* **Melhorando a Documentação:** Viu um erro de digitação ou algo que poderia ser mais claro no `README.md` ou em outros documentos? Sua ajuda é preciosa.

## 🐛 Reportando Bugs

Antes de abrir uma nova *Issue* (problema), por favor, **verifique se já não existe uma issue parecida** na [página de Issues](https://github.com/SEU-USUARIO/messagelove/issues).

Se não houver, crie uma nova issue com o máximo de detalhes possível:

* **Título claro e descritivo.**
* **Passos para reproduzir o bug:** Descreva exatamente o que você fez para o erro acontecer.
* **Comportamento esperado vs. comportamento atual:** O que você esperava que acontecesse e o que de fato aconteceu?
* **Screenshots ou GIFs:** Se for um bug visual, uma imagem vale mais que mil palavras!
* **Informações do ambiente:** Qual navegador e sistema operacional você está usando?

## ✨ Sugerindo Melhorias

Adoramos novas ideias! Para sugerir uma melhoria, abra uma nova *Issue* explicando sua ideia:

1.  Use um **título claro** que resuma a sugestão (ex: "Sugestão: Adicionar suporte a músicas de fundo").
2.  Descreva **o problema que sua ideia resolve**. Por que essa funcionalidade seria útil?
3.  Detalhe **como você imagina que a funcionalidade funcionaria**.

## 💻 Sua Primeira Contribuição de Código

Pronto para colocar a mão na massa? Ótimo! Siga este fluxo de trabalho para enviar suas alterações.

1.  **Faça um Fork do repositório:** Clique no botão "Fork" no canto superior direito desta página para criar uma cópia do projeto na sua própria conta do GitHub.

2.  **Clone o seu fork:**
    ```bash
    git clone [https://github.com/SEU-NOME-DE-USUARIO/messagelove.git](https://github.com/SEU-NOME-DE-USUARIO/messagelove.git)
    cd messagelove
    ```

3.  **Crie uma nova Branch:** Crie uma branch específica para sua alteração. Use um nome descritivo.
    ```bash
    # Para uma nova funcionalidade
    git checkout -b feature/nome-da-feature

    # Para uma correção de bug
    git checkout -b fix/descricao-do-bug
    ```

4.  **Faça suas alterações:** Escreva seu código, corrija o bug, melhore a documentação. Lembre-se de seguir as instruções do `README.md` para rodar o projeto localmente.

5.  **Faça o Commit das suas alterações:** Use mensagens de commit claras e siga nosso padrão de commits.
    ```bash
    git add .
    git commit -m "feat: adiciona animação de confetes ao abrir o cartão"
    ```

6.  **Envie suas alterações para o seu fork:**
    ```bash
    git push origin feature/nome-da-feature
    ```

7.  **Abra um Pull Request (PR):** Volte para a página do seu fork no GitHub e clique no botão "Compare & pull request". Descreva o que sua alteração faz e, se aplicável, referencie a *Issue* que ela resolve (ex: "Resolve #42").

## 🎨 Padrões de Código e Commits

### Mensagens de Commit

Para manter o histórico do projeto limpo e legível, usamos o padrão **Conventional Commits**.

**Importante: Todas as mensagens de commit devem ser escritas em inglês.** Isso ajuda a manter o projeto acessível para colaboradores do mundo todo.

Sua mensagem de commit deve ter um prefixo que descreva o tipo de alteração:

* **feat:** Uma nova funcionalidade (feature).
* **fix:** Uma correção de bug.
* **docs:** Mudanças na documentação.
* **style:** Alterações de formatação de código que não afetam a lógica (espaços, ponto e vírgula, etc.).
* **refactor:** Uma alteração no código que não corrige um bug nem adiciona uma funcionalidade.
* **test:** Adição ou correção de testes.
* **chore:** Atualizações de tarefas de build, dependências, etc.

### Estilo de Código

* **JavaScript/Node.js:** Siga o estilo do código existente. Use `const` e `let`, prefira funções `async/await` e adicione comentários onde a lógica for complexa.
* **CSS:** Use as variáveis CSS definidas e tente manter a estrutura de classes existente.

---

Obrigado por dedicar seu tempo e talento ao MessageLove! Estamos ansiosos para ver suas contribuições.