# Configuração de Webhooks Stripe

## 📋 Guide Completo de Setup

### 1. Obter URL da Edge Function
```
https://jljaxpbbufujpfmbhlli.functions.supabase.co/stripe-webhook
```

### 2. Configurar Webhook no Stripe Dashboard

1. **Acesse**: https://dashboard.stripe.com/webhooks
2. **Clique**: "Add endpoint"
3. **Cole a URL**: `https://jljaxpbbufujpfmbhlli.functions.supabase.co/stripe-webhook`
4. **Eventos a monitorar** (selecione):
   - `charge.succeeded`
   - `charge.failed`
   - `charge.refunded`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. **Clique**: "Add endpoint"

### 3. Obter e Configurar Secret Webhook

1. Após criar o endpoint, você verá o "Signing secret"
2. Copie o valor que começa com `whsec_...`
3. Configure no Supabase:
```bash
npx supabase@latest secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Deploy da Edge Function

```bash
npx supabase@latest functions deploy stripe-webhook
```

### 5. Testar Webhook

No Stripe Dashboard:
1. Vá até o endpoint criado
2. Clique em "Send test webhook" ou "Send a test submission"
3. Selecione um dos eventos monitorados
4. Verifique se o status retorna "200 OK"

### 📊 Fluxo de Processamento

```
Depósito Iniciado
  ↓
User clica "Confirmar Depósito"
  ↓
Edge Function `create-deposit` cria Payment Intent
  ↓
Stripe retorna checkout URL ou PIX code
  ↓
User completa pagamento (Card/PIX/Boleto)
  ↓
Stripe processa e envia webhook
  ↓
Edge Function `stripe-webhook` recebe evento
  ↓
Transaction status → "confirmed"
  ↓
Wallet balance += amount
  ↓
Sistema notifica user (toast)
```

### 🔐 Segurança

- ✅ Webhook signature validada (STRIPE_WEBHOOK_SECRET)
- ✅ Transações atômicas (update transaction → update wallet)
- ✅ RLS policies protegem dados do usuário
- ✅ Metadata contém user_id para controle de acesso

### 🐛 Troubleshooting

**Webhook não dispara:**
- Verifique se URL está acessível e retorna 200 OK
- Teste com `Stripe CLI: stripe listen --forward-to localhost:54321/stripe-webhook`

**Transações ficam "pending":**
- Webhook pode estar falhando - verifique logs no Stripe Dashboard
- Verifique se STRIPE_WEBHOOK_SECRET está correto

**Saldo não atualiza:**
- RLS policies podem estar bloqueando atualizações
- Verifique se user_id no metadata bate com user autenticado

### 📝 Verificar Status

No Supabase Dashboard:
```sql
SELECT * FROM transactions 
WHERE status = 'pending' AND type = 'deposit'
ORDER BY created_at DESC;
```

Se houver muitos "pending", webhooks não estão sendo processados.
