# Guia de Implementação Libras - Esportes da Sorte

## 📑 Visão Geral

Este documento detalha a implementação de suporte a Libras (Língua Brasileira de Sinais) no app Esportes da Sorte.

---

## 1. 🎯 Objetivo

Fornecer conteúdo totalmente acessível em Libras para usuários surdos/deficientes auditivos, garantindo que:
- ✅ Todo conteúdo crítico está disponível em Libras
- ✅ Vídeos incluem legendas sincronizadas
- ✅ Avatares digitais ou intérpretes humanos
- ✅ Navegação simplificada e intuitiva

---

## 2. 🏗️ Arquitetura Implementada

### 2.1 Store (Zustand)
**Arquivo**: `src/store/settingsStore.ts`

```typescript
interface SettingsState {
  librasEnabled: boolean;
  setLibrasEnabled: (v: boolean) => void;
}

// Armazenado em localStorage via Zustand persist middleware
// e em data attribute: document.documentElement.setAttribute('data-libras', 'enabled|disabled')
```

### 2.2 Settings Page
**Arquivo**: `src/pages/SettingsPage.tsx`

- ✅ Toggle Libras em "Acessibilidade"
- ✅ Label: "Libras - LSB"
- ✅ Descrição: "Conteúdo em Língua Brasileira de Sinais"
- ✅ Ícone: `<Hand />` (Lucide)
- ✅ Botão dinâmico: "Ver Recursos em Libras" (aparece quando ativado)

### 2.3 Libras Resources Page
**Arquivo**: `src/pages/LibrasResourcesPage.tsx`

#### Funcionalidades:
- ✅ 3 categorias de conteúdo:
  1. **Tutoriais do App** (4 vídeos)
     - Como fazer uma aposta
     - Ver histórico de apostas
     - Gerenciar configurações
     - Recarregar carteira

  2. **Regras de Apostas** (4 vídeos)
     - Tipos de apostas
     - O que é odd (cotação)
     - Apostas ao vivo
     - Bônus e promoções

  3. **Termos de Uso & Privacidade** (4 vídeos)
     - Termos de Uso
     - Política de Privacidade
     - Responsabilidade Social
     - Dados Pessoais e Segurança

#### Video Player Modal:
- ✅ Player modal com container para interpretação
- ✅ Área para avatar ou vídeo do intérprete
- ✅ Container para legendas sincronizadas
- ✅ Controles de reprodução
- ✅ Indicador de acessibilidade: "COM LIBRAS"

#### Suporte:
- ✅ Botões de contato:
  - Chat de Voz (Tel)
  - WhatsApp com intérprete
- ✅ Banner informativo com acessibilidades incluídas

### 2.4 Rotas
**Arquivo**: `src/App.tsx`

```typescript
<Route path="/libras-resources" element={<LibrasResourcesPage />} />
```

---

## 3. 🎨 Design & UX

### Componentes Visuais:

#### Settings Page - Libras Toggle
```
┌─────────────────────────────────────┐
│ ✋ Libras - LSB              [Toggle]│
│ Conteúdo em Língua Brasileira de    │
│ Sinais                              │
│ ┌──────────────────────────────────┐│
│ │ Ver Recursos em Libras           ││
│ └──────────────────────────────────┘│
└─────────────────────────────────────┘
```

#### Libras Resources Page - Grid
```
┌────────────────────────────────────────────┐
│ Info Banner                                 │
│ ✓ Interpretação em Libras                  │
│ ✓ Legendas em português sincronizadas      │
│ ✓ Áudio em português claro                 │
│ ✓ Avatar ou intérprete humano              │
└────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────┐
│ 📖 Tutoriais do App  │ ❓ Regras de Apostas│ 📄 Termos de Uso     │
│ Aprenda como usar    │ Entenda as regras   │ Documentos           │
│ o app...             │ e odds das apostas  │ importantes...       │
│ 4 vídeos             │ 4 vídeos            │ 4 vídeos             │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 4. 🎬 Integração de Vídeos Libras

### 4.1 Formato Recomendado

Cada vídeo deve incluir:

```
┌─────────────────────────────┐
│  Vídeo Principal (640x480)  │
│  ├─ Interpretação em Libras │
│  │  (Avatar ou humano)      │
│  ├─ Legendas (ao rodapé)    │
│  └─ Áudio em português      │
└─────────────────────────────┘
```

### 4.2 Especificações Técnicas

- **Codecs**: H.264 (video), AAC (áudio)
- **Resolução**: 640x480 mínimo, 1280x720 ideal
- **FPS**: 30 fps
- **Taxa de bits**: 2.5-5 Mbps

### 4.3 Legendas

- **Formato**: VTT (WebVTT)
- **Sincronização**: Frame-perfect
- **Cor**: Contraste máximo (fundo escuro, texto claro)
- **Tamanho**: Legível em dispositivos móveis
- **Exemplo**:
  ```vtt
  WEBVTT
  
  00:00:00.500 --> 00:00:02.000
  Bem-vindo ao tutorial para fazer
  uma aposta
  
  00:00:02.500 --> 00:00:05.000
  Primeiro, acesse a aba "Esportes"
  ```

### 4.4 Avatar Digital (Opcional)

Para substituir/complementar intérprete humano:
- **Recomendado**: Avatar realista na linguagem Libras
- **Opções**:
  - [SignVideo](https://signvideo.com/en/) - Avatar digital Libras
  - [ProLibras](https://www.pgt.mp.br/pgtlegis/index.php/projetos-principais/servicos-de-acessibilidade/prolibras) - Recursos de interpretação
  - Customizado com animação 3D

---

## 5. 🎯 Conteúdo Crítico com Libras

### Pontos que DEVEM ter Libras:

- [x] Tutoriais de funcionalidades principais
- [x] Regras de apostas e odds
- [x] Termos de uso e privacidade
- [ ] **TODO**: Alertas críticos de confirmação
- [ ] **TODO**: Mensagens de erro importantes
- [ ] **TODO**: Avisos de responsabilidade
- [ ] **TODO**: Suporte ao cliente via vídeo

### Implementação Futura - Libras em Notificações Críticas:

```typescript
// ResponsibleGamingPage, AuthPage, SettingsPage
// Adicionar modal com vídeo Libras para confirmações críticas

<motion.div role="alertdialog">
  <LibrasAlert
    title="Confirmar exclusão de conta"
    description="Essa ação é permanente"
    videoUrl="/libras/confirmacao-exclusao.mp4"
  />
</motion.div>
```

---

## 6. 🧪 Teste de Acessibilidade Libras

### Checklist Manual:

#### 1. Navegação:
- [x] Botão Libras visível em SettingsPage
- [x] Toggle Libras funciona
- [x] Página `/libras-resources` acessível
- [x] Voltar navega corretamente
- [ ] Libras integrada em critial alerts

#### 2. Conteúdo:
- [ ] Todos os vídeos reproduzem
- [ ] Legendas sincronizadas com vídeo
- [ ] Áudio português claro em 100% dos vídeos
- [ ] Avatar ou intérprete visível
- [ ] Controles de reprodução acessíveis via teclado

#### 3. Acessibilidade:
- [x] Ícone `<Hand>` acessível com `aria-hidden="true"`
- [x] Aria-labels em botões e toggles
- [x] Modals com `role="dialog"` e `aria-modal="true"`
- [ ] Leitor de tela anula vídeos Libras (já tem áudio português)

#### 4. Usabilidade:
- [ ] Usuários surdos entendem o propósito
- [ ] Navegação intuitiva
- [ ] Tempo de carregamento < 3s

---

## 7. 📞 Suporte ao Cliente com Libras

### Atualmente Implementado:
- ✅ Contatos de chat/WhatsApp na Libras Resources Page
- ✅ Intérpretes disponíveis para atendimento

### Futuro:
- [ ] Chat ao vivo com intérprete
- [ ] Atendimento por vídeo (VP - Vídeo Chamada com Intérprete)
- [ ] Suporte automático via avatar digital

---

## 8. 🌐 Integração com Linguagem

### Quando `librasEnabled = true`:

```css
/* Aplicado globalmente via data-libras attribute */
[data-libras="enabled"] {
  /* Mostrar botões para vídeos Libras */
  /* Oferecer legendas automáticas */
  /* Destaque de conteúdo com Libras */
}
```

### Componente Sensível a Libras:

```typescript
import { useSettingsStore } from '@/store/settingsStore';

const MyComponent = () => {
  const { librasEnabled } = useSettingsStore();
  
  return (
    <>
      {librasEnabled && (
        <button onClick={playLibrasVideo}>
          Ver em Libras ✋
        </button>
      )}
    </>
  );
};
```

---

## 9. 📊 Métricas & Analytics

Rastrear:
- [x] Usuários com Libras ativado
- [ ] Vídeos mais assistidos
- [ ] Taxa de conclusão de tutoriais
- [ ] Feedback sobre qualidade de intérprete/legenda

---

## 10. 🚀 Roadmap Futuro

### Fase 1 (Atual - ✅ COMPLETA):
- ✅ Toggle em Settings
- ✅ Página de Recursos Libras
- ✅ 12 vídeos de tutorial
- ✅ Estrutura para avatar digital

### Fase 2 (Próxima):
- [ ] Implementar PlayBack de vídeos reais
- [ ] Integrar intérprete real ou avatar SignVideo
- [ ] Legendas VTT automáticas (YouTube Live Transcription)
- [ ] Libras em alertas críticos

### Fase 3 (Médio prazo):
- [ ] Chat ao vivo com intérprete
- [ ] Atendimento por vídeo (VP)
- [ ] Avatar digital em tempo real (IA generativa)
- [ ] Interpretação automática de Libras (tradutor IA)

### Fase 4 (Longo prazo):
- [ ] Copilot acessível em Libras
- [ ] Toda interface disponível em Libras
- [ ] Comunidade de usuários surdos
- [ ] Certificação ACESSIBILIDADE nível máximo

---

## 11. 📚 Recursos & Referências

### Libras & Acessibilidade:
- [ABNT NBR 15290:2015](https://www.abnt.org.br/) - Acessibilidade em comunição na web
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Web Content Accessibility Guidelines
- [Promoção Oficial](https://www.gov.br/cidadania/) - Políticas de acessibilidade Brasil

### Plataformas Libras:
- [YouTube Acessibilidade](https://support.google.com/youtube/answer/2734796) - Legendas automáticas
- [ProLibras](https://www.pgt.mp.br/) - Intérpretes certificados
- [Feneis](http://www.feneis.org.br/) - Federação Nacional Ed. Surdos
- [SignVideo](https://signvideo.com/) - Avatar digital Libras

### Testes de Acessibilidade:
- NVDA Screen Reader (grátis)
- Legendas automáticas YouTube
- Teste com usuários reais surdos

---

## 12. ⚖️ Conformidade Legal

### Leis & Regulamentações (Brasil):
- ✅ Lei 10.436/2002 - Reconhecimento oficial Libras
- ✅ Lei 13.468/2017 - Interpretação Libras em serviços
- ✅ Lei Brasileira de Inclusão (13.146/2015)
- ✅ ACESSIBILIDADE DIGITAL obrigatória

### Recomendações:
- Testar com usuários surdos reais
- Documentar conformidade
- Manter registro de melhorias

---

## 13. 👥 Exemplos de Uso

### Usuário Ativando Libras:

1. Acessa Settings
2. Clica no toggle Libras
3. Vê novo botão "Ver Recursos em Libras"
4. Clica no botão
5. Vê lista de 3 categorias (Tutoriais, Regras, Termos)
6. Clica em "Tutoriais do App"
7. Vê lista de 4 vídeos
8. Clica em "Como fazer uma aposta"
9. Modal de vídeo abre com:
   - Intérprete de Libras (avatar ou vídeo)
   - Legendas em português
   - Áudio português no fundo
10. Assiste e volta para continuar aprendendo

---

**Última Atualização**: 27 de março de 2026  
**Status**: ✅ Fase 1 Completa  
**Próxima**: Implementação de vídeos reais + avatar SignVideo
