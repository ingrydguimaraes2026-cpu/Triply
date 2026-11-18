# Trilha do vídeo do passeio, feita na mão (sem música de terceiros, sem direito autoral).
# Pop leve de viagem em Ré maior (Ré, Lá, Si menor, Sol): pad, arpejo dedilhado, baixo, bateria
# e um tema de marimba que entra quando o vídeo chega nas 5 partes da viagem.
# Cada instrumento entra numa parte do vídeo (lê passeio/gravacao/marcas.json), e o andamento (~112 bpm)
# é ajustado pra que o acorde final caia exatamente quando o cartão da Norti aparece.
# Efeitos leves por cima: toque na tela, teclas, um "plim" a cada fala do tour e um sopro na troca de parte.
# Uso: python passeio/trilha.py <saida.wav> <duração total em s>   (o montar.mjs chama sozinho)
import json
import sys
import wave
from pathlib import Path

import numpy as np

AQUI = Path(__file__).parent
SR = 44100
rng = np.random.default_rng(11)
dados = json.loads((AQUI / 'gravacao/marcas.json').read_text(encoding='utf-8'))
M = dados['marcas']
FIM_APP = dados['duracao']
SAIDA = Path(sys.argv[1])
TOTAL = float(sys.argv[2])
N = int((TOTAL + 3) * SR)

# Andamento: ~112 bpm, ajustado pro acorde final cair no começo de um compasso, quando o cartão da Norti aparece
FINAL = FIM_APP + 0.1
COMPASSO = FINAL / round(FINAL / (4 * 60 / 112))
BATIDA = COMPASSO / 4
COLCHEIA = BATIDA / 2
N_COMPASSOS = round(FINAL / COMPASSO)


def compasso_de(nome):  # compasso mais perto de uma marca do vídeo
    return int(round(M[nome] / COMPASSO)) if nome in M else N_COMPASSOS


def hz(nota):  # 0 = Lá 440
    return 440 * 2 ** (nota / 12)


class Pista:
    def __init__(self):
        self.esq = np.zeros(N)
        self.dir = np.zeros(N)

    def por(self, som, t, ganho=1.0, pan=0.0):  # pan: -1 esquerda, +1 direita
        i = int(round(t * SR))
        if i < 0:
            som, i = som[-i:], 0
        if i >= N:
            return
        som = som[: N - i] * ganho
        self.esq[i:i + len(som)] += som * (1 - max(0.0, pan))
        self.dir[i:i + len(som)] += som * (1 + min(0.0, pan))


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
    a, s = min(n, int(ataque * SR)), min(n, int(solta * SR))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if s:
        e[-s:] *= np.linspace(1, 0, s)
    return e


# ---------- Instrumentos ----------
def pad(notas, dur):
    n = int((dur + 0.9) * SR)
    tt = np.arange(n) / SR
    som = np.zeros(n)
    for nota in notas:
        for desafina in (-0.1, 0.0, 0.09):
            f = hz(nota) * 2 ** (desafina / 12)
            for k in range(1, 6):
                som += np.sin(2 * np.pi * f * k * tt + k) / k ** 1.6
    return som * envelope(n, 0.45, 0.9) * 0.006


def dedilhado(nota, dur=0.55):  # corda dedilhada: harmônicos agudos somem antes
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = hz(nota)
    som = sum(np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (5 + 4 * k)) / k for k in range(1, 8))
    return som * envelope(n, 0.003, 0.08) * 0.07


def marimba(nota):
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    f = hz(nota)
    som = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 5.5)
    som += 0.3 * np.sin(2 * np.pi * f * 3.93 * tt) * np.exp(-tt * 22)
    som += 0.12 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt * 60)
    return som * envelope(n, 0.002, 0.05) * 0.13


def baixo(nota, dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = hz(nota)
    som = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.1 * np.sin(6 * np.pi * f * tt)
    return np.tanh(som * 1.4) * np.exp(-tt * 2.2) * envelope(n, 0.004, 0.05) * 0.16


_tb = np.arange(int(0.4 * SR)) / SR
BUMBO = np.sin(2 * np.pi * (48 + 110 * np.exp(-_tb * 32)) * _tb) * np.exp(-_tb * 8) * 0.5
_ruido = rng.standard_normal(int(0.25 * SR))
_tr = np.arange(len(_ruido)) / SR
_corpo = np.sin(2 * np.pi * 185 * _tr) * np.exp(-_tr * 30) * 0.25
_banda = passa_baixa(_ruido, 5000) - passa_baixa(_ruido, 900)
PALMA = (_banda * (np.exp(-_tr * 22) + 0.6 * np.exp(-np.abs(_tr - 0.012) * 400) + 0.5 * np.exp(-np.abs(_tr - 0.024) * 400)) * 0.32 + _corpo)
_rc = rng.standard_normal(int(0.06 * SR))
CHIMBAL = (_rc - passa_baixa(_rc, 7000)) * np.exp(-np.arange(len(_rc)) / SR * 60) * 0.09
_rs = rng.standard_normal(int(0.09 * SR))
_ts = np.arange(len(_rs)) / SR
CHOCALHO = (_rs - passa_baixa(_rs, 5500)) * (_ts / 0.02).clip(0, 1) * np.exp(-_ts * 40) * 0.05


def subida(dur):  # ruído que sobe antes de uma parte nova
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    r = rng.standard_normal(n)
    return (r - passa_baixa(r, 400 + 6000 * 0.5)) * x ** 3 * 0.07


def sopro(dur=0.6):  # whoosh da troca de parte
    n = int(dur * SR)
    r = rng.standard_normal(n)
    x = np.linspace(0, 1, n)
    corte = 500 + 4500 * np.sin(np.pi * x) ** 2
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        a = np.exp(-2 * np.pi * corte[i] / SR)
        acc = (1 - a) * r[i] + a * acc
        y[i] = acc
    return y * np.sin(np.pi * x) ** 1.6 * 0.3


def toque():  # "tique" do dedo na tela
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1750 * tt) * np.exp(-tt * 110) * 0.08
            + passa_baixa(rng.standard_normal(n), 6000) * np.exp(-tt * 300) * 0.06)


def tecla():
    n = int(0.03 * SR)
    return passa_baixa(rng.standard_normal(n), 4500) * np.exp(-np.arange(n) / SR * 220) * 0.09


def baque():
    n = int(0.7 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (40 + 90 * np.exp(-tt * 25)) * tt) * np.exp(-tt * 6) * 0.45


def brilho():
    som = np.zeros(int(1.6 * SR))
    for j, nota in enumerate([17, 21, 24, 29, 33]):
        n = int(1.2 * SR)
        tt = np.arange(n) / SR
        i = int(j * 0.055 * SR)
        som[i:i + n] += (np.sin(2 * np.pi * hz(nota) * tt) * np.exp(-tt * 4) * 0.05)[: len(som) - i]
    return som


# ---------- Arranjo ----------
# Ré, Lá, Si menor, Sol: baixo + vozes do pad
ACORDES = [
    (-31, [-19, -12, -7, -3, 0]),   # Ré
    (-24, [-17, -12, -8, -5, 0]),   # Lá
    (-22, [-15, -10, -7, -3, 2]),   # Si menor
    (-26, [-14, -10, -7, -2, 2]),   # Sol
]
ARPEJO = [0, 2, 1, 3, 2, 1, 3, 2]
# Tema da marimba: (colcheia do compasso, nota), um compasso por acorde, 8 compassos
TEMA = [
    [(0, 9), (2, 12), (3, 9), (4, 7), (6, 5)],
    [(0, 4), (2, 7), (4, 12), (6, 9)],
    [(0, 9), (2, 14), (3, 12), (4, 9), (6, 5)],
    [(0, 2), (2, 5), (4, 7), (5, 5), (6, 2)],
    [(0, 9), (2, 12), (3, 14), (4, 12), (6, 9)],
    [(0, 7), (2, 4), (4, 7), (6, 12)],
    [(0, 14), (2, 12), (3, 9), (4, 12), (6, 14)],
    [(0, 10), (2, 9), (4, 7), (6, 5)],
]

melodia, harmonia, graves, bateria, efeitos = Pista(), Pista(), Pista(), Pista(), Pista()
c_login = compasso_de('login')
c_inicio = compasso_de('inicio-app')
c_tour = compasso_de('tour')
c_partes = compasso_de('viagem')
c_quebra = N_COMPASSOS - 1  # último compasso antes do fim: a bateria para e sobe pro acorde final
batidas_bumbo = []

for c in range(N_COMPASSOS):
    t = c * COMPASSO
    graves_, notas = ACORDES[c % 4]
    intro = c < c_login
    harmonia.por(pad(notas, COMPASSO), t, 0.55 if intro else 1.0, -0.2 if c % 2 else 0.2)
    if c >= c_login:  # arpejo dedilhado
        arp = sorted(notas[1:])
        for i, p in enumerate(ARPEJO):
            harmonia.por(dedilhado(arp[p] + 12), t + i * COLCHEIA, 0.7 if c < c_inicio else 1.0, 0.35 if i % 2 else -0.35)
    if c_inicio <= c < c_quebra:  # baixo em colcheias, mais forte no tempo
        for i in range(8):
            if i in (1, 5) and c < c_tour:
                continue
            graves.por(baixo(graves_ + (12 if i == 7 else 0), COLCHEIA * 0.95), t + i * COLCHEIA, 1.0 if i % 2 == 0 else 0.7)
        for i in range(4):  # chimbal nos contratempos
            bateria.por(CHIMBAL, t + i * BATIDA + COLCHEIA, 1.0, 0.3)
    if c_tour <= c < c_quebra:
        quatro = c >= c_partes  # nas partes da viagem: bumbo nos 4 tempos
        for i in range(4):
            if quatro or i in (0, 2):
                bateria.por(BUMBO, t + i * BATIDA)
                batidas_bumbo.append(t + i * BATIDA)
            if i in (1, 3):
                bateria.por(PALMA, t + i * BATIDA, 0.9, -0.1)
        if quatro:
            for i in range(16):
                bateria.por(CHOCALHO, t + i * BATIDA / 4, 0.6 + 0.4 * (i % 2 == 0), -0.4)
    if c_partes <= c < c_quebra and (c - c_partes) % 12 < 8:  # tema da marimba (8 compassos, 4 de folga)
        for passo, nota in TEMA[(c - c_partes) % 8]:
            melodia.por(marimba(nota), t + passo * COLCHEIA, 1.0, 0.15)
    if c == c_partes - 1:
        efeitos.por(subida(COMPASSO), t, 1.0)
    if c == c_quebra:
        efeitos.por(subida(COMPASSO), t, 1.3)

# Acorde final quando o cartão da Norti aparece, soando até o fim
graves_, notas = ACORDES[0]
harmonia.por(pad(notas, TOTAL - FINAL + 0.5) * 1.6, FINAL)
graves.por(baixo(graves_, 2.5) * 1.2, FINAL)
melodia.por(marimba(17), FINAL, 1.2)
efeitos.por(baque(), FINAL)
efeitos.por(brilho(), FINAL + 0.05, 1.4)

# "Bombeia" pad e baixo junto com o bumbo (dá o balanço do pop)
bombeia = np.ones(N)
dur_b = int(0.22 * SR)
curva = 1 - 0.4 * np.exp(-np.arange(dur_b) / SR / 0.07)
for tb in batidas_bumbo:
    i = int(tb * SR)
    bombeia[i:i + dur_b] = np.minimum(bombeia[i:i + dur_b], curva[: max(0, min(dur_b, N - i))])
for p in (harmonia, graves):
    p.esq *= bombeia
    p.dir *= bombeia

# ---------- Efeitos do vídeo ----------
for t in dados.get('toques', []):
    efeitos.por(toque(), t, 1.0, 0.1)
for t in dados.get('teclas', []):
    efeitos.por(tecla(), t, 1.0, 0.15)
ESCALA = [5, 7, 9, 10, 12, 14, 16, 17, 19, 21, 22, 24]
for i in range(20):  # "plim" a cada fala do tour, subindo a escala
    if f'tour-{i}' in M:
        efeitos.por(marimba(ESCALA[i % len(ESCALA)]) * 0.6, M[f'tour-{i}'] + 0.05, 1.0, 0.2)
for nome in ('inicio-app', 'tour', 'viagem', 'roteiro', 'reservas', 'contas', 'fotos', 'fim'):
    if nome in M:
        efeitos.por(sopro(), M[nome] - 0.15 - 0.3, 0.8, 0.0)

# ---------- Mixagem ----------
# Eco de sala (reverb) por convolução: melodia e harmonia ganham espaço
ir_n = int(1.9 * SR)
ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal(ir_n) * np.exp(-ir_t * 3.4)
ir[: int(0.02 * SR)] = 0
ir /= np.sqrt(np.sum(ir ** 2))
tam = 1 << int(np.ceil(np.log2(N + ir_n)))
IR = np.fft.rfft(ir, tam)


def eco(x):
    return np.fft.irfft(np.fft.rfft(x, tam) * IR, tam)[:N]


envio_e = melodia.esq * 0.6 + harmonia.esq * 0.45 + efeitos.esq * 0.15
envio_d = melodia.dir * 0.6 + harmonia.dir * 0.45 + efeitos.dir * 0.15
esq = melodia.esq + harmonia.esq + graves.esq + bateria.esq + efeitos.esq + eco(envio_d) * 0.35
dir_ = melodia.dir + harmonia.dir + graves.dir + bateria.dir + efeitos.dir + eco(envio_e) * 0.35

# Fade de entrada e de saída
fim = int(TOTAL * SR)
fade = envelope(fim, 1.2, 1.4)
esq = esq[:fim] * fade
dir_ = dir_[:fim] * fade

# Limitador suave e volume final (pico ~ -1 dB)
estereo = np.stack([esq, dir_], axis=1)
estereo /= np.percentile(np.abs(estereo), 99.9) + 1e-9
estereo = np.tanh(estereo * 0.9)
estereo = estereo / np.max(np.abs(estereo)) * 0.89

SAIDA.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(SAIDA), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((estereo * 32767).astype('<i2').tobytes())
print(f'trilha {SAIDA} {TOTAL:.2f}s, {60 / BATIDA:.1f} bpm, {N_COMPASSOS} compassos')
