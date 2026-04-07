# Configuração da Azure — VELTA Hub

> Guia simplificado para configurar tudo que precisa ser feito **na Azure**.
> O código já está pronto do nosso lado — aqui é só o que você precisa fazer lá no portal.

---

## O que você vai precisar configurar

1. [Cosmos DB — Novos containers](#1-cosmos-db--novos-containers)
2. [Azure AI Foundry — Agent do VELTA](#2-azure-ai-foundry--agent-do-velta)
3. [Azure AI Search — RAG de histórico](#3-azure-ai-search--rag-de-histórico)
4. [Azure OpenAI — Modelo de linguagem](#4-azure-openai--modelo-de-linguagem)
5. [Variáveis de ambiente no projeto](#5-variáveis-de-ambiente-no-projeto)
6. [Checklist final](#6-checklist-final)

---

## 1. Cosmos DB — Novos containers

O banco já existe. Você só precisa criar **2 novos containers** dentro do banco `velta`.

### Como fazer

1. Acesse o portal Azure → sua conta **Azure Cosmos DB**
2. Clique no banco de dados chamado `velta` (ou o nome que você definiu em `COSMOS_DATABASE`)
3. Clique em **"New Container"**

### Container 1: `hub_data`

| Campo         | Valor                                  |
| ------------- | -------------------------------------- |
| Database ID   | `velta`                                |
| Container ID  | `hub_data`                             |
| Partition key | `/userId`                              |
| Throughput    | 400 RU/s (mínimo, pode ajustar depois) |

> Esse container guarda os dados de entrada e o resultado de cada análise organizacional.

### Container 2: `decisions`

| Campo         | Valor       |
| ------------- | ----------- |
| Database ID   | `velta`     |
| Container ID  | `decisions` |
| Partition key | `/userId`   |
| Throughput    | 400 RU/s    |

> Esse container guarda o histórico de decisões para aprendizado contínuo.

**Pronto!** O código já sabe criar os containers automaticamente se não existirem, mas criar manualmente garante que as configurações de throughput sejam as certas.

---

## 2. Azure AI Foundry — Agent do VELTA

O agent é o "cérebro" do assistente de chat. Você precisa criar um agent com o system prompt do VELTA AI.

### Como fazer

1. Acesse **Azure AI Foundry** (anteriormente Azure AI Studio)
2. Vá em **Agents** → **New Agent**
3. Dê um nome (ex: `velta-ai-agent`) e versão `1`

### System Prompt do Agent

Cole o texto abaixo no campo **"System message"** do agent:

```
Você é o VELTA AI, um sistema inteligente de apoio à decisão estratégica organizacional baseado na Administração 5.0.

Seu papel é analisar dados organizacionais multidimensionais (RH, Financeiro, Logística, Marketing e ESG) e auxiliar gestores a tomar decisões estruturadas, priorizadas e com governança humana.

Ao receber dados de uma análise, você deve:
1. Interpretar o HUB Score e classificar o cenário organizacional (Estável, Atenção, Crítico ou Colapso iminente)
2. Explicar os índices estratégicos (IRL - Risco Logístico, IIH - Impacto Humano, IU - Urgência)
3. Detalhar as ações recomendadas e como executá-las na prática
4. Identificar interdependências entre áreas (ex: RH fraco afeta Logística)
5. Sempre manter o ser humano como elemento central — nenhuma decisão crítica deve ser tomada sem validação humana

Nível de autonomia:
- Bloqueio automático (IIH > 70): alertar imediatamente, não avançar sem aprovação humana
- Prioridade crítica (IU > 80): recomendar intervenção imediata
- Aprovação obrigatória (IRL > 60): apresentar análise e aguardar decisão
- Execução assistida (IU 40-60): apoiar com análise detalhada
- Execução automática (IU < 40): pode recomendar diretamente

Sempre responda em português brasileiro. Seja objetivo, claro e direto.
```

### Variáveis que você vai usar depois

Após criar o agent, anote:

- **Agent Name** → vai para `AZURE_FOUNDRY_AGENT_NAME` no `.env.local`
- **Project Endpoint** → vai para `AZURE_AI_PROJECT_ENDPOINT`
- **API Key** → vai para `AZURE_FOUNDRY_API_KEY`

---

## 3. Azure AI Search — RAG de histórico

O Azure AI Search permite que o assistente consulte histórico de decisões anteriores para dar respostas mais contextualizadas. **Esta etapa é opcional para o MVP**, mas recomendada para a versão completa.

### Como fazer

1. No portal Azure → **Create a resource** → **Azure AI Search**
2. Nome: `velta-search` (ou similar)
3. Pricing tier: **Basic** é suficiente para começar

### Criar o índice de decisões

Após criar o serviço:

1. Vá em **Indexes** → **New index**
2. Nome do índice: `velta-decisions`
3. Campos mínimos:

| Campo     | Tipo                   | Pesquisável | Filtrável |
| --------- | ---------------------- | ----------- | --------- |
| id        | Edm.String (key)       | Não         | Não       |
| userId    | Edm.String             | Não         | Sim       |
| scenario  | Edm.String             | Sim         | Sim       |
| actions   | Collection(Edm.String) | Sim         | Não       |
| hubScore  | Edm.Double             | Não         | Sim       |
| createdAt | Edm.DateTimeOffset     | Não         | Sim       |
| summary   | Edm.String             | Sim         | Não       |

### Conectar ao AI Foundry

1. No AI Foundry → **Data + Indexes** → **New Index**
2. Conecte ao Azure AI Search criado acima
3. Selecione o índice `velta-decisions`
4. Configure como fonte de dados para o agent

> O indexador pode ser configurado para rodar periodicamente ou via trigger do Cosmos DB (usando Azure Functions como trigger).

---

## 4. Azure OpenAI — Modelo de linguagem

O modelo de linguagem fica dentro do AI Foundry. Se ainda não estiver configurado:

### Deployment recomendado

| Configuração      | Valor                                        |
| ----------------- | -------------------------------------------- |
| Modelo            | `gpt-4o` ou `gpt-4o-mini` (para custo menor) |
| Deployment name   | `velta-gpt4o`                                |
| Tokens per minute | 40.000 (ajuste conforme uso)                 |

### Como fazer

1. No AI Foundry → **Deployments** → **Deploy model**
2. Selecione `gpt-4o` (recomendado para análises complexas)
3. Dê o nome do deployment e clique em Deploy

> O agent criado na etapa 2 vai usar automaticamente este deployment se estiver no mesmo projeto.

---

## 5. Variáveis de ambiente no projeto

Após configurar tudo acima, atualize o arquivo `.env.local` na raiz do projeto com os valores reais:

```env
# Já existem (só confirmar que estão certos)
COSMOS_ENDPOINT=https://SEU_ACCOUNT.documents.azure.com:443/
COSMOS_KEY=SUA_CHAVE_PRIMARIA
COSMOS_DATABASE=velta

# Azure AI Foundry
AZURE_AI_PROJECT_ENDPOINT=https://SEU_PROJECT.services.ai.azure.com/api/projects/SEU_PROJECT
AZURE_FOUNDRY_AGENT_NAME=velta-ai-agent
AZURE_FOUNDRY_AGENT_VERSION=1
AZURE_FOUNDRY_API_KEY=SUA_API_KEY

# Auth (já existem)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_SECRET=...
NEXTAUTH_URL=https://seu-dominio.com
```

> **Nunca commite o `.env.local` no git.** Já está no `.gitignore`.

---

## 6. Checklist final

Use isso para não esquecer nada:

### Cosmos DB

- [ ] Container `hub_data` criado com partition key `/userId`
- [ ] Container `decisions` criado com partition key `/userId`
- [ ] Firewall configurado para permitir acesso do App Service (se aplicável)

### AI Foundry

- [ ] Agent criado com nome `velta-ai-agent`
- [ ] System prompt colado e salvo
- [ ] Deployment do GPT-4o configurado no mesmo projeto
- [ ] API key anotada

### AI Search (opcional)

- [ ] Serviço Azure AI Search criado
- [ ] Índice `velta-decisions` criado com os campos corretos
- [ ] Conectado ao AI Foundry

### Ambiente

- [ ] `.env.local` atualizado com todas as chaves
- [ ] `npm run build` passou sem erros
- [ ] Testado localmente: `/hub` → preencher dados → `/hub/result` → resultado aparece
- [ ] Verificado no Cosmos DB: documento apareceu no container `hub_data`

---

## Resumo do que cada serviço faz

| Serviço             | Para que serve no VELTA                                       |
| ------------------- | ------------------------------------------------------------- |
| **Cosmos DB**       | Guarda usuários, conversas, análises e decisões               |
| **AI Foundry**      | É o agent de IA que responde no chat e interpreta análises    |
| **OpenAI (GPT-4o)** | O modelo de linguagem que o agent usa                         |
| **AI Search**       | Permite o agent consultar análises passadas para dar contexto |

---

_Gerado automaticamente pelo VELTA Code Assistant · Arquitetura 5.0_
