# Trilha do vídeo feita na mão (sem música de terceiros, sem direito autoral):
# acordes quentes + batida leve, que abaixa quando a narração fala, e efeitos (whoosh, pop, baque, brilho, teclas).
# Lê os tempos de saida/deixas.json (montar.mjs escreve) e grava saida/projeto/assets/trilha.wav.
# Uso: python trilha.py
import json
import wave
from pathlib import Path

import numpy as np

SR = 44100
rng = np.random.default_rng(7)
deixas = json.loads(Path('saida/deixas.json').read_text(encoding='utf-8'))
TOTAL = deixas['total']
N = int(TOTAL * SR) + SR
esq = np.zeros(N)
dir_ = np.zeros(N)


def hz(nota):  # 0 = Lá 440
    return 440 * 2 ** (nota / 12)


def passa_baixa(x, corte):
    a = np.exp(-2 * np.pi * corte / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def envelope(n, ataque, solta):
    e = np.ones(n)
    a = min(n, int(ataque * SR))
    s = min(n, int(solta * SR))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if s:
        e[-s:] *= np.linspace(1, 0, s)
    return e


def por(som, t, ganho=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    som = som[: N - i]
    esq[i:i + len(som)] += som * ganho * (1 - max(0, pan))
    dir_[i:i + len(som)] += som * ganho * (1 + min(0, pan))


# ---------- Música: Ré maior quente, 100 bpm ----------
BPM = 100
batida = 60 / BPM
compasso = batida * 4
# Dmaj9, Bm7, Gmaj7, A6 (notas relativas ao Lá 440)
acordes = [[-19, -7, -3, 0, 4], [-22, -10, -3, 0, 2], [-26, -10, -5, -1, 2], [-24, -12, -5, -3, 4]]
inicio_musica = deixas['musica_de']
t = 0.0
k = 0
while t < TOTAL + 1:
    dur = compasso
    n = int(dur * SR) + int(0.8 * SR)
    tt = np.arange(n) / SR
    pad = np.zeros(n)
    for nota in acordes[k % 4]:
        f = hz(nota)
        for desafina in (-0.12, 0.0, 0.11):  # 3 vozes levemente desafinadas = coro
            ff = f * 2 ** (desafina / 12)
            pad += np.sin(2 * np.pi * ff * tt) + 0.35 * np.sin(4 * np.pi * ff * tt) + 0.12 * np.sin(6 * np.pi * ff * tt)
    pad *= envelope(n, 0.5, 0.9) * 0.018
    if t >= inicio_musica - 0.01:
        por(pad, t, 1.0, -0.15 if k % 2 else 0.15)
        # baixo
        f = hz(acordes[k % 4][0] - 12)
        nb = int(compasso * SR)
        tb = np.arange(nb) / SR
        por(np.sin(2 * np.pi * f * tb) * envelope(nb, 0.02, 0.3) * 0.09, t)
    else:
        # antes do celular: só um zumbido grave de tensão
        por(pad * 0.5, t)
    t += compasso
    k += 1

# Bateria leve depois que o celular entra: bumbo nos tempos 1 e 3, chimbal nos contratempos
bumbo_n = int(0.35 * SR)
tb = np.arange(bumbo_n) / SR
bumbo = np.sin(2 * np.pi * (45 + 75 * np.exp(-tb * 30)) * tb) * np.exp(-tb * 9) * 0.32
chimbal = passa_baixa(rng.standard_normal(int(0.05 * SR)), 9000)
chimbal = (rng.standard_normal(len(chimbal)) - chimbal) * np.exp(-np.arange(len(chimbal)) / SR * 70) * 0.03
t = inicio_musica
i = 0
fim_bateria = deixas['bateria_ate']
while t < fim_bateria:
    if i % 4 in (0, 2):
        por(bumbo, t)
    por(chimbal, t + batida / 2, 1.0, 0.3 if i % 2 else -0.3)
    t += batida
    i += 1

# Abaixa a música quando a narração fala (ducking suave)
ganho = np.ones(N)
for f in deixas['falas']:
    a, b = int(f['inicio'] * SR), int((f['inicio'] + f['dur']) * SR)
    ganho[a:b] = 0.45
ganho = passa_baixa(ganho, 3.0)
esq *= ganho
dir_ *= ganho

# Fade de entrada e de saída
fade = envelope(int(TOTAL * SR), 0.3, 1.6)
esq[: len(fade)] *= fade
dir_[: len(fade)] *= fade
esq[len(fade):] = 0
dir_[len(fade):] = 0


# ---------- Efeitos ----------
def whoosh(dur=0.55):
    n = int(dur * SR)
    ruido = rng.standard_normal(n)
    x = np.linspace(0, 1, n)
    corte = 600 + 5200 * np.sin(np.pi * x) ** 2
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        a = np.exp(-2 * np.pi * corte[i] / SR)
        acc = (1 - a) * ruido[i] + a * acc
        y[i] = acc
    return y * np.sin(np.pi * x) ** 1.5 * 0.5


def pop(altura=0):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    f = hz(12 + altura) * (1 + 0.6 * np.exp(-tt * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38) * 0.22


def baque():
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    grave = np.sin(2 * np.pi * (38 + 90 * np.exp(-tt * 25)) * tt) * np.exp(-tt * 7) * 0.7
    estalo = passa_baixa(rng.standard_normal(n), 2500) * np.exp(-tt * 30) * 0.5
    return grave + estalo


def brilho():
    som = np.zeros(int(1.2 * SR))
    for j, nota in enumerate([17, 21, 24, 29, 33]):
        n = int(0.9 * SR)
        tt = np.arange(n) / SR
        s = np.sin(2 * np.pi * hz(nota) * tt) * np.exp(-tt * 5) * 0.08
        i = int(j * 0.06 * SR)
        som[i:i + n] += s[: len(som) - i]
    return som


def tecla():
    n = int(0.03 * SR)
    return passa_baixa(rng.standard_normal(n), 4000) * np.exp(-np.arange(n) / SR * 200) * 0.25


def subida(dur):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    ruido = passa_baixa(rng.standard_normal(n), 3000)
    tom = np.sin(2 * np.pi * np.cumsum(200 + 900 * x ** 2) / SR)
    return (ruido * 0.35 + tom * 0.06) * x ** 2.2


for d in deixas['efeitos']:
    tipo, t = d['tipo'], d['t']
    if tipo == 'whoosh':
        por(whoosh(d.get('dur', 0.55)), t - 0.25, 0.9, d.get('pan', 0))
    elif tipo == 'pop':
        por(pop(d.get('altura', 0)), t, 1.0, d.get('pan', 0))
    elif tipo == 'baque':
        por(baque(), t)
    elif tipo == 'brilho':
        por(brilho(), t)
    elif tipo == 'tecla':
        por(tecla(), t, 1.0, 0.2)
    elif tipo == 'subida':
        por(subida(d['dur']), t - d['dur'])

# ---------- Grava ----------
estereo = np.stack([esq, dir_], axis=1)[: int(TOTAL * SR)]
pico = np.max(np.abs(estereo))
estereo = estereo / pico * 0.32  # pico em -10 dB: a narração fica por cima
saida = Path('saida/projeto/assets/trilha.wav')
saida.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(saida), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((estereo * 32767).astype('<i2').tobytes())
print('trilha', saida, f'{TOTAL:.2f}s')
