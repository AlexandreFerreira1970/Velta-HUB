This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuração

Copie `.env.example` para `.env.local` e preencha. Dois provedores são trocáveis só por variável de ambiente:

| Variável      | Valores                       | O que muda                                                   |
| ------------- | ----------------------------- | ------------------------------------------------------------ |
| `AI_PROVIDER` | `azure` (padrão) \| `openai`  | Agentes do Azure AI Foundry ou API da OpenAI direto          |
| `DB_PROVIDER` | `cosmos` (padrão) \| `neon`   | Azure Cosmos DB ou Postgres no Neon                          |

- **OpenAI:** as instruções do assistente ficam em `lib/ai/instructions.ts` (no Azure, ficam no agente do Foundry — mantenha os dois iguais).
- **Neon:** as tabelas são criadas automaticamente na primeira requisição (schema em `lib/db/neon/schema.ts`).
- Trocar `DB_PROVIDER` **não migra dados**: o app passa a ler e gravar só no banco escolhido.
- Trocar `AI_PROVIDER` no meio de uma conversa funciona: o histórico salvo é reenviado ao novo provedor.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
