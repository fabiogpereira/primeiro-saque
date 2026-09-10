# Briefing — Primeiro Saque

## Contexto e objetivo

**Primeiro Saque** é uma landing page que simula um serviço de **teste de raquetes de tênis antes da compra** em São Paulo. O usuário real (Fábio) é o dono da ideia.

**Natureza do projeto:** é um **fake-door test**. A LP aparenta ser um serviço já operando, mas o objetivo é **validar demanda** antes de investir no produto real. O formulário captura interesse e alimenta uma planilha pra análise.

**Hipóteses que a LP quer validar:**

1. Existe demanda pra testar raquetes antes de comprar (ticket médio: R$ 2k)?
2. As pessoas querem testar 1 raquete ou múltiplas?
3. Distribuição geográfica em SP
4. Urgência real de compra

**Não prometer atendimento imediato** (ex: WhatsApp em 24h) — pode criar expectativa falsa. A mensagem de sucesso é neutra ("devido ao alto volume, organizamos por ordem de chegada").

---

## Posicionamento

**Premium sem dizer "premium".** Decisão explícita do Fábio: quer posicionamento sofisticado, mas a palavra "premium" está banida. Também evitar "elite", "exclusivo" e similares. A sofisticação vem de:

- Vocabulário (concierge, curadoria, decisão)
- Especificidade (modelos exatos, nomes de jogadores como Alcaraz/Sinner/João Fonseca, bairros de SP)
- Tipografia e layout
- Tom confiante, sem adjetivos vazios

**Gatilho emocional principal:** **dinheiro**, não saúde ou performance.

- "Uma raquete nova custa R$ 2 mil. Erre a escolha e você perde muito dinheiro."
- Evitar "evite lesões", "tenha mais desempenho" — ângulos fracos pro nosso ICP.

**Proposta de valor:**

- Teste em quadra real por 1 semana
- Compare até 3 modelos (empurrar tier de 3)
- Cordas novas, overgrip novo, entrega e retirada inclusas
- Sem fidelidade, sem burocracia
- Só SP Capital (cria foco geográfico)

**Pricing (placeholders, sujeitos a ajuste):**

- 1 raquete — R$ 250/semana
- 2 raquetes — R$ 450/semana (economia de R$ 50)
- 3 raquetes — R$ 600/semana (economia de R$ 150, **tier destacado como "Mais escolhido"**)

---

## Stack técnica

- **HTML único** (`index.html`) — tudo em uma página
- **Tailwind CSS via CDN** (ciente de que isso limita performance, mas validação não justifica build step agora)
- **JS vanilla** — modal, máscara de WhatsApp, cálculo ao vivo do total, menu mobile, scroll suave, FAQ com `<details>`
- **Backend:** Google Apps Script → Google Sheet (ver `backend-setup.md`)
- **Hospedagem:** Vercel
- **Domínio:** `primeirosaque.com.br` (Registro.br apontando para Vercel)
- **Repositório:** `github.com/fabiogpereira/primeiro-saque`
- **Analytics:** GA4 (`G-V66JXP8H5L`) com evento `form_submit` disparando no sucesso

---

## Catálogo de raquetes

4 modelos (fotos em `images/`):

| Modelo                    | Aro | Peso | Cordas | Narrativa                                           |
| ------------------------- | --- | ---- | ------ | --------------------------------------------------- |
| Babolat Pure Aero 98 Gen9 | 98  | 305g | 16x20  | A raquete do Alcaraz · rainha do spin               |
| Wilson Blade 98 V9        | 98  | 305g | 18x20  | A mais usada no Tour · sensibilidade e controle     |
| Head Speed MP 2026        | 100 | 300g | 16x19  | A raquete do Sinner · potência e controle           |
| Yonex VCORE 98 8th Gen    | 98  | 305g | 16x19  | A raquete do João Fonseca · a mais hypada no Brasil |

**Tensão padrão:** 50 libras (linguagem brasileira, não usar kg).

---

## Design system

**Cores:**

- Principal: `#DFFF00` (amarelo-limão elétrico) — CTAs, destaques, marca
- Fundo: `#131313` (preto)
- Secundária: `#E26D5C` (coral) — destaques pontuais
- Apoio: `#2B50AA` (azul) — subtítulos nos cards
- Texto: `#E5E2E1`

**Fontes:**

- **Epilogue** (700/800/900) — títulos, CTAs, nome de marca. Usar em maiúsculas com `tracking-tighter`.
- **Manrope** (400-700) — corpo, labels.

**Tom:**

- Confiante, direto, sem floreios
- Frases curtas
- Sem emojis
- Sem gírias corporativas ("sinergia", "solução", "experiência única")
- Sem "melhor do Brasil" ou claims sem prova (risco CONAR/CDC)

---

## O que já foi feito

### Estrutura da LP

- Hero com gatilho de dinheiro
- Seção de problema (3 cards — perda financeira, sem teste real, cada braço é único)
- Como funciona (4 passos: Escolha, Receba, Jogue, Decida)
- Catálogo (4 raquetes com fotos oficiais dos fabricantes, specs: aro, peso, padrão de cordas)
- Serviço concierge + 3 tiers de pricing (1, 2, 3 raquetes — 3 destacado)
- Depoimentos (3, com nomes brasileiros, bairros de SP, raquetes do catálogo — nota: são fictícios, fase validação; plano é substituir por reais)
- FAQ com 5 perguntas usando `<details>/<summary>` (zero JS)
- CTA final
- Footer

### Modal de reserva

Campos: nome, WhatsApp (com máscara BR), checkbox múltiplo de raquetes (pré-selecionado ao clicar em "Quero testar" de um card), urgência (radio), bairro, total calculado ao vivo. CTA: "Confirmar solicitação" (não "Confirmar reserva" — muito forte).

Mensagem de sucesso: _"Recebemos seu interesse. Devido ao alto volume de solicitações, nossa equipe está organizando os atendimentos por ordem de chegada — em breve retornaremos com os próximos passos."_

### SEO

- Meta description, keywords, canonical, robots
- Favicon SVG inline (bolinha amarela)
- Open Graph + Twitter cards (imagem `og-image.jpg` **ainda não existe** — pendência)
- Schema.org LocalBusiness
- robots.txt + sitemap.xml

### Responsividade

Mobile-first revisado: hamburger + drawer, hero com altura responsiva, tipografia escalonada, padding reduzido no mobile.

### Navegação

Links do header (Catálogo, Processo, Preços, Dúvidas) com scroll suave e `scroll-margin-top: 80px` pra compensar navbar fixa. IDs: `#catalogo`, `#como-funciona`, `#precos`, `#duvidas`, `#depoimentos`, `#reservar`.

### Analytics

GA4 instalado, evento `form_submit` disparando com parâmetros (qtd_raquetes, valor_total, urgencia, bairro).

### Google Ads

Campanha de Search sendo criada. Estratégia: "Enviar formulário de lead" → Conversão importada do GA4. Orçamento: R$ 29,59/dia (recomendado). Targeting: São Paulo Capital. Keywords de alta intenção (nomes de modelos, "testar raquete", "comprar raquete"). Callouts, sitelinks (6) e structured snippets (Marcas, Serviços) preenchidos.

---

## O que está pendente

### Crítico

- [ ] **Criar `images/og-image.jpg` (1200×630)** — hoje compartilhamento em WhatsApp/Insta não tem preview
- [ ] **Configurar Google Apps Script** (passo a passo em `backend-setup.md`) — hoje form roda em modo simulado (só log no console)
- [ ] **Colar a URL do Apps Script no `ENDPOINT` do JS** (dentro do script no final do HTML)
- [ ] **Marcar `form_submit` como conversão no GA4** (Admin → Eventos → toggle)
- [ ] **Importar conversão do GA4 no Google Ads** (Ferramentas → Conversões → Importar)

### Médio

- [ ] Cadastrar site no Google Search Console e enviar sitemap
- [ ] Instalar Meta Pixel (se rodar Meta Ads)
- [ ] Adicionar UTMs em todos os links de anúncios
- [ ] Performance: migrar Tailwind CDN pra build step (afeta Quality Score)

### Opcional / futuro

- [ ] Substituir depoimentos fictícios por reais
- [ ] Logo profissional (tentativa via Stitch rejeitada — estética de clube amador, não combina com LP)
- [ ] Fotos próprias das raquetes (hoje usa fotos oficiais dos fabricantes)

---

## Decisões e regras importantes (lembretes de contexto)

**Do's:**

- Gatilho de dinheiro > gatilho de saúde
- Múltiplas raquetes > raquete única (ticket maior + validação de hipótese)
- Mensagens de sucesso neutras, sem prometer canal específico de contato
- Sempre especificar "SP Capital" pra não gerar expectativa em outras regiões
- Usar "solicitação" em vez de "reserva" em CTAs (menos comprometedor)

**Don'ts:**

- NUNCA usar "premium", "elite", "exclusivo"
- NUNCA prometer entrega, contato em X horas, canal (WhatsApp)
- NUNCA usar "coach" (é "técnico" ou "professor")
- NUNCA fazer claim sem prova ("a melhor", "líder de mercado")
- NUNCA criar escassez artificial ("só restam 3 vagas" se não for verdade)

**Sobre o logo:** tentativa no Stitch gerou logo com italic + swoosh + bola no meio. Rejeitado — estética de clube amador, não combina com o minimalismo da LP. Decisão pendente: contratar designer ou fazer tipográfico simples em Epilogue.

**Sobre SEO:** foco é Google Ads Quality Score e OG/sharing, não ranqueamento orgânico (leva meses demais pra o horizonte de validação).

---

## Estrutura de arquivos

```
PrimeiroSaque/
├── index.html          (LP completa, ~900 linhas)
├── README.md
├── BRIEFING.md         (este arquivo)
├── backend-setup.md    (passo a passo do Google Apps Script)
├── robots.txt
├── sitemap.xml
└── images/
    ├── babolat-pure-aero-98.jpg
    ├── wilson-blade-98.jpg
    ├── head-speed-mp.jpg
    └── vcore-98.jpg
```

---

## Como abordar novas tarefas

- Sempre priorize **velocidade de validação** sobre robustez/elegância de código
- Mudanças de copy têm peso maior que mudanças técnicas
- Sempre considere impacto em Google Ads Quality Score (clareza do anúncio → clareza da LP)
- Quando em dúvida sobre pricing, mensagem ou estrutura: pergunte antes de implementar
- Fábio prefere respostas diretas com tradeoffs explícitos sobre "faz isso sem pensar"
