# PROMPT PARA CLAUDE CODE — Vídeo Remotion Vortex Primus

Cole este prompt inteiro no Claude Code.

---

## TAREFA

Criar um projeto Remotion completo para renderizar um vídeo promocional de 30 segundos (9:16, Instagram Reels) do aplicativo **Vortex Primus**.

---

## 1. SETUP DO PROJETO

```bash
cd ~
mkdir vortex-video && cd vortex-video
npx create-video@latest . --template blank
npm install
```

Após o setup, substituir o conteúdo dos arquivos conforme as instruções abaixo.

---

## 2. ESTRUTURA DE PASTAS

```
vortex-video/
├── src/
│   ├── Root.tsx
│   ├── Composition.tsx
│   ├── scenes/
│   │   ├── Gancho.tsx
│   │   ├── Resposta.tsx
│   │   ├── Flash.tsx
│   │   └── CTA.tsx
│   └── components/
│       └── PhoneFrame.tsx
├── public/
│   └── screenshots/
│       ├── s1_avaliacao_form.jpg
│       ├── s2_detalhes_resultado.jpg
│       ├── s3_plano_herbalife.jpg
│       ├── s4_suplementos.jpg
│       ├── s5_fotos_antes_depois.jpg
│       ├── s6_lista_alunos.jpg
│       ├── s7_agenda_whatsapp.jpg
│       ├── s8_dashboard.jpg
│       └── s9_metas_negocio.jpg
└── remotion.config.ts
```

**IMPORTANTE:** Criar a pasta `public/screenshots/` e avisar ao usuário para copiar as imagens do celular para lá com exatamente esses nomes de arquivo.

---

## 3. ESPECIFICAÇÕES DO VÍDEO

- **Resolução:** 1080 × 1920 (9:16 vertical)
- **FPS:** 30
- **Duração total:** 30 segundos = 900 frames
- **Formato de saída:** MP4 H.264

---

## 4. DISTRIBUIÇÃO DE CENAS

| Cena | Início (s) | Fim (s) | Frames |
|---|---|---|---|
| GANCHO (tela preta + texto) | 0 | 3 | 0–90 |
| RESPOSTA (frase de impacto) | 3 | 5 | 90–150 |
| FLASH 1 — Avaliação Bioimpedância | 5 | 6.5 | 150–195 |
| FLASH 2 — Resultado Visual | 6.5 | 8 | 195–240 |
| FLASH 3 — Plano Herbalife | 8 | 9.5 | 240–285 |
| FLASH 4 — Suplementos 71 produtos | 9.5 | 11 | 285–330 |
| FLASH 5 — Fotos Antes/Depois | 11 | 12.5 | 330–375 |
| FLASH 6 — Lista de Alunos | 12.5 | 14 | 375–420 |
| FLASH 7 — Agenda + WhatsApp | 14 | 15.5 | 420–465 |
| FLASH 8 — Dashboard Completo | 15.5 | 17 | 465–510 |
| FLASH 9 — Metas / Evolução | 17 | 18.5 | 510–555 |
| FLASH 10 — Aniversariantes | 18.5 | 20 | 555–600 |
| FLASH 11 — Reavaliações Pendentes | 20 | 21.5 | 600–645 |
| FLASH 12 — Lista Alunos zoom | 21.5 | 23 | 645–690 |
| CTA FINAL | 23 | 30 | 690–900 |

---

## 5. CÓDIGO COMPLETO

### `src/Root.tsx`

```tsx
import {Composition} from 'remotion';
import {VortexVideo} from './Composition';

export const RemotionRoot = () => {
  return (
    <Composition
      id="VortexPromo"
      component={VortexVideo}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
```

---

### `src/Composition.tsx`

```tsx
import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {Gancho} from './scenes/Gancho';
import {Resposta} from './scenes/Resposta';
import {Flash} from './scenes/Flash';
import {CTA} from './scenes/CTA';

const screenshots = [
  {file: 'screenshots/s1_avaliacao_form.jpg',     label: 'Avaliação completa na hora'},
  {file: 'screenshots/s2_detalhes_resultado.jpg', label: 'Resultado que o cliente ENTENDE'},
  {file: 'screenshots/s3_plano_herbalife.jpg',    label: 'Dieta com Herbalife em segundos'},
  {file: 'screenshots/s4_suplementos.jpg',        label: '71 produtos Herbalife integrados'},
  {file: 'screenshots/s5_fotos_antes_depois.jpg', label: 'Transformação que ele não esquece'},
  {file: 'screenshots/s6_lista_alunos.jpg',       label: 'Todos os clientes. Um lugar só.'},
  {file: 'screenshots/s7_agenda_whatsapp.jpg',    label: 'Confirmação direto no WhatsApp'},
  {file: 'screenshots/s8_dashboard.jpg',          label: 'Nunca perca um cliente'},
  {file: 'screenshots/s9_metas_negocio.jpg',      label: 'Suas metas. Seu negócio. No controle.'},
  {file: 'screenshots/s8_dashboard.jpg',          label: 'Alertas de Reavaliação automáticos'},
  {file: 'screenshots/s9_metas_negocio.jpg',      label: '🎂 Aniversariantes do mês'},
  {file: 'screenshots/s6_lista_alunos.jpg',       label: 'Seu consultório no bolso'},
];

export const VortexVideo = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#080C14'}}>
      <Series>
        {/* GANCHO: 0–3s = 90 frames */}
        <Series.Sequence durationInFrames={90}>
          <Gancho />
        </Series.Sequence>

        {/* RESPOSTA: 3–5s = 60 frames */}
        <Series.Sequence durationInFrames={60}>
          <Resposta />
        </Series.Sequence>

        {/* 12 FLASHES: 1.5s cada = 45 frames cada */}
        {screenshots.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={45}>
            <Flash
              imageSrc={s.file}
              label={s.label}
              index={i}
            />
          </Series.Sequence>
        ))}

        {/* CTA FINAL: 7s = 210 frames */}
        <Series.Sequence durationInFrames={210}>
          <CTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
```

---

### `src/scenes/Gancho.tsx`

```tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

const lines = [
  'As pessoas sobem',
  'na sua balança...',
  '...e vão embora',
  'sem virar clientes.',
  '',
  'Sabe por quê?',
];

export const Gancho = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Cada linha aparece em intervalos de 13 frames (~0.43s)
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#080C14',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <div style={{textAlign: 'center'}}>
        {lines.map((line, i) => {
          if (!line) return <div key={i} style={{height: 32}} />;
          const delay = i * 13;
          const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const translateY = interpolate(frame, [delay, delay + 10], [20, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          // "Sabe por quê?" aparece em vermelho pulsante
          const isHook = line === 'Sabe por quê?';
          const pulse = isHook
            ? interpolate(
                Math.sin((frame - delay) * 0.15),
                [-1, 1],
                [0.85, 1.05]
              )
            : 1;

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${translateY}px) scale(${pulse})`,
                fontSize: isHook ? 72 : 58,
                fontWeight: 900,
                color: isHook ? '#FF4444' : '#FFFFFF',
                lineHeight: 1.2,
                marginBottom: 8,
                fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
                letterSpacing: isHook ? 4 : 1,
                textTransform: 'uppercase',
              }}
            >
              {line}
            </div>
          );
        })}
      </div>

      {/* Linha decorativa pulsante no rodapé */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          width: interpolate(frame, [0, 90], [0, 400], {
            extrapolateRight: 'clamp',
          }),
          height: 3,
          backgroundColor: '#7C3AED',
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};
```

---

### `src/scenes/Resposta.tsx`

```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';

export const Resposta = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({frame, fps, config: {damping: 12, stiffness: 200}});
  const opacity = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});

  // Flash de luz no início
  const flashOpacity = interpolate(frame, [0, 4, 12], [1, 0.3, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#080C14',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      {/* Flash branco de entrada */}
      <AbsoluteFill
        style={{
          backgroundColor: 'white',
          opacity: flashOpacity,
        }}
      />

      {/* Linha vermelha acima */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          width: interpolate(frame, [5, 25], [0, 860], {extrapolateRight: 'clamp'}),
          height: 4,
          backgroundColor: '#FF4444',
        }}
      />

      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.3,
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          Elas não entenderam
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: '#FF4444',
            lineHeight: 1.3,
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          o que os números
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.3,
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          significam.
        </div>
      </div>

      {/* Linha roxa abaixo */}
      <div
        style={{
          position: 'absolute',
          bottom: '38%',
          width: interpolate(frame, [5, 25], [0, 860], {extrapolateRight: 'clamp'}),
          height: 4,
          backgroundColor: '#7C3AED',
        }}
      />
    </AbsoluteFill>
  );
};
```

---

### `src/scenes/Flash.tsx`

```tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

interface FlashProps {
  imageSrc: string;
  label: string;
  index: number;
}

export const Flash: React.FC<FlashProps> = ({imageSrc, label, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrada: scale + fade rápido
  const scale = spring({
    frame,
    fps,
    config: {damping: 15, stiffness: 300},
    from: 1.06,
    to: 1,
  });

  const opacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Saída: fade nos últimos 6 frames
  const exitOpacity = interpolate(frame, [39, 45], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Label slide-in
  const labelX = interpolate(frame, [4, 18], [-300, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [4, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Cor do acento alterna entre roxo e laranja
  const accentColor = index % 2 === 0 ? '#7C3AED' : '#F97316';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#080C14',
        opacity: opacity * exitOpacity,
      }}
    >
      {/* Screenshot do app */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 200,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          overflow: 'hidden',
        }}
      >
        <Img
          src={staticFile(imageSrc)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />

        {/* Overlay gradiente na parte inferior da imagem */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 280,
            background: 'linear-gradient(to bottom, transparent, #080C14)',
          }}
        />
      </div>

      {/* Label de destaque */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          paddingHorizontal: 60,
          transform: `translateX(${labelX}px)`,
          opacity: labelOpacity,
        }}
      >
        {/* Barra colorida */}
        <div
          style={{
            width: 60,
            height: 6,
            backgroundColor: accentColor,
            marginBottom: 16,
            borderRadius: 3,
          }}
        />
        <div
          style={{
            fontSize: 54,
            fontWeight: 900,
            color: '#FFFFFF',
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
            lineHeight: 1.1,
            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
          }}
        >
          {label}
        </div>
      </div>

      {/* Número do flash (canto superior direito) — sutil */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          right: 60,
          fontSize: 28,
          color: accentColor,
          fontWeight: 900,
          fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
          opacity: 0.7,
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>
    </AbsoluteFill>
  );
};
```

---

### `src/scenes/CTA.tsx`

```tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

export const CTA = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Logo aparece com spring
  const logoScale = spring({
    frame,
    fps,
    config: {damping: 10, stiffness: 120},
    from: 0,
    to: 1,
  });

  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const taglineY = interpolate(frame, [30, 50], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const linkOpacity = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulso do botão CTA
  const pulse = 1 + 0.03 * Math.sin(frame * 0.12);

  // Partículas decorativas
  const particles = Array.from({length: 8}, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const radius = interpolate(frame, [20, 80], [0, 320], {
      extrapolateRight: 'clamp',
    });
    const particleOpacity = interpolate(frame, [20, 60, 140], [0, 0.6, 0], {
      extrapolateRight: 'clamp',
    });
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: particleOpacity,
    };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#080C14',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Gradiente radial de fundo */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
        }}
      />

      {/* Partículas */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: i % 2 === 0 ? '#7C3AED' : '#F97316',
            opacity: p.opacity,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* LOGO — Duplo V estilizado */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 48,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #7C3AED, #A855F7, #F97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            letterSpacing: -4,
            lineHeight: 0.9,
          }}
        >
          VV
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: '#FFFFFF',
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            letterSpacing: 16,
            marginTop: 8,
          }}
        >
          VORTEX PRIMUS
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: 'center',
          marginBottom: 64,
          paddingHorizontal: 80,
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 3,
            lineHeight: 1.2,
          }}
        >
          Transforme cada pesagem
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: '#F97316',
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          em um cliente.
        </div>
      </div>

      {/* Botão CTA pulsante */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${pulse})`,
          backgroundColor: '#7C3AED',
          paddingTop: 28,
          paddingBottom: 28,
          paddingLeft: 72,
          paddingRight: 72,
          borderRadius: 60,
          marginBottom: 36,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: 900,
            color: '#FFFFFF',
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            letterSpacing: 4,
          }}
        >
          COMECE GRÁTIS
        </div>
      </div>

      {/* Link na bio */}
      <div
        style={{
          opacity: linkOpacity,
          fontSize: 32,
          color: '#9CA3AF',
          fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
          letterSpacing: 3,
        }}
      >
        🔗 LINK NA BIO
      </div>
    </AbsoluteFill>
  );
};
```

---

## 6. CONFIGURAÇÃO REMOTION

### `remotion.config.ts`

```ts
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
```

---

## 7. FONT BEBAS NEUE

Adicionar no `src/Root.tsx` antes do export:

```tsx
import {loadFont} from '@remotion/google-fonts/BebasNeue';
loadFont();
```

Instalar o pacote:

```bash
npm install @remotion/google-fonts
```

---

## 8. PREVIEW E RENDER

### Preview no browser:
```bash
npx remotion studio
```

### Render final MP4:
```bash
npx remotion render VortexPromo output/vortex-primus-reels.mp4 \
  --codec=h264 \
  --crf=18 \
  --scale=1
```

O arquivo final estará em `~/vortex-video/output/vortex-primus-reels.mp4`.

---

## 9. CHECKLIST ANTES DO RENDER

- [ ] Copiar os 9 screenshots para `public/screenshots/` com os nomes exatos
- [ ] Executar `npm install` na raiz do projeto
- [ ] Executar `npx remotion studio` para visualizar antes de renderizar
- [ ] Confirmar que todas as imagens aparecem corretamente no preview
- [ ] Executar o render final

---

## 10. NOMES DOS ARQUIVOS DE SCREENSHOT

| Nome do arquivo | Imagem correspondente |
|---|---|
| s1_avaliacao_form.jpg | Nova Avaliação — formulário bioimpedância + medidas |
| s2_detalhes_resultado.jpg | Detalhes da Avaliação — escalas coloridas gordura/músculo |
| s3_plano_herbalife.jpg | Plano alimentar com produtos Herbalife |
| s4_suplementos.jpg | Catálogo de Suplementos (71 produtos) |
| s5_fotos_antes_depois.jpg | Fotos da Avaliação — Antes e Depois |
| s6_lista_alunos.jpg | Lista de Alunos com ações rápidas |
| s7_agenda_whatsapp.jpg | Minha Agenda com botão WhatsApp |
| s8_dashboard.jpg | Dashboard com Reavaliações + Aniversariantes |
| s9_metas_negocio.jpg | Evolução de Negócio — Metas + 100% execução |
