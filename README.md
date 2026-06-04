# Sistema-de-controle-de-estoque-V1.0.0
# 📦 Furos de Estoque — Controle de Peças

#link: sistema-de-controle-de-estoque-v100.vercel.app

> Sistema web para **registro e controle de furos de estoque**, permitindo rastrear peças com código, alocação, quantidade, tipo de furo e motivo da ocorrência.


## 📋 Sobre o Projeto

**Furos de Estoque** é uma aplicação web voltada para o controle operacional de peças em armazém ou almoxarifado. Permite registrar ocorrências de furo (divergência de estoque), filtrá-las por tipo e exportar relatórios em XLS ou PDF.

O sistema foi desenvolvido com foco em usabilidade para equipes de logística e controle de qualidade.

---

## ✨ Funcionalidades

- ✅ **Registro de peças** com código, alocação, quantidade e data
- 🔍 **Busca** por código, alocação ou motivo
- 🏷️ **Filtro** por tipo de furo
- 📊 **Dashboard resumido** com total de registros, registros do mês e alocações ativas
- 📤 **Exportação** para XLS e PDF
- 🗃️ **Tabela de registros** com colunas: `#`, `Código`, `QTD`, `Alocação`, `Data`, `Tipo de Furo`, `Motivo`

---

## 🧩 Campos do Formulário

| Campo              | Obrigatório | Descrição                                 |
|--------------------|:-----------:|-------------------------------------------|
| Código da Peça     | ✅           | Ex: `PEÇ-00142`                           |
| Alocação           | ✅           | Ex: `Corredor A / Prateleira 3`           |
| Quantidade         | ✅           | Número inteiro positivo                   |
| Data de Inserção   | ✅           | Data do registro do furo                  |
| Tipo de Furo       | ❌           | Selecionável via dropdown                 |
| Motivo / Observação| ❌           | Texto livre descrevendo a ocorrência      |

---

## 🚀 Como Executar

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/furos-de-estoque.git

# Acesse a pasta do projeto
cd furos-de-estoque

# Instale as dependências (se aplicável)
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

> Acesse no navegador: `http://localhost:3000`

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 / CSS3**
- **JavaScript** (ou framework utilizado)
- **[Biblioteca de exportação XLS]** — ex: SheetJS
- **[Biblioteca de exportação PDF]** — ex: jsPDF

> ⚙️ *Atualize esta seção conforme as tecnologias reais do projeto.*

---

## 📁 Estrutura de Pastas

```
furos-de-estoque/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   ├── styles/
│   └── main.js
├── README.md
└── package.json
```

---

## 📈 Roadmap

- [ ] Autenticação de usuários
- [ ] Histórico por usuário
- [ ] Gráficos de furos por período
- [ ] Integração com sistema ERP
- [ ] Notificações por e-mail em furos críticos

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Faça um **fork** do projeto
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas alterações: `git commit -m 'feat: adiciona minha feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um **Pull Request**

---

## 📄 Licença

Este projeto está sob a licença [MIT](./LICENSE).

---

<div align="center">
  Feito com raiva e preguiça para otimizar o controle de estoque
</div>
