# INSTRUÇÕES PARA CORRIGIR ERROS 400 - Pet Connect

## Problemas Identificados

1. **Políticas RLS desatualizadas** - Causando erros 400 ao carregar pets e serviços
2. **Erro de variável** na página `/services/new` - Corrigido ✅
3. **Coluna 'color' faltante** na tabela `services`
4. **Tabela 'service_photos' pode não existir**

## Soluções Implementadas

### ✅ Correções no Código (Já Aplicadas)
- Corrigido erro `user.company_id` → `company.id` em `/services/new`
- Corrigido importação do componente `Badge` no `pet-selector.tsx`

### 🔧 Correções no Banco de Dados (Aplicar no Supabase)

#### Passo 1: Corrigir Políticas RLS
1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o arquivo: `fix_rls_policies.sql`

#### Passo 2: Adicionar Colunas e Tabelas Faltantes
1. No **SQL Editor** do Supabase
2. Execute o arquivo: `add_missing_columns.sql`

## Scripts Criados

### 📄 `fix_rls_policies.sql`
- Remove políticas RLS antigas problemáticas
- Cria função `public.get_user_company_id()` segura
- Aplica políticas RLS corretas para todas as tabelas

### 📄 `add_missing_columns.sql`
- Adiciona coluna `color` na tabela `services`
- Cria tabela `service_photos` se não existir
- Configura políticas RLS para `service_photos`

## Ordem de Execução

1. **Primeiro**: Execute `fix_rls_policies.sql`
2. **Segundo**: Execute `add_missing_columns.sql`
3. **Terceiro**: Teste a aplicação

## Verificação dos Resultados

Após aplicar as correções, teste:

1. **Carregamento de Pets**: Selecione um cliente no formulário de agendamento
2. **Carregamento de Serviços**: Acesse a página de serviços
3. **Criação de Serviços**: Acesse `/services/new` e crie um novo serviço
4. **Console do Browser**: Não deve mais mostrar erros 400

## Erros Esperados Antes da Correção

```
Failed to load resource: the server responded with a status of 400 ()
Erro ao carregar serviços: Object
Erro ao carregar pets: Object
```

## Resultado Esperado Após Correção

- ✅ Pets aparecem ao selecionar cliente
- ✅ Serviços carregam corretamente
- ✅ Página `/services/new` funciona
- ✅ Console sem erros 400

## Suporte

Se ainda houver problemas após aplicar as correções:
1. Verifique se ambos os scripts foram executados
2. Confirme se não há erros no SQL Editor
3. Recarregue a página da aplicação
4. Verifique o console do browser para novos erros