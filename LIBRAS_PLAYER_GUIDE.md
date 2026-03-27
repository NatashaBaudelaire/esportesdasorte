# Libras Video Player - Guia de Implementação

## 🎬 Status Atual

✅ **Player Funcional e Testável**
- Video player HTML5 real com todos os controles funcionando
- 12 slots de vídeo em 3 categorias
- URLs de teste usando BigBuckBunny (Google Commons)
- Todos os botões e controles são **clicáveis de verdade**

## 🎮 Como Testar Agora

1. **Abra a aplicação:**
   ```bash
   npm run dev
   ```

2. **Navegue para o recurso de Libras:**
   - Vá para Settings > Acessibilidade > Libras (ativar toggle)
   - Clique em "Ver Recursos em Libras"
   - OU acesse `/libras-resources` diretamente

3. **Teste o player:**
   - Clique em qual categoria: "Tutoriais do App", "Regras de Apostas" ou "Termos & Privacidade"
   - Clique em qual vídeo da categoria
   - **O vídeo vai reproduzir de verdade!**

## 🎯 Controles Funcionais que Pode Clicar

| Ação | Como |
|------|------|
| Play/Pause | Clique no botão ou no vídeo |
| Avanço/Retrocesso | Clique na barra de progresso (seek) |
| Volume | Use o slider de volume |
| Mute | Clique no botão de som |
| Fechar | ESC ou botão Fechar |
| Próximo vídeo | Feche e clique em outro |

## ⌨️ Atalhos de Teclado

```
Espaço  = Play/Pause
M       = Mute/Unmute
→       = Pular +5 segundos
←       = Voltar -5 segundos
ESC     = Fechar player
```

## 🎥 Como Integrar Vídeos Reais

### Opção 1: URLs HTTP (Recomendado)
```typescript
// Em src/pages/LibrasResourcesPage.tsx, estrutura de videos:

videos: [
  { 
    id: 1, 
    title: 'Como fazer uma aposta', 
    duration: '3:45',
    url: 'https://seu-servidor.com/videos/como-fazer-aposta.mp4'  // ← Trocar aqui
  },
  // ... mais vídeos
]
```

**Fontes recomendadas:**
- ✅ **Vimeo** - Melhor qualidade, suporta legítimas features só pro Vimeo
- ✅ **S3 AWS** - Escalável, streaming rápido
- ✅ **Bunny CDN** - Barato, rápido para vídeos
- ✅ **Google Drive** - Publicar vídeo e copiar ID para URL pública
- ✅ **YouTube** - Requer iframe (não é `<video>`)

### Opção 2: Arquivo Local
```typescript
// Colocar vídeo em public/videos/
url: '/videos/como-fazer-aposta.mp4'
```

### Opção 3: Vimeo
```typescript
// Para Vimeo, precisar integrar iframe customizado
// O player atual suporta arquivos MP4 diretos ou Vimeo URLs

url: 'https://vimeo.com/123456789'  // Funciona com algumas adaptações
```

## 🗒️ Legendas Sincronizadas (VTT)

### Adicionar legendas a um vídeo:

```typescript
// Em LibrasResourcesPage.tsx, adicionar subtitles:
videos: [
  { 
    id: 1, 
    title: 'Como fazer uma aposta', 
    duration: '3:45',
    url: 'https://seu-servidor.com/videos/aposta.mp4',
    subtitleUrl: 'https://seu-servidor.com/subtitles/aposta-pt.vtt'  // ← Novo
  },
]
```

### Formato VTT (Web Video Text Tracks):
```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
Bem-vindo ao tutorial de como fazer uma aposta

00:00:05.000 --> 00:00:10.000
Clique no botão "Novo Cupom" na tela inicial

00:00:10.000 --> 00:00:15.000
Selecione o evento que deseja apostar
```

## 📝 Estrutura de Dados Completa

```typescript
// Estrutura completa de um vídeo com todos os campos:

interface Video {
  id: number;
  title: string;         // Título do vídeo
  duration: string;      // Duração (ex: "3:45")
  url: string;           // URL do arquivo MP4
  subtitleUrl?: string;  // (Opcional) URL do arquivo VTT
}

// Exemplo prático:
{
  id: 1,
  title: 'Como fazer uma aposta',
  duration: '3:45',
  url: 'https://cdn.exemplo.com/videos/aposta.mp4',
  subtitleUrl: 'https://cdn.exemplo.com/subs/aposta.vtt'
}
```

## 🎬 Próximas Fases

### Fase 2: Adicionar avatar intérprete
```typescript
// Será adicionado à LibrasVideoPlayer:
interface LibrasVideoPlayerProps {
  videoUrl: string;
  interpreterAvatarUrl?: string;  // Avatar do intérprete
  // ... resto das props
}
```

### Fase 3: Chat com intérprete ao vivo
```typescript
// Novo componente: LiveInterpreterChat.tsx
- Integração com WebRTC
- Vídeo chamada com intérprete real
- Chat em tempo real
```

## ✅ Checklist - Colocar em Produção

- [ ] Todos os 12 vídeos têm URLs reais
- [ ] Vídeos testados no player (reproduzem sem erro)
- [ ] Legendas prontas em formato VTT
- [ ] Subtítulos sincronizados testados
- [ ] URLs testadas em diferentes navegadores
- [ ] CDN ou servidor de vídeos configurado
- [ ] Permissões CORS corretas (se cross-origin)
- [ ] SRT → VTT convertido (se tinha legendas em SRT)

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Vídeo não carrega" | Verificar URL e CORS headers |
| "Som não funciona" | Verificar permissões do navegador |
| "Legendas atrasadas" | Sincronizar arquivo VTT |
| "Player em branco" | Verificar suporte do navegador (MP4/WebM) |
| "Barra de progresso fixa" | Arquivo não tem duração (problema de codec) |

## 📱 Testes em Mobile

Os controles foram feitos para 44px+ (acessibilidade touchscreen):
```bash
npm run dev
# Abrir em telefone local: http://localhost:5173
# Todos os botões clicáveis com dedo
```

## 🔗 Referências

- **MDN HTML5 Video:** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
- **WebVTT Spec:** https://www.w3.org/TR/webvtt1/
- **Acessibilidade de Vídeo:** https://www.w3.org/WAI/media/av/

---

**Última atualização:** Março 27, 2026
**Status:** ✅ Player testável e funcional
**Próximo passo:** Trocar URLs de teste por vídeos reais
