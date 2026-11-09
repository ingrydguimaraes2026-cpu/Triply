# Triagem rapida de nomes: domínios (.com, .app, get*.com) + apps com o mesmo nome na App Store.
# Uso: python3 checar-nome.py nome1 nome2 ...   (nao confirma nada; so filtra)
import subprocess
import json, sys, time, urllib.request, urllib.parse, re
names = sys.argv[1:]
for n in names:
    url = "https://itunes.apple.com/search?" + urllib.parse.urlencode({"term": n, "entity": "software", "country": "us", "limit": 50})
    try:
        d = json.load(urllib.request.urlopen(url, timeout=15))
    except Exception as e:
        print(f"{n:14} ERRO {e}"); time.sleep(5); continue
    exact, travel = [], []
    for r in d["results"]:
        first = re.split(r"[\s:\-–—|,.!]+", r["trackName"].lower().strip())[0]
        if first == n.lower():
            exact.append(r["trackName"])
            if r["primaryGenreName"] in ("Travel", "Navigation", "Finance", "Social Networking", "Lifestyle"):
                travel.append(f'{r["trackName"]} [{r["primaryGenreName"]}]')
    dns = " ".join(t for t in ("com","app") if not subprocess.run(["dig","+short","NS",f"{n}.{t}"],capture_output=True,text=True).stdout.strip())
    print(f"{n:14} sem_DNS=[{dns}] mesmo_nome={len(exact):2}  relevantes={travel[:3]}")
    time.sleep(3.2)
