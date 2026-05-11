# Dice Roller - Schema Opzionale

Questo schema descrive campi opzionali per arricchire mostri, incantesimi e oggetti senza sostituire il testo SRD. Il renderer deve sempre trattare questi campi come assistivi: se mancano, sono incompleti o non validi, usa il parser runtime sul testo originale.

## Posizione Dei Campi

Per mostri:

```json
{
  "azioni": [
    {
      "nome": "Morso",
      "descrizione": "Tiro per colpire...",
      "ricarica": null,
      "tiri": []
    }
  ]
}
```

Per tratti, reazioni e azioni leggendarie si puo usare la stessa forma, ma solo quando il testo ha un pattern ad alta confidenza.

## `tiri[]`

Ogni voce rappresenta un tiro strutturato collegato alla voce testuale.

Campi comuni:

| Campo | Tipo | Richiesto | Note |
| --- | --- | --- | --- |
| `tipo` | string | si | `attacco`, `salvezza`, `multiattacco` |
| `origine` | string | no | `testo`, `manuale`, `parser` |
| `confidenza` | string | no | `alta`, `media`, `bassa` |
| `note` | string | no | Testo breve per condizioni non automatizzate |

## Attacco

```json
{
  "tipo": "attacco",
  "modalita": "mischia",
  "bonus": 7,
  "portata": "1,5 m",
  "gittata": null,
  "bersaglio": "una creatura",
  "vantaggio_condizionale": null,
  "danni": [
    {
      "formula": "2d6 + 4",
      "media": 11,
      "tipo": "perforanti",
      "contesto": "colpito"
    }
  ],
  "effetti": [
    "afferrato (CD 14 per sfuggire)"
  ],
  "confidenza": "alta"
}
```

Regole:

- `modalita` puo essere `mischia`, `distanza`, `mischia_o_distanza`, `incantesimo_mischia`, `incantesimo_distanza`.
- `bonus` e numerico e conserva solo il modificatore, per esempio `+7` diventa `7`.
- `portata` e `gittata` restano stringhe per non perdere unita o formati tipo `24/96 m`.
- `vantaggio_condizionale` resta stringa: non si traduce in automazione finche la condizione non e verificabile.

## Salvezza

```json
{
  "tipo": "salvezza",
  "caratteristica": "Destrezza",
  "cd": 15,
  "area": "cono di 4,5 metri",
  "bersaglio": "tutte le creature nell'area",
  "fallimento": {
    "danni": [
      {
        "formula": "7d8",
        "media": 31,
        "tipo": "fuoco",
        "contesto": "fallimento"
      }
    ],
    "effetti": []
  },
  "successo": {
    "danni": "meta",
    "effetti": []
  },
  "confidenza": "alta"
}
```

Regole:

- `caratteristica` usa il nome italiano completo: `Forza`, `Destrezza`, `Costituzione`, `Intelligenza`, `Saggezza`, `Carisma`.
- `successo.danni` puo essere `null`, `meta`, oppure un array `danni[]` se il testo contiene una formula esplicita.
- Effetti testuali restano in `effetti[]`; non diventano automazione.

## Danni

```json
{
  "formula": "2d6 + 3",
  "media": 10,
  "tipo": "taglienti",
  "contesto": "colpito",
  "condizione": null
}
```

Regole:

- `formula` deve essere accettata da `parseDiceFormula`.
- `media` e il valore stampato nel testo SRD, se presente.
- `tipo` resta singolare o plurale come nel testo sorgente.
- `condizione` descrive casi come `se lo sciame e sanguinante`, ma non abilita automatismi.

## Ricarica

La ricarica puo stare direttamente sulla voce di azione:

```json
{
  "nome": "Soffio di fuoco (ricarica 5-6)",
  "ricarica": {
    "formula": "1d6",
    "successo": [5, 6],
    "testo": "ricarica 5-6"
  },
  "tiri": []
}
```

Regole:

- `successo` contiene i risultati del `d6` che ricaricano l'azione.
- `testo` conserva la forma originale.
- Se il testo e `ricarica 6`, `successo` e `[6]`.

## Multiattacco

```json
{
  "tipo": "multiattacco",
  "sequenza": [
    {
      "azione": "Morso",
      "quantita": 1
    },
    {
      "azione": "Artiglio",
      "quantita": 2
    }
  ],
  "esegui_automaticamente": false,
  "confidenza": "media"
}
```

Regole:

- `azione` deve corrispondere al `nome` di un'altra azione dello stesso mostro quando possibile.
- `esegui_automaticamente` resta `false` nella prima versione.
- Se il testo dice "in qualsiasi combinazione", la sequenza puo essere omessa e si usa `note`.

## Compatibilita Renderer

Il renderer deve seguire questo ordine:

1. Se `tiri[]` contiene record validi, mostra controlli dedicati usando quei dati.
2. Se `tiri[]` manca o e incompleto, usa il parser runtime sul testo.
3. Se entrambi producono risultati, preferisci i dati strutturati ma conserva il testo originale.
4. Non mostrare errori utente per dati strutturati incompleti: degrada in modo silenzioso al fallback.

## Validazione Minima

Un record e valido se:

- `tipo` e uno dei valori supportati;
- per `attacco`, `bonus` e numerico;
- per `salvezza`, `cd` e numerico e `caratteristica` e presente;
- ogni `danni[].formula` passa `parseDiceFormula`;
- `ricarica.successo`, se presente, contiene solo numeri da 1 a 6.

## Campi Rimandati

Non entrano nella prima versione:

- critici automatici sui danni;
- immunita, resistenze o vulnerabilita del bersaglio;
- numero reale di bersagli colpiti;
- scelta automatica di vantaggio/svantaggio;
- consumo di risorse, cariche o slot;
- durata, concentrazione, condizioni persistenti.
