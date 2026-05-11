# Dice Roller - Mapping Dati Strutturati

Obiettivo: passare gradualmente dal parsing runtime a campi strutturati ad alta confidenza, mantenendo sempre il testo SRD come fonte visibile e il parser come fallback.

## Campione Mostri

Fonte: `data/srd/5.2.1/json/srd_5_2_1_monsters.json`.

Conteggio rapido sul dataset:

| Pattern | Occorrenze |
| --- | ---: |
| Mostri | 334 |
| Azioni totali | 819 |
| Azioni con tiro per colpire | 440 |
| Azioni con tiro salvezza | 201 |
| Multiattacco | 179 |
| Ricarica | 73 |
| Danni su `Colpito` con formula dado | 408 |
| Danni fissi senza formula dado | 17 |
| Danni condizionali o alternativi | 44 |

## Pattern Ad Alta Confidenza

### Attacco semplice

Esempio: `Ameba paglierina / Pseudopode`

Testo:

```text
Tiro per colpire in mischia: +4, portata 1,5 m Colpito: 12 (3d6 + 2) danni da acido.
```

Campi candidati:

```json
{
  "tiri": [
    {
      "tipo": "attacco",
      "modalita": "mischia",
      "bonus": 4,
      "portata": "1,5 m",
      "danni": [
        {
          "formula": "3d6 + 2",
          "media": 12,
          "tipo": "acido"
        }
      ]
    }
  ]
}
```

Confidenza: alta.

### Attacco con danni multipli

Esempio: `Ankheg / Morso`

Testo:

```text
Tiro per colpire in mischia: +5 (...), portata 1,5 m. Colpito: 10 (2d6 + 3) danni taglienti piu 3 (1d6) danni da acido.
```

Campi candidati:

```json
{
  "tiri": [
    {
      "tipo": "attacco",
      "modalita": "mischia",
      "bonus": 5,
      "vantaggio_condizionale": "se il bersaglio e afferrato dall'ankheg",
      "danni": [
        {
          "formula": "2d6 + 3",
          "media": 10,
          "tipo": "taglienti"
        },
        {
          "formula": "1d6",
          "media": 3,
          "tipo": "acido"
        }
      ]
    }
  ]
}
```

Confidenza: alta per bonus e danni; media per condizioni testuali.

### Tiro salvezza con danni dimezzati

Esempio: `Ankheg / Spruzzo acido`

Testo:

```text
Tiro salvezza su Destrezza: CD 12, tutte le creature in una linea lunga 9 metri e larga 1,5 metri. Fallimento: 14 (4d6) danni da acido. Successo: danni dimezzati.
```

Campi candidati:

```json
{
  "tiri": [
    {
      "tipo": "salvezza",
      "caratteristica": "Destrezza",
      "cd": 12,
      "area": "linea lunga 9 metri e larga 1,5 metri",
      "fallimento": {
        "danni": [
          {
            "formula": "4d6",
            "media": 14,
            "tipo": "acido"
          }
        ]
      },
      "successo": {
        "danni": "meta"
      }
    }
  ]
}
```

Confidenza: alta.

### Multiattacco

Esempio: `Balor / Multiattacco`

Testo:

```text
Il balor effettua un attacco Frusta fiammeggiante e un attacco Lama fulminante.
```

Campi candidati:

```json
{
  "tiri": [
    {
      "tipo": "multiattacco",
      "sequenza": [
        {
          "azione": "Frusta fiammeggiante",
          "quantita": 1
        },
        {
          "azione": "Lama fulminante",
          "quantita": 1
        }
      ]
    }
  ]
}
```

Confidenza: media. Va risolto il riferimento al nome dell'azione.

### Ricarica

Esempio: `Behir / Soffio di fulmini (ricarica 5-6)`

Testo:

```text
Tiro salvezza su Destrezza: CD 16, tutte le creature in una linea lunga 27 metri e larga 1,5 metri. Fallimento: 66 (12d10) danni da fulmine. Successo: danni dimezzati.
```

Campi candidati:

```json
{
  "ricarica": "5-6",
  "tiri": [
    {
      "tipo": "salvezza",
      "caratteristica": "Destrezza",
      "cd": 16,
      "fallimento": {
        "danni": [
          {
            "formula": "12d10",
            "media": 66,
            "tipo": "fulmine"
          }
        ]
      },
      "successo": {
        "danni": "meta"
      }
    }
  ]
}
```

Confidenza: alta per ricarica nel nome e tiro salvezza.

## Pattern Da Lasciare Al Fallback

- Danni fissi senza formula dado, per esempio `Colpito: 1 danno perforante`.
- Danni alternativi legati a stato, per esempio sciami sanguinanti.
- Danni extra condizionati da movimento, taglia o presa.
- Attacchi con condizioni grammaticalmente spezzate nel dato sorgente.
- Effetti che ripetono danni nel tempo o richiedono un bersaglio gia afferrato/inghiottito.

## Decisione Per Il Primo Schema

Schema di riferimento: `docs/dice-roller-schema.md`.

La prima versione dello schema deve coprire solo:

- `tipo: "attacco"` con `bonus`, `modalita`, `portata` o `gittata`;
- `tipo: "salvezza"` con `caratteristica`, `cd`, `area`;
- `danni[]` con `formula`, `media`, `tipo`;
- `ricarica` quando e presente nel nome dell'azione;
- `multiattacco` solo come sequenza testuale referenziata, senza eseguire automaticamente tutti i tiri.

Tutto il resto resta testo originale piu parser runtime.

## Arricchimento Applicato

Script: `scripts/enrich-monster-rolls.js`.

Risultato sul dataset mostri:

| Campo | Valore |
| --- | ---: |
| Azioni arricchite | 494 |
| Tiri per colpire strutturati | 391 |
| Tiri salvezza strutturati | 91 |
| Ricariche strutturate | 73 |

L'arricchimento e limitato alle azioni dei mostri e conserva sempre `nome` e `descrizione` originali.
