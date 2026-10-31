# Sistema-de-controle-de-estoque-V1.1.0 v.web
# 📦 Furos de Estoque & 🚚 Controle de Devoluções

> Sistema web integrado para **gestão de estoque operacional**, combinando o registro de **furos de estoque (divergências / estoque morto)** com o **controle e acompanhamento de devoluções de peças à fábrica**.

🔗 **Acesse online:** [sistema-de-controle-de-estoque-v100.vercel.app](https://sistema-de-controle-de-estoque-v100.vercel.app)

---

## 🚀 Novidades da Versão 1.1.0

- 🌓 **Modo Dia e Noite (Dark / Light Theme):**
  - **Botão de Alternância no Cabeçalho:** Posicionado em local de fácil visualização em ambas as telas, com transição animada entre os ícones de Sol ☀️ e Lua 🌙.
  - **Modo Noite:** Estética escura moderna com tons de azul marinho profundo e acentos em neon lime.
  - **Modo Dia:** Paleta moderna e harmoniosa baseada em Branco (`#FFFFFF`), Pêssego suave (`#FFD6CE`), Laranja vibrante (`#FF5C00`), Preto (`#000000`) e Cinza neutro (`#989898`).
  - **Persistência Automática:** A preferência selecionada é salva no `localStorage` e sincronizada instantaneamente entre as páginas sem piscar na tela (*anti-flicker*).

- 🚚 **Módulo Dedicado de Devoluções à Fábrica:**
  - Interface desenvolvida para o almoxarifado rastrear o fluxo de devoluções de peças com controle de prazo de **7 dias corridos**.
  - Arquitetura totalmente modularizada com arquivos próprios ([Control_devolucoes.html](file:///c:/Users/abaca/Desktop/sistema-de-controle-de-estoque-v1.0.0-rs-main/conrole%20de%20devolu%C3%A7%C3%B5es/Control_devolucoes.html), [style_control_devolucoes.css](file:///c:/Users/abaca/Desktop/sistema-de-controle-de-estoque-v1.0.0-rs-main/conrole%20de%20devolu%C3%A7%C3%B5es/style_control_devolucoes.css) e [script_control_devolucoes.js](file:///c:/Users/abaca/Desktop/sistema-de-controle-de-estoque-v1.0.0-rs-main/conrole%20de%20devolu%C3%A7%C3%B5es/script_control_devolucoes.js)).

- 🔄 **Navegação Integrada e Alinhada:**
  - Botões de navegação no cabeçalho perfeitamente alinhados para transitar de forma rápida entre as telas de *Furos de Estoque* e *Devoluções*.

- 📅 **Padronização Visual & Datas Centralizadas:**
  - Data do sistema com destaque centralizado no cabeçalho e uniformidade visual entre tabelas, formulários e métricas.

---

## 📋 Módulos do Sistema

### 1. 📦 Furos de Estoque (Estoque Morto)
Voltado para o controle operacional e auditoria de divergências no armazém ou almoxarifado.

- **Campos de Registro:**
  - Código da Peça *(obrigatório)*
  - Alocação no armazém *(obrigatório)*
  - Quantidade *(obrigatório)*
  - Data de Inserção *(obrigatório)*
  - Tipo de Furo *(selecionável via dropdown)*
  - Motivo / Observação detalhada *(opcional)*
- **Recursos Principais:**
  - Dashboard resumido com total de registros, registros do mês e alocações ativas.
  - Busca dinâmica por código, alocação ou motivo.
  - Filtro interativo por tipo de furo.
  - Exportação direta de dados para **XLS** e relatórios formatados em **PDF**.

### 2. 🚚 Controle de Devoluções (Almoxarifado → Fábrica)
Desenvolvido para gerenciar a rotina de envio de peças com defeito, garantia ou devolução para a matriz/fábrica.

- **Campos de Lançamento:**
  - Código da Peça *(obrigatório)*
  - Quantidade *(obrigatório)*
  - Número da Nota Fiscal (NF) *(obrigatório)*
  - DISP / Chamado de Devolução *(opcional no lançamento, com preenchimento posterior facilitado)*
  - Data de Entrada *(preenchimento automático)*
- **Recursos Principais:**
  - Contador de prazo limite de **7 dias corridos** a partir da data de inserção.
  - Alertas dinâmicos no cabeçalho: **Vencidas**, **Até 2 Dias**, **Sem DISP** e **Total de Peças**.
  - Ações rápidas na tabela: editar DISP com um clique, confirmar devolução e excluir registro.
  - Exportação de dados para **XLSX**, **CSV** e cópia rápida da tabela para a área de transferência.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico:** Estrutura clara, acessível e responsiva.
- **CSS3 Moderno:** Variáveis CSS (`:root[data-theme]`), Flexbox, CSS Grid e transições suaves.
- **JavaScript Vanilla (ES6+):** Código limpo, modular, reativo e com persistência local via `localStorage`.
- **SheetJS (xlsx.full.min.js):** Geração e download de planilhas Excel.
- **jsPDF & html2canvas:** Criação de relatórios em PDF.

---

## 📁 Estrutura do Projeto

```
sistema-de-controle-de-estoque/
├── index.html                    # Interface principal (Furos de Estoque)
├── style.css                     # Estilos gerais e suporte a temas Dia/Noite
├── script.js                     # Lógica de furos de estoque, filtros e tema
├── README.md                     # Documentação completa do projeto
├── assets/                       # Recursos visuais e ícones
│   ├── caminhao-grande.png
│   ├── favcon.jpg
│   └── AdobeColor-My Color Theme.jpeg
└── conrole de devoluções/         # Módulo isolado de Devoluções
    ├── Control_devolucoes.html   # Tela de controle de devoluções à fábrica
    ├── style_control_devolucoes.css # Estilos dedicados e temas Dia/Noite
    └── script_control_devolucoes.js # Lógica de prazos de 7 dias, DISP e exportações
```

---

## 🚀 Como Executar

Por ser uma aplicação web pura (client-side), não requer compilação ou instalação de servidores pesados:

1. **Clone ou baixe o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/sistema-de-controle-de-estoque.git
   cd sistema-de-controle-de-estoque
   ```

2. **Abra no navegador:**
   - Dê um duplo clique no arquivo `index.html`, ou
   - Use uma extensão como o **Live Server** no VS Code.

3. **Deploy:**
   - Totalmente compatível com hospedagem estática gratuita no **Vercel**, **Netlify** ou **GitHub Pages**.

---

## 📈 Roadmap

- [x] Módulo de Devoluções à Fábrica com controle de prazos
- [x] Modo Dia e Noite com paleta personalizada e persistência
- [x] Navegação unificada no cabeçalho
- [ ] Autenticação e perfis de usuário
- [ ] Gráficos interativos de motivos e divergências por período
- [ ] Integração com banco de dados ou API de ERP

---

## 📄 Licença

Este projeto está sob a licença [MIT](./LICENSE).

---

<div align="center">
  Sistema de Controle de Estoque & Devoluções — Otimizando a logística e o almoxarifado
</div>
