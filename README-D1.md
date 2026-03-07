# Integração Cloudflare D1

Este projeto foi configurado com a estrutura para integração com o banco de dados **Cloudflare D1**.

## Arquivos Gerados

1. **`cloudflare-d1-schema.sql`**: Este arquivo contém **todas as tabelas e campos** necessários para a aplicação funcionar no D1. Você pode copiar o conteúdo deste arquivo e colar diretamente no painel da Cloudflare (Workers & Pages > D1 > Seu Banco > Console) ou usar o comando `wrangler d1 execute`.

2. **`src/services/d1-integration.ts`**: Este arquivo contém as funções TypeScript/JavaScript para conectar sua aplicação frontend/backend ao banco de dados D1 via API HTTP.

3. **`server.ts` e `src/db.ts`**: Configuração de um servidor Express local usando `better-sqlite3` para simular o comportamento do D1 durante o desenvolvimento local.

## Como criar as tabelas no Cloudflare D1

Se você estiver usando o Wrangler CLI:

```bash
wrangler d1 execute NOME_DO_SEU_BANCO --file=./cloudflare-d1-schema.sql
```

Ou acesse o painel da Cloudflare, vá até o seu banco de dados D1, clique na aba "Console" e cole o conteúdo do arquivo `cloudflare-d1-schema.sql`.

## Como conectar a aplicação

Para que a integração funcione, você precisa adicionar as seguintes variáveis de ambiente no seu arquivo `.env`:

```env
VITE_CLOUDFLARE_ACCOUNT_ID=seu_account_id_aqui
VITE_CLOUDFLARE_DATABASE_ID=seu_database_id_aqui
VITE_CLOUDFLARE_API_TOKEN=seu_api_token_aqui
```

## Compromisso de Atualização

Conforme solicitado: **Toda vez que forem feitas alterações no sistema adicionando novas funções ou campos, eu enviarei o código SQL atualizado para gerar as tabelas e campos no banco de dados D1.**
