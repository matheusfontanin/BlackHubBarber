# BlackHub Barber — Design System "Nelson Dark"

> Versão 1.0 — Baseado na referência "Best Beauty Spa Salon" (barbearia premium dark/gold)

---

## 🎨 Paleta de Cores

### Backgrounds (do mais escuro ao mais claro)

| Token CSS | Valor | Classe Tailwind | Uso |
|---|---|---|---|
| `--color-sidebar` | `#0f0f0f` | `bg-sidebar` | Sidebar rail (mais escura) |
| `--color-appbg` | `#161616` | `bg-appbg` | Shell da aplicação |
| `--color-bg` | `#222222` | `bg-bg` | Área de conteúdo principal |
| `--color-surface` | `#2a2a2a` | `bg-surface` | Cards, rows hover, inputs |
| `--color-surface2` | `#333333` | `bg-surface2` | Barras de progresso (track) |

### Gold Accent

| Token CSS | Valor | Classe Tailwind | Uso |
|---|---|---|---|
| `--color-gold` | `#c9a84c` | `text-gold` / `bg-gold` | Destaque principal — CTAs, valores, ícone ativo |
| `--color-gold-light` | `#e8c97a` | `text-gold-light` | Hover, gradiente claro |
| `--color-gold-dark` | `#a8892f` | `text-gold-dark` | Pressed state |

### Texto

| Token CSS | Valor | Classe Tailwind | Uso |
|---|---|---|---|
| `--color-primary` | `#f0ede8` | `text-primary` | Texto principal (branco-creme) |
| `--color-muted` | `#8a8680` | `text-muted` | Labels, subtítulos |
| `--color-faint` | `#4a4845` | `text-faint` | Placeholders, itens desativados |

### Bordas

| Token CSS | Valor | Classe Tailwind | Uso |
|---|---|---|---|
| `--color-border` | `rgba(255,255,255,0.06)` | `border-border` | Divisores padrão |
| `--color-border2` | `rgba(255,255,255,0.10)` | `border-border2` | Bordas levemente mais visíveis |

---

## 🔤 Tipografia

| Variável | Família | Uso |
|---|---|---|
| `--font-heading` | **Playfair Display**, Montserrat (fallback) | Títulos de página, headings de cards. Use **italic** para efeito premium. |
| `--font-sans` | **Inter** | Texto do corpo, labels, parágrafo |
| `--font-mono` | **JetBrains Mono** | Valores monetários, horários, dados numéricos |

### Escala de Headings

```
Page Title:  text-3xl font-heading font-bold italic + heading-underline
Card Title:  text-xl  font-heading font-bold italic
Widget:      text-lg  font-heading font-bold italic
Label:       text-[10px] font-bold uppercase tracking-wider (label-xs)
```

---

## 🧱 Componentes Base

### `.card` — Card escuro padrão

```jsx
<div className="card p-5 lg:p-6">
  {/* bg-bg border border-border rounded-2xl shadow */}
</div>
```

### `.btn-gold` — Botão CTA primário

```jsx
<button className="btn-gold flex items-center gap-2">
  <Plus size={16} /> Ação
</button>
```

Variante com width full:
```jsx
<button className="btn-gold w-full py-3.5 flex items-center justify-center gap-2">
  Confirmar
</button>
```

### `.btn-ghost` — Botão secundário

```jsx
<button className="btn-ghost">Cancelar</button>
```

### `.input-dark` — Input dark theme

```jsx
<input className="input-dark" placeholder="..." />
<textarea className="input-dark resize-none h-24" />
<select className="input-dark">...</select>
```

### `.label-xs` — Label de campo

```jsx
<label className="label-xs">
  <Icon size={11} /> Nome do Campo
</label>
```

---

## 🏷️ Badges de Status

```jsx
<span className="badge-confirmed">Confirmado</span>   {/* verde esmeralda */}
<span className="badge-pending">Aguardando</span>     {/* âmbar */}
<span className="badge-completed">Finalizado</span>   {/* azul */}
<span className="badge-canceled">Cancelado</span>     {/* vermelho */}
```

---

## 🪟 Modais

Estrutura padrão para todos os modais:

```jsx
<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
  <motion.div className="bg-bg border border-border2 w-full max-w-md rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.6)] overflow-hidden">
    {/* Gold top bar */}
    <div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" />

    {/* Header */}
    <div className="bg-sidebar border-b border-border px-6 py-5 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
          <Icon size={15} className="text-gold" />
        </div>
        <h3 className="font-heading font-bold text-lg text-primary italic">Título</h3>
      </div>
      <button onClick={close} className="text-muted hover:text-primary transition-colors p-1">
        <X size={20} />
      </button>
    </div>

    {/* Body */}
    <form className="p-6 space-y-5">
      {/* campos */}
      <button className="btn-gold w-full py-3.5 flex items-center justify-center gap-2">
        Confirmar
      </button>
    </form>
  </motion.div>
</div>
```

---

## 🧭 Sidebar Navigation

- **Ativo:** `bg-gold text-sidebar` + `shadow-[0_2px_12px_rgba(201,168,76,0.4)]`
- **Inativo:** `text-muted hover:text-primary`
- **Logo:** Ícone `Scissors` em container `bg-gold/10 border border-gold/25`
- **Avatar:** `bg-gold/15 border border-gold/25 text-gold`

---

## 📏 Espaçamento e Bordas

| Conceito | Valor |
|---|---|
| Border radius cards | `rounded-2xl` (16px) |
| Border radius inputs | `rounded-xl` (12px) |
| Border radius ícones | `rounded-xl` (12px) |
| Padding de card | `p-5 lg:p-6` |
| Padding de página | `p-6 lg:p-8` |
| Gap entre cards | `gap-4 lg:gap-5` |

---

## ✨ Efeitos Especiais

### Gold glow em cards ao hover
```jsx
className="hover:border-gold/20 hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)]"
```

### Heading com underline dourado
```jsx
<h1 className="font-heading font-bold italic heading-underline">Título</h1>
```

### Linha dourada decorativa (top de modais)
```jsx
<div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" />
```

### Progress bar gold
```jsx
<div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
  <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full" style={{ width: '75%' }} />
</div>
```

### Fundo de auth (linhas diagonais)
```jsx
<div
  className="absolute inset-0 opacity-[0.03]"
  style={{ backgroundImage: 'repeating-linear-gradient(60deg, #c9a84c 0px, #c9a84c 1px, transparent 1px, transparent 60px)' }}
/>
```

---

## 📋 Regras para Novas Páginas

1. **Todo heading de página** usa `font-heading font-bold italic heading-underline`
2. **Todo botão CTA primário** usa `.btn-gold`
3. **Todo card** usa `.card` (não use `bg-white`)
4. **Todo input** usa `.input-dark`
5. **Todo label** usa `.label-xs`
6. **Valores monetários** usam `font-mono text-gold`
7. **Ícones em containers** usam `bg-gold/10 border border-gold/20`
8. **Status badges** usam as classes `.badge-*`
9. **Modais** seguem a estrutura padrão com gold bar no topo
10. **Loading** usa `<Loader2 className="animate-spin text-gold" />`
