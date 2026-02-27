# Cenários de Teste e Documentação de Processos

> Documento de referência para testes automatizados (E2E e unitários) dos módulos:
> Empreiteiras, Contratos, Diário de Obra e Medições.

---

## 1. Empreiteiras (Contractors)

### 1.1 Descrição do Módulo

Cadastro de empresas subcontratadas que atuam nas obras. Módulo base referenciado por Contratos, Diário de Obra e Medições.

**Rota:** `/{slug}/contractors`
**Permissões:** Somente `admin` pode criar, editar e ativar/desativar. Demais roles podem apenas listar.

### 1.2 Tabela no Banco

| Coluna | Tipo | Obrigatório | Observação |
|--------|------|:-----------:|------------|
| id | UUID | Sim | PK, auto |
| tenantId | UUID | Sim | FK tenants — isolamento obrigatório |
| name | varchar(255) | Sim | Razão Social (mín 3 caracteres) |
| cnpj | varchar(18) | Não | Documento fiscal |
| contactName | varchar(255) | Não | Responsável |
| contactEmail | varchar(255) | Não | Validação de formato e-mail |
| contactPhone | varchar(20) | Não | Telefone |
| bankInfo | text | Não | Dados bancários (máx 1000 chars) |
| nfAddress | text | Não | Endereço para NF (máx 1000 chars) |
| ceiMatricula | varchar(30) | Não | Matrícula CEI |
| active | boolean | Sim | Default: true |
| createdAt | timestamp | Sim | Auto |
| updatedAt | timestamp | Sim | Auto |

### 1.3 Ações (Server Actions)

| Action | Permissão | Descrição |
|--------|-----------|-----------|
| `listContractors` | Todos | Lista paginada com busca por nome/CNPJ e ordenação |
| `listActiveContractors` | Todos | Lista leve (id, name) das ativas — para selects/dropdowns |
| `createContractor` | Admin | Cria empreiteira com validação Zod |
| `updateContractor` | Admin | Atualização parcial de campos |
| `toggleContractorActive` | Admin | Alterna status ativo/inativo |

### 1.4 Cenários de Teste

#### CT-EMP-001: Criar empreiteira com dados mínimos
- **Pré-condição:** Usuário admin logado
- **Entrada:** name = "Construtora Teste Ltda"
- **Resultado esperado:** Empreiteira criada com active=true, demais campos null
- **Validação:** Aparece na listagem, toast de sucesso

#### CT-EMP-002: Criar empreiteira com todos os campos
- **Pré-condição:** Usuário admin logado
- **Entrada:** Todos os campos preenchidos (name, cnpj, contactName, contactEmail, contactPhone, bankInfo, nfAddress, ceiMatricula)
- **Resultado esperado:** Todos os campos salvos corretamente
- **Validação:** Abrir edição e verificar que todos os valores persistiram

#### CT-EMP-003: Validação de campos obrigatórios
- **Pré-condição:** Usuário admin logado
- **Entrada:** Formulário vazio (name em branco)
- **Resultado esperado:** Erro de validação — "name" é obrigatório (mín 3 chars)
- **Validação:** Mensagem de erro no campo, formulário não submete

#### CT-EMP-004: Validação de e-mail inválido
- **Pré-condição:** Usuário admin logado
- **Entrada:** contactEmail = "email-invalido"
- **Resultado esperado:** Erro de validação no campo e-mail
- **Validação:** Mensagem de formato inválido

#### CT-EMP-005: Editar empreiteira
- **Pré-condição:** Empreiteira existente
- **Entrada:** Alterar name para "Novo Nome Ltda"
- **Resultado esperado:** Nome atualizado, updatedAt atualizado
- **Validação:** Nome novo aparece na listagem

#### CT-EMP-006: Ativar/Desativar empreiteira
- **Pré-condição:** Empreiteira ativa existente
- **Ação:** Clicar no botão de toggle (ícone Power)
- **Resultado esperado:** Status muda para inativo, badge muda para "Inativo"
- **Validação:** Toggle novamente retorna para "Ativo"

#### CT-EMP-007: Busca por nome
- **Pré-condição:** Múltiplas empreiteiras cadastradas
- **Entrada:** Digitar parte do nome no campo de busca
- **Resultado esperado:** Lista filtrada mostrando apenas matches (case-insensitive)

#### CT-EMP-008: Busca por CNPJ
- **Pré-condição:** Empreiteira com CNPJ cadastrado
- **Entrada:** Digitar parte do CNPJ no campo de busca
- **Resultado esperado:** Lista filtrada pelo CNPJ

#### CT-EMP-009: Ordenação por colunas
- **Pré-condição:** Múltiplas empreiteiras cadastradas
- **Ação:** Clicar no header "Nome" para ordenar
- **Resultado esperado:** Lista reordenada A-Z, clicar novamente inverte para Z-A

#### CT-EMP-010: Permissão — inspetor não pode criar
- **Pré-condição:** Usuário com role "inspetor" logado
- **Ação:** Tentar criar empreiteira via action
- **Resultado esperado:** Erro "Sem permissão" retornado

#### CT-EMP-011: Isolamento de tenant
- **Pré-condição:** Empreiteira do tenant A
- **Ação:** Usuário do tenant B tenta listar
- **Resultado esperado:** Empreiteira do tenant A não aparece na listagem do tenant B

#### CT-EMP-012: Paginação
- **Pré-condição:** Mais de 10 empreiteiras cadastradas
- **Ação:** Navegar para página 2
- **Resultado esperado:** Exibe registros 11-20, paginação atualiza

#### CT-EMP-013: Estado vazio
- **Pré-condição:** Nenhuma empreiteira cadastrada no tenant
- **Resultado esperado:** Exibe EmptyState com mensagem e botão "Nova Empreiteira"

---

## 2. Contratos (Contracts)

### 2.1 Descrição do Módulo

Gerencia contratos de serviço entre o tenant e as empreiteiras, vinculados a obras específicas. Cada contrato possui itens com unidade, preço unitário e quantidade contratada.

**Rota:** `/{slug}/contracts`
**Sub-rotas:** `/new`, `/[id]`, `/[id]/edit`
**Permissões:** Somente `admin` pode criar, editar e ativar/desativar.

### 2.2 Tabelas no Banco

**Tabela `contracts`:**

| Coluna | Tipo | Obrigatório | Observação |
|--------|------|:-----------:|------------|
| id | UUID | Sim | PK |
| tenantId | UUID | Sim | FK tenants |
| projectId | UUID | Sim | FK projects — obra vinculada |
| contractorId | UUID | Sim | FK contractors — empreiteira |
| contractNumber | varchar(50) | Sim | Número do contrato (1-50 chars) |
| startDate | date | Sim | Data de início (formato YYYY-MM-DD) |
| endDate | date | Não | Data de término |
| technicalRetentionPct | numeric(5,2) | Sim | % retenção técnica (default 5%, range 0-100) |
| notes | text | Não | Observações (máx 2000 chars) |
| active | boolean | Sim | Default: true |
| createdAt, updatedAt | timestamp | Sim | Auto |

**Tabela `contractItems`:**

| Coluna | Tipo | Obrigatório | Observação |
|--------|------|:-----------:|------------|
| id | UUID | Sim | PK |
| contractId | UUID | Sim | FK contracts (cascade delete) |
| itemNumber | varchar(20) | Sim | Ex: "1.1", "2.3" |
| serviceName | varchar(255) | Sim | Nome do serviço (mín 2 chars) |
| unit | varchar(10) | Sim | Enum: M2, M3, ML, KG, VB, DIA, UNID, M, TON, L |
| unitPrice | numeric(14,4) | Sim | Preço unitário (mín 0.0001) |
| contractedQuantity | numeric(14,4) | Sim | Qtd contratada (mín 0.0001) |
| sortOrder | integer | Não | Ordem de exibição |
| active | boolean | Sim | Default: true |
| createdAt | timestamp | Sim | Auto |

### 2.3 Ações (Server Actions)

| Action | Permissão | Descrição |
|--------|-----------|-----------|
| `listContracts` | Todos | Lista paginada com busca e ordenação |
| `getContract` | Todos | Busca contrato com itens (join project + contractor) |
| `createContract` | Admin | Cria contrato + itens em transação |
| `updateContract` | Admin | Atualiza contrato, deleta itens antigos e insere novos |
| `toggleContractActive` | Admin | Alterna ativo/inativo |
| `listContractItemsForBulletin` | Todos | Lista itens ativos para uso no módulo Medições |

### 2.4 Cenários de Teste

#### CT-CTR-001: Criar contrato com dados válidos
- **Pré-condição:** Admin logado, obra e empreiteira cadastradas
- **Entrada:** projectId, contractorId, contractNumber="CTR-001", startDate, ao menos 1 item
- **Resultado esperado:** Contrato criado com status ativo e itens vinculados
- **Validação:** Aparece na listagem, detalhe mostra itens com valores corretos

#### CT-CTR-002: Contrato deve ter pelo menos 1 item
- **Pré-condição:** Admin logado
- **Entrada:** Contrato sem itens (array vazio)
- **Resultado esperado:** Erro de validação — itens obrigatórios
- **Validação:** Formulário não submete

#### CT-CTR-003: Validação dos itens do contrato
- **Pré-condição:** Admin logado
- **Entrada:** Item com unitPrice=0 ou contractedQuantity=0
- **Resultado esperado:** Erro de validação (mínimo 0.0001)
- **Validação:** Mensagem de erro nos campos do item

#### CT-CTR-004: Cálculo do valor total
- **Pré-condição:** Contrato com 3 itens
- **Entrada:** Item1: 10un x R$100, Item2: 5un x R$200, Item3: 20un x R$50
- **Resultado esperado:** Total = R$3.000,00 (1000 + 1000 + 1000)
- **Validação:** Valor total exibido corretamente no formulário e no detalhe

#### CT-CTR-005: Editar contrato — itens são substituídos
- **Pré-condição:** Contrato existente com 2 itens
- **Ação:** Editar, remover 1 item e adicionar 2 novos
- **Resultado esperado:** Contrato fica com 3 itens (1 antigo + 2 novos)
- **Validação:** Detalhe mostra os 3 itens corretos

#### CT-CTR-006: Retenção técnica padrão 5%
- **Pré-condição:** Admin logado
- **Ação:** Criar contrato sem alterar retenção
- **Resultado esperado:** technicalRetentionPct = 5.00
- **Validação:** Detalhe exibe "5,00%"

#### CT-CTR-007: Validação de projeto e empreiteira do tenant
- **Pré-condição:** Admin logado
- **Ação:** Tentar criar contrato com projectId de outro tenant
- **Resultado esperado:** Erro "Obra não encontrada"

#### CT-CTR-008: Ativar/Desativar contrato
- **Pré-condição:** Contrato ativo existente
- **Ação:** Toggle via botão Power
- **Resultado esperado:** Status alterna, badge atualiza

#### CT-CTR-009: Busca por número do contrato
- **Pré-condição:** Múltiplos contratos
- **Entrada:** Digitar "CTR-001" na busca
- **Resultado esperado:** Lista filtrada

#### CT-CTR-010: Ordenação por colunas
- **Ação:** Ordenar por número, obra, empreiteira, data início
- **Resultado esperado:** Cada coluna ordena corretamente asc/desc

#### CT-CTR-011: Cascade delete — deletar contrato remove itens
- **Pré-condição:** Contrato com 5 itens
- **Ação:** Deletar contrato
- **Resultado esperado:** Contrato e todos os 5 itens removidos do banco

#### CT-CTR-012: Permissão — inspetor não pode criar contrato
- **Pré-condição:** Usuário inspetor
- **Ação:** Tentar criar contrato
- **Resultado esperado:** Erro de permissão

---

## 3. Diário de Obra (Site Diary)

### 3.1 Descrição do Módulo

Registro diário da obra documentando mão de obra, equipamentos, serviços executados, clima e observações. Possui fluxo de assinaturas (estado máquina) com 4 estágios.

**Rota:** `/{slug}/site-diary`
**Sub-rotas:** `/new`, `/[id]`, `/[id]/edit`
**Permissões:** `admin` e `supervisor` podem criar/editar. Apenas `admin` pode deletar. `inspetor` não pode criar/editar.

### 3.2 Tabelas no Banco

**Tabela `siteDiaries` (cabeçalho):**

| Coluna | Tipo | Obrigatório | Observação |
|--------|------|:-----------:|------------|
| id | UUID | Sim | PK |
| projectId | UUID | Sim | FK projects |
| entryDate | date | Sim | UNIQUE por (projectId + entryDate) |
| orderNumber | varchar(50) | Não | Número da OS |
| contractorName | varchar(255) | Não | Nome da prestadora |
| networkDiagramRef | varchar(100) | Não | Referência diagrama de rede |
| engineerName | varchar(255) | Não | Nome do engenheiro |
| foremanName | varchar(255) | Não | Nome do encarregado |
| weatherCondition | varchar(20) | Sim | NONE / LIGHT_RAIN / HEAVY_RAIN |
| workSuspended | boolean | Sim | Default: false |
| totalHours | numeric(5,2) | Não | 0-24 horas |
| status | varchar(30) | Sim | DRAFT → SUBMITTED → CONTRACTOR_SIGNED → INSPECTION_SIGNED |
| createdBy | UUID | Sim | FK users |
| createdAt, updatedAt | timestamp | Sim | Auto |

**Tabela `diaryLaborEntries` (mão de obra):**

| Coluna | Tipo | Obrigatório |
|--------|------|:-----------:|
| id | UUID | Sim |
| diaryId | UUID | Sim (cascade) |
| role | varchar | Sim (mín 2 chars) |
| quantity | integer | Sim (mín 1) |
| hours | numeric | Sim (mín 0.5) |
| sortOrder | integer | Não |

**Tabela `diaryEquipmentEntries` (equipamentos):**

| Coluna | Tipo | Obrigatório |
|--------|------|:-----------:|
| id | UUID | Sim |
| diaryId | UUID | Sim (cascade) |
| description | varchar | Sim (mín 2 chars) |
| quantity | integer | Sim (mín 1) |
| notes | varchar | Não (máx 500) |
| sortOrder | integer | Não |

**Tabela `diaryServicesExecuted` (serviços executados):**

| Coluna | Tipo | Obrigatório |
|--------|------|:-----------:|
| id | UUID | Sim |
| diaryId | UUID | Sim (cascade) |
| description | varchar | Sim (mín 2 chars) |
| serviceId | UUID | Não (ref services) |
| sortOrder | integer | Não |

**Tabela `diaryObservations` (observações):**

| Coluna | Tipo | Obrigatório |
|--------|------|:-----------:|
| id | UUID | Sim |
| diaryId | UUID | Sim (cascade) |
| origin | varchar | Sim: CONTRACTOR / INSPECTION / DMUA |
| text | text | Sim (mín 3 chars) |
| createdBy | UUID | Não |

**Tabela `diaryServiceReleases` (assinaturas):**

| Coluna | Tipo | Obrigatório |
|--------|------|:-----------:|
| id | UUID | Sim |
| diaryId | UUID | Sim (cascade) |
| stage | varchar | Sim: CONTRACTOR / INSPECTION |
| signedBy | varchar | Não |
| notes | text | Não |
| signedAt | timestamp | Sim |
| UNIQUE | (diaryId, stage) | — |

### 3.3 Máquina de Estados

```
DRAFT (editável, deletável)
  ↓ submitDiary()
SUBMITTED (bloqueado para edição)
  ↓ signDiary('CONTRACTOR')
CONTRACTOR_SIGNED
  ↓ signDiary('INSPECTION')
INSPECTION_SIGNED (final — somente leitura)
```

### 3.4 Ações (Server Actions)

| Action | Permissão | Descrição |
|--------|-----------|-----------|
| `listSiteDiaries` | Todos | Lista paginada com filtros (projeto, status, busca por prestadora) |
| `getSiteDiary` | Todos | Busca diário completo com todas as sub-tabelas |
| `createSiteDiary` | Admin, Supervisor | Cria diário + sub-entradas em transação |
| `updateSiteDiary` | Admin, Supervisor | Atualiza (somente DRAFT). Deleta/re-insere sub-entradas |
| `submitDiary` | Admin, Supervisor | DRAFT → SUBMITTED |
| `signDiary` | Admin, Supervisor | Assinatura por estágio (CONTRACTOR ou INSPECTION) |
| `deleteSiteDiary` | Admin | Somente DRAFT. Cascade delete |

### 3.5 Cenários de Teste

#### CT-DIO-001: Criar diário com dados mínimos
- **Pré-condição:** Admin logado, obra cadastrada
- **Entrada:** projectId, entryDate=hoje, weatherCondition=NONE, workSuspended=false
- **Resultado esperado:** Diário criado com status DRAFT
- **Validação:** Aparece na listagem com status "Rascunho"

#### CT-DIO-002: Criar diário completo com todas as seções
- **Pré-condição:** Admin logado
- **Entrada:** Todos os campos do cabeçalho + mão de obra (2 entradas) + equipamentos (1 entrada) + serviços executados (2 entradas) + observações (1 entrada)
- **Resultado esperado:** Diário e todas as sub-entradas salvos
- **Validação:** Detalhe exibe todas as seções preenchidas

#### CT-DIO-003: Restrição de data única por obra
- **Pré-condição:** Diário existente para obra X na data 2026-02-26
- **Entrada:** Criar outro diário para obra X na mesma data
- **Resultado esperado:** Erro de constraint unique (código 23505)
- **Validação:** Mensagem informando que já existe diário para essa data

#### CT-DIO-004: Validação de mão de obra — quantidade mínima
- **Entrada:** Labor entry com quantity=0 ou hours=0
- **Resultado esperado:** Erro de validação (quantity mín 1, hours mín 0.5)

#### CT-DIO-005: Adicionar e remover linhas dinâmicas
- **Ação:** No formulário, adicionar 3 entradas de mão de obra, remover a 2ª
- **Resultado esperado:** Formulário mostra 2 entradas (1ª e 3ª)
- **Validação:** Ao salvar, somente as 2 entradas persistem

#### CT-DIO-006: Editar diário em status DRAFT
- **Pré-condição:** Diário DRAFT existente
- **Ação:** Alterar weatherCondition para HEAVY_RAIN, adicionar equipamento
- **Resultado esperado:** Dados atualizados, sub-entradas substituídas
- **Validação:** Detalhe mostra dados novos

#### CT-DIO-007: Não permitir edição fora do DRAFT
- **Pré-condição:** Diário com status SUBMITTED
- **Ação:** Tentar acessar rota /edit
- **Resultado esperado:** Redirect para página de detalhe (view only)

#### CT-DIO-008: Fluxo completo de assinaturas
- **Pré-condição:** Diário DRAFT criado
- **Passos:**
  1. Submit → status muda para SUBMITTED
  2. Sign CONTRACTOR → status muda para CONTRACTOR_SIGNED
  3. Sign INSPECTION → status muda para INSPECTION_SIGNED
- **Validação:** A cada etapa o badge muda. No final, nenhuma ação disponível (somente leitura)

#### CT-DIO-009: Assinatura fora da ordem
- **Pré-condição:** Diário SUBMITTED
- **Ação:** Tentar signDiary('INSPECTION') direto (pulando CONTRACTOR)
- **Resultado esperado:** Erro — estágio INSPECTION requer status CONTRACTOR_SIGNED

#### CT-DIO-010: Assinatura dupla no mesmo estágio
- **Pré-condição:** Diário CONTRACTOR_SIGNED
- **Ação:** Tentar signDiary('CONTRACTOR') novamente
- **Resultado esperado:** Erro — CONTRACTOR já assinado (constraint unique)

#### CT-DIO-011: Deletar diário — somente DRAFT e admin
- **Pré-condição:** Diário SUBMITTED e usuário admin
- **Ação:** Tentar deletar
- **Resultado esperado:** Erro — só pode deletar DRAFT

#### CT-DIO-012: Deletar diário DRAFT — cascade
- **Pré-condição:** Diário DRAFT com mão de obra, equipamentos, serviços, observações
- **Ação:** Deletar o diário
- **Resultado esperado:** Diário e todas as sub-entradas removidos

#### CT-DIO-013: Permissão — inspetor não pode criar
- **Pré-condição:** Usuário inspetor logado
- **Ação:** Tentar createSiteDiary
- **Resultado esperado:** Erro de permissão

#### CT-DIO-014: Exportação PDF
- **Pré-condição:** Diário completo com todas as seções
- **Ação:** Clicar "Exportar PDF"
- **Resultado esperado:** PDF gerado com header "DIÁRIO DE OBRA — FO.06.03", tabelas de mão de obra, equipamentos, serviços, observações e assinaturas
- **Validação:** Arquivo baixado com nome `Diario_[Obra]_[Data].pdf`

#### CT-DIO-015: Indicadores visuais de clima
- **Pré-condição:** 3 diários com cada condição climática
- **Resultado esperado:** Ícones diferentes na tabela (nuvem, garoa, chuva)

#### CT-DIO-016: Badge de obra suspensa
- **Pré-condição:** Diário com workSuspended=true
- **Resultado esperado:** Badge vermelho "Suspenso" visível na tabela

#### CT-DIO-017: Filtro por obra
- **Pré-condição:** Diários de múltiplas obras
- **Ação:** Filtrar por projectId específico
- **Resultado esperado:** Somente diários da obra selecionada

#### CT-DIO-018: Filtro por status
- **Pré-condição:** Diários em diferentes status
- **Ação:** Filtrar por status=SUBMITTED
- **Resultado esperado:** Somente diários submetidos

---

## 4. Medições (Measurements / Boletim de Medição)

### 4.1 Descrição do Módulo

Gera boletins de medição (BM) periódicos para faturamento de serviços contratados. Calcula valores acumulados, aditivos, descontos e retenção técnica. Possui workflow de aprovação em 3 estágios.

**Rota:** `/{slug}/measurements`
**Sub-rotas:** `/new`, `/[id]`, `/[id]/edit`
**Permissões:** `admin` e `supervisor` podem criar/editar. Somente `admin` pode deletar. Qualquer autenticado pode submeter e aprovar.

### 4.2 Tabelas no Banco

**Tabela `measurement_bulletins` (cabeçalho do BM):**

| Coluna | Tipo | Obrigatório | Observação |
|--------|------|:-----------:|------------|
| id | UUID | Sim | PK |
| contractId | UUID | Sim | FK contracts |
| bmNumber | integer | Sim | Número sequencial do BM (mín 1) |
| sheetNumber | integer | Sim | Default: 1 |
| periodStart | date | Sim | Início do período (YYYY-MM-DD) |
| periodEnd | date | Sim | Fim do período (YYYY-MM-DD) |
| dueDate | date | Não | Data de vencimento |
| discountValue | numeric(14,2) | Sim | Default: 0 |
| observations | text | Não | Máx 2000 chars |
| status | varchar(30) | Sim | DRAFT → SUBMITTED → PLANNING_APPROVED → MANAGEMENT_APPROVED → CONTRACTOR_AGREED / REJECTED |
| createdBy | UUID | Sim | FK users |
| createdAt, updatedAt | timestamp | Sim | Auto |

**Tabela `measurement_items` (itens medidos):**

| Coluna | Tipo | Obrigatório | Observação |
|--------|------|:-----------:|------------|
| id | UUID | Sim | PK |
| bulletinId | UUID | Sim | FK bulletins (cascade) |
| contractItemId | UUID | Sim | FK contract_items |
| quantityThisPeriod | numeric(14,4) | Sim | Quantidade executada no período (mín 0) |
| UNIQUE | (bulletinId, contractItemId) | — | Um item por contrato por BM |

**Tabela `measurement_additives` (aditivos):**

| Coluna | Tipo | Obrigatório | Observação |
|--------|------|:-----------:|------------|
| id | UUID | Sim | PK |
| bulletinId | UUID | Sim | FK bulletins (cascade) |
| itemNumber | varchar(20) | Sim | Ex: "AD-1" |
| serviceName | varchar(255) | Sim | Mín 2 chars |
| unit | varchar(10) | Sim | Mesmas unidades dos itens de contrato |
| unitPrice | numeric(14,4) | Sim | Mín 0.0001 |
| contractedQuantity | numeric(14,4) | Sim | Mín 0.0001 |
| quantityThisPeriod | numeric(14,4) | Sim | Mín 0 |
| sortOrder | integer | Não | Ordem de exibição |

**Tabela `measurement_approvals` (histórico de aprovações):**

| Coluna | Tipo | Obrigatório | Observação |
|--------|------|:-----------:|------------|
| id | UUID | Sim | PK |
| bulletinId | UUID | Sim | FK bulletins (cascade) |
| stage | varchar(20) | Sim | PLANNING / MANAGEMENT / CONTRACTOR |
| action | varchar(20) | Sim | APPROVED / REJECTED |
| userId | UUID | Não | FK users |
| notes | text | Não | Justificativa |
| createdAt | timestamp | Sim | Auto |

### 4.3 Máquina de Estados (Workflow de Aprovação)

```
DRAFT (editável)
  ↓ submitBulletin()
SUBMITTED
  ↓ approveBulletin(PLANNING, APPROVED)     → PLANNING_APPROVED
  ↓ approveBulletin(PLANNING, REJECTED)     → REJECTED
PLANNING_APPROVED
  ↓ approveBulletin(MANAGEMENT, APPROVED)   → MANAGEMENT_APPROVED
  ↓ approveBulletin(MANAGEMENT, REJECTED)   → REJECTED
MANAGEMENT_APPROVED
  ↓ approveBulletin(CONTRACTOR, APPROVED)   → CONTRACTOR_AGREED (final)
  ↓ approveBulletin(CONTRACTOR, REJECTED)   → REJECTED

REJECTED → pode ser editado → volta para DRAFT → re-submeter
```

### 4.4 Cálculos Financeiros

| Cálculo | Fórmula |
|---------|---------|
| Valor acumulado anterior | Soma de quantityThisPeriod dos BMs anteriores × unitPrice |
| Valor este mês (item) | quantityThisPeriod × unitPrice |
| Acumulado atual | Acumulado anterior + Este mês |
| % Executado | (Acumulado atual / Qtd contratada) × 100 |
| Saldo físico | Qtd contratada - Acumulado atual |
| Total bruto | Σ(Itens R$ este mês) + Σ(Aditivos R$ este mês) |
| Total líquido | Total bruto - Descontos |
| Retenção técnica | Total líquido × (% retenção / 100) |
| Valor NF | Total líquido - Retenção técnica |

### 4.5 Ações (Server Actions)

| Action | Permissão | Descrição |
|--------|-----------|-----------|
| `listBulletins` | Todos | Lista paginada com filtros (contrato, status) |
| `getBulletin` | Todos | Busca BM completo com itens, aditivos, aprovações e acumulados |
| `getAccumulatedQuantities` | Todos | Calcula totais acumulados dos BMs anteriores |
| `createBulletin` | Admin, Supervisor | Cria BM + itens + aditivos em transação |
| `updateBulletin` | Admin, Supervisor | Atualiza BM (somente DRAFT ou REJECTED). REJECTED volta para DRAFT |
| `submitBulletin` | Todos autenticados | DRAFT → SUBMITTED |
| `approveBulletin` | Todos autenticados | Aprova/rejeita por estágio (PLANNING, MANAGEMENT, CONTRACTOR) |
| `deleteBulletin` | Admin | Somente DRAFT. Cascade delete |
| `listContractsForBulletin` | Todos | Lista contratos ativos para dropdown |

### 4.6 Cenários de Teste

#### CT-MED-001: Criar boletim com dados válidos
- **Pré-condição:** Admin logado, contrato com itens existente
- **Entrada:** contractId, bmNumber=1, período, ao menos 1 item com quantityThisPeriod > 0
- **Resultado esperado:** BM criado com status DRAFT
- **Validação:** Aparece na listagem com status "Rascunho"

#### CT-MED-002: Itens do contrato carregam automaticamente
- **Pré-condição:** Contrato com 5 itens
- **Ação:** Selecionar contrato no formulário de novo BM
- **Resultado esperado:** Tabela de itens mostra os 5 itens do contrato com campos de quantidade zerados

#### CT-MED-003: Cálculo de acumulados de BMs anteriores
- **Pré-condição:** BM-1 com item X = 100 unidades, BM-2 com item X = 50 unidades
- **Ação:** Criar BM-3
- **Resultado esperado:** Acumulado anterior do item X = 150
- **Validação:** Campo "Acumulado" exibe 150

#### CT-MED-004: Cálculos financeiros em tempo real
- **Pré-condição:** BM com 2 itens: Item1 (10un × R$100) e Item2 (5un × R$200)
- **Resultado esperado:**
  - Total itens = R$2.000 (1000 + 1000)
  - Total bruto = R$2.000
  - Desconto = R$0
  - Total líquido = R$2.000
  - Retenção 5% = R$100
  - Valor NF = R$1.900

#### CT-MED-005: Aditivos incluídos no cálculo
- **Pré-condição:** BM com itens R$1.000 + aditivo (10un × R$50 = R$500)
- **Resultado esperado:** Total bruto = R$1.500

#### CT-MED-006: Desconto aplicado corretamente
- **Pré-condição:** BM com total bruto R$10.000 e discountValue R$500
- **Resultado esperado:** Total líquido = R$9.500, Retenção = R$475, NF = R$9.025

#### CT-MED-007: Workflow completo de aprovação
- **Pré-condição:** BM criado
- **Passos:**
  1. Submit → SUBMITTED
  2. Approve PLANNING → PLANNING_APPROVED
  3. Approve MANAGEMENT → MANAGEMENT_APPROVED
  4. Approve CONTRACTOR → CONTRACTOR_AGREED
- **Validação:** Badge muda a cada etapa. Histórico de aprovações registrado

#### CT-MED-008: Rejeição em qualquer estágio
- **Pré-condição:** BM com status PLANNING_APPROVED
- **Ação:** Reject MANAGEMENT com notes="Valores incorretos"
- **Resultado esperado:** Status = REJECTED, registro de aprovação com action=REJECTED e notas

#### CT-MED-009: Re-editar BM rejeitado
- **Pré-condição:** BM com status REJECTED
- **Ação:** Acessar edição e salvar alterações
- **Resultado esperado:** Status volta para DRAFT, pode ser re-submetido
- **Validação:** Botão "Submeter" disponível novamente

#### CT-MED-010: Aprovação fora da ordem
- **Pré-condição:** BM com status SUBMITTED
- **Ação:** Tentar approveBulletin(MANAGEMENT, APPROVED)
- **Resultado esperado:** Erro — estágio MANAGEMENT requer status PLANNING_APPROVED

#### CT-MED-011: Não permitir edição de BM submetido
- **Pré-condição:** BM com status SUBMITTED
- **Ação:** Acessar rota /edit
- **Resultado esperado:** Redirect para página de detalhe

#### CT-MED-012: Deletar BM — somente DRAFT e admin
- **Pré-condição:** BM com status SUBMITTED
- **Ação:** Tentar deletar
- **Resultado esperado:** Erro — só DRAFT pode ser deletado

#### CT-MED-013: Exportação PDF do BM
- **Pré-condição:** BM completo com itens e aditivos
- **Ação:** Clicar "Exportar PDF"
- **Resultado esperado:** PDF com header "BOLETIM DE MEDIÇÃO — FO.12-3", tabelas de itens, aditivos, resumo financeiro, linhas de assinatura
- **Validação:** Arquivo `BM_{numero}_{empreiteira}.pdf`

#### CT-MED-014: Histórico de aprovações no detalhe
- **Pré-condição:** BM com 3 aprovações registradas
- **Resultado esperado:** Timeline exibindo estágio, ação, usuário, notas e data de cada aprovação

#### CT-MED-015: Permissão — inspetor não pode criar BM
- **Pré-condição:** Usuário inspetor
- **Ação:** Tentar createBulletin
- **Resultado esperado:** Erro de permissão

#### CT-MED-016: Constraint unique de item por BM
- **Pré-condição:** BM com contractItemId "X" já inserido
- **Ação:** Tentar inserir mesmo contractItemId novamente
- **Resultado esperado:** Erro de constraint (um item por contrato por BM)

#### CT-MED-017: Filtro por contrato
- **Pré-condição:** BMs de múltiplos contratos
- **Ação:** Filtrar por contractId específico
- **Resultado esperado:** Somente BMs do contrato selecionado

#### CT-MED-018: Filtro por status
- **Pré-condição:** BMs em diferentes status
- **Ação:** Filtrar por status=REJECTED
- **Resultado esperado:** Somente BMs rejeitados

---

## 5. Dados de Teste Sugeridos (Fixtures)

### Tenant Base
```
Tenant: "Construtora Alpha"
Slug: "alpha"
Status: ACTIVE
```

### Usuários
```
Admin:      { name: "Carlos Admin", role: "admin" }
Supervisor: { name: "Maria Supervisora", role: "supervisor" }
Inspetor:   { name: "João Inspetor", role: "inspetor" }
```

### Obras
```
Obra 1: { name: "Edifício Aurora", address: "Rua A, 100" }
Obra 2: { name: "Residencial Sol", address: "Av. B, 200" }
```

### Empreiteiras
```
Empreiteira 1: { name: "Silva & Cia Ltda", cnpj: "12.345.678/0001-90", active: true }
Empreiteira 2: { name: "Construtec ME", cnpj: "98.765.432/0001-10", active: true }
Empreiteira 3: { name: "Inativa Engenharia", active: false }
```

### Contratos
```
Contrato 1: {
  contractNumber: "CTR-2026-001",
  project: Obra 1,
  contractor: Empreiteira 1,
  startDate: "2026-01-01",
  technicalRetentionPct: 5,
  items: [
    { itemNumber: "1.1", serviceName: "Alvenaria", unit: "M2", unitPrice: 85.00, contractedQuantity: 500 },
    { itemNumber: "1.2", serviceName: "Reboco", unit: "M2", unitPrice: 45.00, contractedQuantity: 500 },
    { itemNumber: "2.1", serviceName: "Contrapiso", unit: "M2", unitPrice: 60.00, contractedQuantity: 300 }
  ]
}
```

### Diário de Obra
```
Diário 1 (DRAFT): {
  project: Obra 1,
  entryDate: "2026-02-26",
  weatherCondition: "NONE",
  workSuspended: false,
  labor: [{ role: "Pedreiro", quantity: 4, hours: 8 }],
  equipment: [{ description: "Betoneira 400L", quantity: 1 }],
  services: [{ description: "Alvenaria 3º pavimento" }]
}

Diário 2 (INSPECTION_SIGNED): {
  project: Obra 1,
  entryDate: "2026-02-25",
  weatherCondition: "LIGHT_RAIN",
  workSuspended: false,
  totalHours: 6
}
```

### Boletim de Medição
```
BM 1 (DRAFT): {
  contract: Contrato 1,
  bmNumber: 1,
  periodStart: "2026-01-01",
  periodEnd: "2026-01-31",
  items: [
    { contractItemId: "1.1", quantityThisPeriod: 100 },
    { contractItemId: "1.2", quantityThisPeriod: 80 },
    { contractItemId: "2.1", quantityThisPeriod: 50 }
  ]
}
```

---

## 6. Matriz de Permissões por Módulo

| Ação | Admin | Supervisor | Inspetor |
|------|:-----:|:----------:|:--------:|
| **Empreiteiras** | | | |
| Listar | ✅ | ✅ | ✅ |
| Criar | ✅ | ❌ | ❌ |
| Editar | ✅ | ❌ | ❌ |
| Ativar/Desativar | ✅ | ❌ | ❌ |
| **Contratos** | | | |
| Listar | ✅ | ✅ | ✅ |
| Visualizar detalhe | ✅ | ✅ | ✅ |
| Criar | ✅ | ❌ | ❌ |
| Editar | ✅ | ❌ | ❌ |
| Ativar/Desativar | ✅ | ❌ | ❌ |
| **Diário de Obra** | | | |
| Listar | ✅ | ✅ | ✅ |
| Visualizar detalhe | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ❌ |
| Editar (DRAFT) | ✅ | ✅ | ❌ |
| Submeter | ✅ | ✅ | ❌ |
| Assinar | ✅ | ✅ | ❌ |
| Deletar (DRAFT) | ✅ | ❌ | ❌ |
| Exportar PDF | ✅ | ✅ | ✅ |
| **Medições** | | | |
| Listar | ✅ | ✅ | ✅ |
| Visualizar detalhe | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ❌ |
| Editar (DRAFT/REJECTED) | ✅ | ✅ | ❌ |
| Submeter | ✅ | ✅ | ✅ |
| Aprovar/Rejeitar | ✅ | ✅ | ✅ |
| Deletar (DRAFT) | ✅ | ❌ | ❌ |
| Exportar PDF | ✅ | ✅ | ✅ |

---

## 5. Cadastro de Obra — Campos Expandidos (Projects)

### 5.1 Descrição

O cadastro de obra foi ampliado para incluir dados contratuais, prazos, responsáveis técnicos e características. O formulário agora é uma página completa (`/projects/new` e `/projects/[id]/edit`) em vez de um dialog.

**Rota:** `/{slug}/projects/new` · `/{slug}/projects/[id]/edit`
**Novos campos:** clientName, contractNumber, startDate, endDate, engineerName, supervision, characteristics, notes

### 5.2 Cenários de Teste

#### CT-OBR-001: Criar obra com campos completos (novos)
- **Pré-condição:** Admin logado
- **Entrada:** name + todos os novos campos: clientName="Prefeitura SP", contractNumber="CT-2026-001", startDate="2026-01-01", endDate="2026-12-31", engineerName="Dr. Silva", supervision="Secretaria de Obras", characteristics="Pavimentação asfáltica, 500m", notes="Prazo crítico"
- **Resultado esperado:** Obra criada com todos os campos persistidos
- **Validação:** Abrir edição e verificar que todos os valores estão corretos

#### CT-OBR-002: Obra com campos novos opcionais em branco
- **Entrada:** Apenas name obrigatório, todos os novos campos em branco
- **Resultado esperado:** Obra criada com success — campos opcionais ficam null no banco

#### CT-OBR-003: Indicador de prazo vencido no Dashboard
- **Pré-condição:** Obra ativa com endDate = ontem (data passada)
- **Resultado esperado:** Dashboard exibe alerta âmbar "1 obra está com prazo vencido"
- **Validação:** Clicar em "Ver obras" navega para `/projects`

#### CT-OBR-004: Indicador não aparece quando nenhuma obra está atrasada
- **Pré-condição:** Todas as obras ativas têm endDate nulo ou futuro
- **Resultado esperado:** Banner de alerta NÃO aparece no dashboard

#### CT-OBR-005: Indicador não aparece com filtro de obra ativo
- **Pré-condição:** Obra X com prazo vencido, obra Y sem atraso
- **Ação:** Filtrar dashboard pela obra Y
- **Resultado esperado:** Banner de alerta âmbar NÃO aparece (filtro de projeto ativo oculta o alerta global)

#### CT-OBR-006: Navegar para edição via página completa
- **Ação:** Na listagem de obras, clicar em "Editar" no card
- **Resultado esperado:** Navega para `/[slug]/projects/[id]/edit`, não abre dialog
- **Validação:** Todos os campos novos estão pré-preenchidos com os valores salvos

---

## 6. Dashboard — Filtro por Obra e Indicador de Prazo

### 6.1 Descrição

O dashboard agora suporta filtragem por obra via URL query param `?projectId=xxx`. As métricas são calculadas server-side já filtradas. Um Select dropdown no topo permite a seleção. Obras ativas com `endDate < hoje` disparam um alerta visual âmbar.

**Rota:** `/{slug}` · `/{slug}?projectId={id}`

### 6.2 Cenários de Teste

#### CT-DASH-001: Filtro por obra — métricas se atualizam
- **Pré-condição:** 2 obras com inspeções distintas (Obra A: 10 inspeções, Obra B: 5 inspeções)
- **Ação:** Selecionar Obra A no dropdown
- **Resultado esperado:** Total de Inspeções = 10, URL atualiza para `?projectId={idA}`
- **Validação:** Selecionar "Todas as obras" volta a exibir o total combinado

#### CT-DASH-002: Filtro é preservado na URL
- **Pré-condição:** Dashboard com Obra A selecionada
- **Ação:** Copiar e colar URL em nova aba
- **Resultado esperado:** Dashboard carrega já filtrado pela Obra A

#### CT-DASH-003: Filtro "Todas as obras" limpa o parâmetro da URL
- **Ação:** Com `?projectId=xxx` na URL, selecionar "Todas as obras"
- **Resultado esperado:** URL volta para `/{slug}` sem query params

#### CT-DASH-004: Alerta de prazo vencido com múltiplas obras
- **Pré-condição:** 3 obras ativas, 2 com endDate < hoje
- **Resultado esperado:** Banner exibe "2 obras estão com prazo vencido."

#### CT-DASH-005: Sem obras cadastradas — dropdown não aparece
- **Pré-condição:** Tenant sem obras ativas
- **Resultado esperado:** O Select de filtro de obras não é renderizado

---

## 7. Pendências — Filtro por Status

### 7.1 Descrição

A página de pendências ganhou filtro de status via URL query param `?status=XXX`. Um Select dropdown no topo permite selecionar OPEN, IN_PROGRESS, RESOLVED ou CANCELLED. O filtro é processado server-side.

**Rota:** `/{slug}/issues` · `/{slug}/issues?status={STATUS}`

### 7.2 Cenários de Teste

#### CT-PEN-001: Filtrar por status OPEN
- **Pré-condição:** Pendências em diferentes status (OPEN, IN_PROGRESS, RESOLVED)
- **Ação:** Selecionar "Abertas" no dropdown de filtro
- **Resultado esperado:** Somente pendências com status=OPEN são exibidas, URL atualiza para `?status=OPEN`

#### CT-PEN-002: Filtrar por status RESOLVED
- **Ação:** Selecionar "Resolvidas"
- **Resultado esperado:** Somente pendências resolvidas aparecem, contagem bate com o banco

#### CT-PEN-003: Filtrar por status IN_PROGRESS
- **Ação:** Selecionar "Em andamento"
- **Resultado esperado:** Somente pendências em andamento aparecem

#### CT-PEN-004: Filtrar por status CANCELLED
- **Ação:** Selecionar "Canceladas"
- **Resultado esperado:** Somente pendências canceladas aparecem

#### CT-PEN-005: Filtro "Todos os status" limpa o parâmetro
- **Ação:** Com `?status=OPEN` na URL, selecionar "Todos os status"
- **Resultado esperado:** URL volta para `/{slug}/issues` sem query params, todas as pendências são exibidas

#### CT-PEN-006: Estado vazio com filtro ativo
- **Pré-condição:** Nenhuma pendência com status CANCELLED
- **Ação:** Filtrar por "Canceladas"
- **Resultado esperado:** EmptyState com mensagem "Nenhuma pendência encontrada para o filtro selecionado."

#### CT-PEN-007: Filtro combinado com ordenação
- **Ação:** Filtrar por status=OPEN e ordenar por data (sort=date&order=desc)
- **Resultado esperado:** Pendências abertas ordenadas da mais recente para a mais antiga

---

## 8. Busca no Catálogo de Serviços (Contratos e Diário)

### 8.1 Descrição

Nos formulários de Contrato e Diário de Obra, o usuário pode buscar serviços do catálogo via Command/Popover (ícone de livro). Ao selecionar, os campos `serviceName` / `description` e `unit` são preenchidos automaticamente.

### 8.2 Cenários de Teste — Contratos

#### CT-CTR-013: Busca de serviço no catálogo ao criar contrato
- **Pré-condição:** Catálogo com serviço "Alvenaria" (unit="M2")
- **Ação:** No formulário de contrato, clicar no ícone de livro no item, digitar "Alven" na busca
- **Resultado esperado:** "Alvenaria" aparece como sugestão, ao selecionar: `serviceName` = "Alvenaria" e `unit` mapeado para "M2"

#### CT-CTR-014: Catálogo sem resultados
- **Ação:** Digitar termo sem correspondência no catálogo ("xyz123")
- **Resultado esperado:** Exibe "Nenhum serviço encontrado"

#### CT-CTR-015: Preenchimento manual sobrescreve seleção do catálogo
- **Ação:** Selecionar do catálogo, depois editar o campo serviceName manualmente
- **Resultado esperado:** Campo aceita edição livre (seleção do catálogo não bloqueia edição)

### 8.3 Cenários de Teste — Diário de Obra

#### CT-DIO-019: Auto-preenchimento de engenheiro ao selecionar obra
- **Pré-condição:** Obra "Edifício Aurora" com engineerName="Dr. Carlos" cadastrado
- **Ação:** No formulário de novo diário, selecionar "Edifício Aurora" no dropdown de obra
- **Resultado esperado:** Campo "Engenheiro" preenche automaticamente com "Dr. Carlos"

#### CT-DIO-020: Auto-preenchimento não sobrescreve campo já preenchido
- **Pré-condição:** Formulário com engineerName já preenchido pelo usuário
- **Ação:** Selecionar obra com engineerName definido
- **Resultado esperado:** Campo engineerName NÃO é sobrescrito (mantém valor do usuário)

#### CT-DIO-021: Busca de serviço no catálogo no diário
- **Pré-condição:** Catálogo com serviço "Alvenaria" (unit="M2")
- **Ação:** Na seção "Serviços Executados", clicar no ícone de livro, buscar "Alvenaria"
- **Resultado esperado:** Ao selecionar: description="Alvenaria", serviceId vinculado, unit="M2" preenchido

#### CT-DIO-022: Quantidade e unidade nos serviços executados
- **Entrada:** Serviço executado com description="Piso", quantity=150, unit="M2"
- **Resultado esperado:** Campos quantity e unit salvos corretamente no banco
- **Validação:** Detalhe do diário exibe "150 M2" na linha do serviço

#### CT-DIO-023: Serviço executado sem quantidade (opcional)
- **Entrada:** Serviço executado sem preencher quantity e unit
- **Resultado esperado:** Diário salvo com success, campos quantity e unit ficam null

---

## 9. Dados de Teste Sugeridos (Fixtures Atualizados)

### Obras com novos campos
```
Obra 1: {
  name: "Edifício Aurora",
  address: "Rua A, 100",
  clientName: "Prefeitura de SP",
  contractNumber: "CT-2026-001",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  engineerName: "Dr. Carlos Silva",
  supervision: "Secretaria Municipal de Obras",
  characteristics: "Edificação residencial, 12 pavimentos",
  notes: "Obra prioritária — prazo firme"
}

Obra 2: {
  name: "Residencial Sol",
  address: "Av. B, 200",
  clientName: "Incorporadora Sol S.A.",
  startDate: "2026-02-01",
  endDate: "2026-06-30"
}

Obra 3 (ATRASADA): {
  name: "Viaduto Central",
  active: true,
  startDate: "2025-01-01",
  endDate: "2025-12-31"  // endDate < hoje → aparece no alerta do dashboard
}
```

---

*Documento de Cenários de Teste — Quallisy FVS v1.1 — Fevereiro 2026*
*Gerado a partir da análise do código-fonte dos módulos implementados.*
*Atualizado em 27/02/2026: novos cenários para Cadastro de Obra, Dashboard, Pendências, Catálogo de Serviços.*
