# Organiza

O Organiza é uma plataforma pessoal para preparar estudos de ENEM, PAS, vestibulares e concursos públicos.

## Produto

- Contas com confirmação de e-mail.
- Planos separados por objetivo.
- Upload de PDFs e slides.
- Palavras-chave para relacionar cada material ao que precisa ser estudado.
- Revisões agendadas e visão do progresso.

## Rotas principais

- `/` — apresentação do produto
- `/entrar` — acesso à conta
- `/criar-conta` — criação de conta
- `/verificar-email` — confirmação de e-mail
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
