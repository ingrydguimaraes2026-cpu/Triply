# Gera a narração de cada cena do roteiro.json com voz neural (edge-tts)
# e grava a duração de cada fala em audio/duracoes.json (a montagem usa isso).
# Uso: python narrar.py
import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

PASTA = Path(__file__).parent
AUDIO = PASTA / "audio"


def duracao(arquivo: Path) -> float:
    saida = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(arquivo)],
        capture_output=True, text=True, check=True,
    )
    return round(float(saida.stdout.strip()), 2)


async def main():
    roteiro = json.loads((PASTA / "roteiro.json").read_text(encoding="utf-8"))
    AUDIO.mkdir(exist_ok=True)
    duracoes = {}
    for cena in roteiro["cenas"]:
        arquivo = AUDIO / f"{cena['id']}.mp3"
        await edge_tts.Communicate(cena["fala"], roteiro["voz"], rate=roteiro["velocidade"]).save(str(arquivo))
        duracoes[cena["id"]] = duracao(arquivo)
        print(cena["id"], duracoes[cena["id"]], "s")
    (AUDIO / "duracoes.json").write_text(json.dumps(duracoes, indent=2), encoding="utf-8")


asyncio.run(main())
