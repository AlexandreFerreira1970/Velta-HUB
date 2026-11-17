import type { Dimension } from "@/lib/types";

// Form definition of the manual analysis page.

export type FieldDef = { key: string; label: string; helper?: string };
export type DimensionDef = { id: Dimension; title: string; fields: FieldDef[] };

export const DIMENSIONS: DimensionDef[] = [
  {
    id: "rh",
    title: "RH — Recursos Humanos",
    fields: [
      {
        key: "turnover",
        label: "Turnover (%)",
        helper: "Taxa de rotatividade — quanto maior, pior",
      },
      {
        key: "clima",
        label: "Clima Organizacional",
        helper: "Pesquisa de clima — 0 a 100",
      },
      {
        key: "engajamento",
        label: "Engajamento da Equipe",
        helper: "Nível de engajamento — 0 a 100",
      },
      {
        key: "absenteismo",
        label: "Absenteísmo (%)",
        helper: "Taxa de ausências — quanto maior, pior",
      },
    ],
  },
  {
    id: "fin",
    title: "FIN — Financeiro",
    fields: [
      {
        key: "margem",
        label: "Margem (%)",
        helper: "Margem de lucro normalizada 0-100",
      },
      {
        key: "caixa",
        label: "Saúde do Caixa",
        helper: "Disponibilidade de caixa — 0 a 100",
      },
      {
        key: "crescimento",
        label: "Crescimento de Receita",
        helper: "Taxa de crescimento normalizada 0-100",
      },
      {
        key: "endividamento",
        label: "Endividamento (%)",
        helper: "Nível de endividamento — quanto maior, pior",
      },
    ],
  },
  {
    id: "log",
    title: "LOG — Logística & Operações",
    fields: [
      { key: "produtividade", label: "Produtividade", helper: "0 a 100" },
      {
        key: "capacidade",
        label: "Capacidade Operacional",
        helper: "% de capacidade disponível",
      },
      {
        key: "retrabalho",
        label: "Retrabalho (%)",
        helper: "Taxa de retrabalho — quanto maior, pior",
      },
      {
        key: "tempoEntrega",
        label: "Tempo de Entrega",
        helper: "Score de prazo — 100 = sempre no prazo",
      },
    ],
  },
  {
    id: "mkt",
    title: "MKT — Marketing & Vendas",
    fields: [
      {
        key: "leads",
        label: "Geração de Leads",
        helper: "Volume de leads normalizado 0-100",
      },
      {
        key: "conversao",
        label: "Taxa de Conversão",
        helper: "% de leads convertidos normalizado",
      },
      {
        key: "retencao",
        label: "Retenção de Clientes",
        helper: "% de clientes retidos",
      },
      {
        key: "cac",
        label: "CAC (Custo de Aquisição)",
        helper: "Custo normalizado — quanto maior, pior",
      },
    ],
  },
  {
    id: "esg",
    title: "ESG",
    fields: [
      {
        key: "ambiental",
        label: "Ambiental",
        helper: "Score de práticas ambientais — 0 a 100",
      },
      {
        key: "social",
        label: "Social",
        helper: "Score de impacto social — 0 a 100",
      },
      {
        key: "governanca",
        label: "Governança",
        helper: "Score de governança corporativa — 0 a 100",
      },
    ],
  },
];
