# Organiza

O Organiza é uma plataforma pessoal para preparar estudos de ENEM, PAS, vestibulares e concursos públicos.

## Produto

- Contas com confirmação de e-mail.
- Recuperação de senha por link seguro e de uso único.
- Planos separados por objetivo.
- Matérias dentro de cada plano, com PDFs e slides organizados por assunto.
- Resumos, pontos de revisão e palavras-chave gerados automaticamente a partir do PDF.
- Revisões agendadas e visão do progresso.

## Rotas principais

- `/` — apresentação do produto
- `/entrar` — acesso à conta
- `/criar-conta` — criação de conta
- `/verificar-email` — confirmação de e-mail
- `/recuperar-senha` — solicitação de recuperação
- `/redefinir-senha` — criação de uma nova senha
- `/app` — painel pessoal
- `/app/materiais` — matérias por plano e organização dos PDFs anteriores
- `/app/materiais?plano=ID&materia=ID` — PDFs, resumos e palavras-chave da matéria
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

O remetente deve usar um domínio validado no Resend. O envio por e-mail precisa estar configurado também no localhost; links de recuperação não são exibidos na tela.

## Resumos de PDFs

No `.env` local, preencha `OPENAI_API_KEY` com uma chave da API OpenAI e mantenha `OPENAI_MODEL=gpt-4.1-mini` (ou outro modelo compatível com PDFs e Structured Outputs). Na hospedagem, configure as mesmas variáveis no ambiente do servidor. A chave nunca é enviada ao navegador. O uso da API requer créditos e gera cobrança na conta OpenAI.

Antes de usar as novas telas, aplique a migração aditiva e gere o cliente Prisma:

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
```

Fluxo: criar plano → criar matéria → adicionar PDF. O arquivo é salvo primeiro; em seguida, a tela solicita a análise ao servidor. O servidor envia o PDF à Responses API com `store: false` e salva o resumo, os pontos de estudo e as palavras-chave no Neon. A saída usa JSON Schema e validação local. Documentação: [arquivos PDF](https://developers.openai.com/api/docs/guides/file-inputs) e [saídas estruturadas](https://developers.openai.com/api/docs/guides/structured-outputs).

Sem chave ou em caso de falha, o arquivo continua disponível e a tela informa que o resumo está pendente. O botão de tentar novamente reaproveita o arquivo salvo. Ao abrir uma matéria com o serviço configurado, PDFs pendentes iniciam a análise automaticamente, um por vez. Isso também vale para arquivos enviados antes de configurar a chave. Falhas exigem uma nova tentativa pelo botão, sem repetição automática de chamadas. Análises simultâneas do mesmo PDF são bloqueadas; uma execução interrompida pode ser retomada após 150 segundos. Não há processamento em fila independente do navegador.

Os conceitos são sugestões baseadas no documento e no objetivo do plano. A plataforma não possui um banco de provas para calcular frequência real de cobrança. Confira sempre o PDF original.

Limite de upload: 4 MB por PDF. No localhost, os arquivos são gravados em `public/uploads`. Na Vercel, configure `BLOB_READ_WRITE_TOKEN` para persistência; o upload é recusado sem essa configuração. O armazenamento atual usa URLs públicas, portanto não é adequado para documentos confidenciais. O endpoint de análise exige sessão e confere a propriedade do material e da matéria. O tempo máximo configurado para análise é 120 segundos; a hospedagem precisa permitir essa duração.
