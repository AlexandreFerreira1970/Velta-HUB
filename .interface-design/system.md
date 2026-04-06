# Velta Design System

## Direction & Feel

**Intent:** Plataforma corporativa/enterprise. Profissionais em desktops — gerentes, analistas, equipes de operações. Preenchendo formulários, aprovando workflows, revisando dados. Deve sentir: autoridade precisa, denso mas respirável, confiável como um sistema bancário bem projetado.

**Signature:** Accent de borda esquerda `2px solid var(--azure)` em todos os estados focus/active. Aparece em inputs, textarea, select trigger, e checkboxes marcados. É o marcador de índice do sistema — indica "aqui está sua atenção".

## Palette

| Token | Light | Dark | Papel |
|---|---|---|---|
| `--navy` | `#0C1A2E` | `#E2E8F0` | Brand primária, fundo de botão primary |
| `--azure` | `#1D4ED8` | `#3B82F6` | Ação, focus, accent |
| `--azure-hover` | `#1E40AF` | `#60A5FA` | Hover em azure |
| `--azure-light` | `#DBEAFE` | `#1E3A5F` | Bg de item selecionado |
| `--canvas` | `#F1F5F9` | `#0F172A` | Fundo da página |
| `--surface-0` | `#FFFFFF` | `#1E293B` | Cards, painéis |
| `--surface-1` | `#F8FAFC` | `#0F172A` | Inputs, controls |
| `--surface-2` | `#E2E8F0` | `#334155` | Hover states |

## Depth Strategy

**Bordas apenas** — sem sombras. Estilo técnico, corporativo. Sombra única e sutil permitida apenas em dropdowns flutuantes (`0 4px 12px rgba(12, 26, 46, 0.08)`).

Border progression:
- `--steel-soft` (`#E2E8F0`) — separadores suaves, borda de cards
- `--steel` (`#CBD5E1`) — borda de controles no estado default
- `--steel-strong` (`#94A3B8`) — hover em controles, botão secondary
- `--steel-focus` / `--azure` — estados focus e active

## Spacing

Base unit: `4px`. Escala: 4, 8, 12, 16, 20, 24, 32.

## Border Radius

Disciplinado e corporativo:
- `--radius-sm`: `2px` — inputs, botões, checkboxes
- `--radius-md`: `2px` — cards menores
- `--radius-lg`: `4px` — modais, cards maiores, formulários

## Typography

**Geist Sans** — todos os textos de UI. Técnica, precisa, institucional.  
**Geist Mono** — variante `numeric`. Dados tabulares, IDs, valores financeiros com `font-variant-numeric: tabular-nums`.

### Escala (`components/ui/Text.tsx`)

| Variant | Size | Weight | Tracking | Uso |
|---|---|---|---|---|
| `display` | 30px | 700 | -0.02em | Títulos de página, hero |
| `title` | 24px | 600 | -0.015em | Cabeçalhos de seção principal |
| `heading` | 18px | 600 | -0.01em | Títulos de card, modal |
| `subheading` | 15px | 600 | 0 | Subtítulos, grupos de campo |
| `body` | 14px | 400 | 0 | Texto principal de leitura |
| `body-sm` | 13px | 400 | 0 | Texto secundário, notas |
| `label` | 11px | 500 | +0.06em UPPER | Seções, overlines de campo |
| `caption` | 11px | 400 | +0.01em | Timestamps, metadados |
| `overline` | 10px | 600 | +0.1em UPPER | Títulos de grupo, seção |
| `numeric` | 14px mono | 400 | 0 | Valores, IDs, percentuais |

### Cores padrão por variant
- display/title/heading/subheading/body/numeric → `--ink-primary`
- body-sm/label → `--ink-secondary`
- caption/overline → `--ink-tertiary`

### Uso
```tsx
<Text variant="heading">Dados do colaborador</Text>
<Text variant="numeric" color="secondary">R$ 148.320,00</Text>
<Text variant="caption">Atualizado há 5 minutos</Text>
<Text variant="body" truncate as="span">...</Text>
```

Prop `as` para elemento semântico. Prop `color` para override. Prop `truncate` para overflow.

## Component Patterns

### Button
- Variantes: `primary` | `secondary` | `ghost` | `destructive`
- Tamanhos: `sm` (h-7) | `md` (h-9) | `lg` (h-11)
- Primary: bg navy → hover azure
- Todos com `focus-visible:ring-2 ring-[var(--azure-ring)]`
- Loading state com spinner inline

### Input / Textarea
- Label: `text-xs font-medium tracking-wide uppercase`
- Background: `var(--control-bg)` (surface-1)
- Border: `var(--control-border)` → focus: `var(--azure)` + `border-l-2` (signature)
- Error: border `var(--semantic-error)`, texto de erro abaixo
- Helper text: `var(--ink-tertiary)`

### Select
- Custom component (não native `<select>`)
- Trigger estilizado igual ao Input
- Dropdown com `border: var(--steel)`, sem radius excessivo
- Item selecionado: bg `var(--azure-light)`, texto `var(--azure)` + CheckIcon
- Outside click fecha; Escape fecha

### Checkbox
- Input visualmente oculto (`sr-only`) + div estilizado
- Checked: bg `var(--azure)`, borda `var(--azure)`, `border-l-2` (signature)
- Indeterminate: mesmo tratamento visual do checked
- Focus: `ring-2 ring-[var(--azure-ring)]` via `peer-focus-visible`

## Files

- `app/globals.css` — todos os tokens CSS custom properties
- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Textarea.tsx`
- `components/ui/Select.tsx`
- `components/ui/Checkbox.tsx`
- `components/ui/Text.tsx`
- `components/ui/index.ts` — barrel export
