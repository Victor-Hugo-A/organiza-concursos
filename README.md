# Organiza

O Organiza é uma plataforma pessoal para preparar estudos de ENEM, PAS, vestibulares e concursos públicos.

## Produto

- Contas com confirmação de e-mail.
- Recuperação de senha por link seguro e de uso único.
- Planos separados por objetivo.
- Upload de PDFs e slides.
- Palavras-chave para relacionar cada material ao que precisa ser estudado.
- Revisões agendadas e visão do progresso.

## Rotas principais

- `/` — apresentação do produto
- `/entrar` — acesso à conta
- `/criar-conta` — criação de conta
- `/verificar-email` — confirmação de e-mail
- `/recuperar-senha` — solicitação de recuperação
- `/redefinir-senha` — criação de uma nova senha
- `/app` — painel pessoal
- `/app/materiais` — acervo e palavras-chave
- `/app/planos` — objetivos de estudo
- `/app/revisoes` — revisões planejadas

## Desenvolvimento

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Para persistir contas e materiais, configure `DATABASE_URL` com uma base PostgreSQL e execute as migrações Prisma.

Para enviar confirmações e recuperações por e-mail na Vercel, configure:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=Organiza <contato@seu-dominio.com>
```

O remetente deve usar um domínio validado no Resend. No localhost, o sistema apresenta o link seguro diretamente na tela para facilitar os testes.
