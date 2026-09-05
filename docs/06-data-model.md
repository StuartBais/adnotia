# Adnotia data model

Status: draft 0.1 · September 2026

## One document

Everything a person has is one JSON document. It is persisted whole on every debounced write, encrypted whole if a passcode is set, and exported whole in a backup. There are no partial writes and no secondary stores.

```json
{
  "schemaVersion": 1,
  "createdAt": "2026-09-05T20:12:00.000Z",
  "space": "adult",

  "kernel": {
    "enabledModules": ["medication", "sleep"],
    "moduleOrder": ["medication", "sleep"],
    "lastBackup": "2026-09-01",
    "lastAppointment": "2026-08-14",
    "overall": "mi",
    "baseline": { "focus": 2, "mood": 2, "sleep": "6", "note": "" },
    "questions": [{ "id": "q1", "text": "…", "added": "2026-09-01" }],
    "days": {
      "2026-09-04": {
        "win": "…",
        "miss": "…",
        "createdAt": "2026-09-04T21:30:00.000Z"
      }
    },
    "settings": { "passcodeEnabled": false }
  },

  "modules": {
    "medication": {
      "version": 3,
      "days": {
        "2026-09-04": {
          "med": "Elvanse",
          "dose": "50",
          "unit": "mg",
          "times": ["08:00"],
          "adherence": "ontime",
          "focus": 4,
          "mood": 3,
          "onset": "09:30",
          "woreOff": "16:30",
          "rebound": "mild",
          "reboundTime": "17:00",
          "appetite": "reduced",
          "heart": "fine",
          "side": ["dry"],
          "detail": {
            "dry": { "sev": "mild", "time": "11:00", "note": "", "bpm": "" }
          }
        }
      }
    },
    "sleep": {
      "version": 1,
      "days": {
        "2026-09-04": {
          "bed": "23:40",
          "wake": "07:00",
          "hours": "7.25",
          "quality": ["latency"],
          "latency": "45",
          "note": ""
        }
      }
    }
  },

  "family": {
    "children": {
      "c_8f2a": {
        "nickname": "Sam",
        "ageBand": "6-11",
        "createdAt": "2026-09-05T20:40:00.000Z",
        "modules": {
          "family-observations": { "version": 1, "entries": [] },
          "family-routines": { "version": 1, "schedules": {}, "chart": {} }
        }
      }
    }
  }
}
```

## Rules

- **Kernel fields** are owned by the kernel. Modules read `kernel.days` for wins and misses and `kernel.baseline` through the report context; they never write to `kernel`.
- **A module slice** is whatever the module puts under its id, plus `version`, which the kernel sets on creation and the module's `migrate` raises. Daily data goes under `days[<ISO date>]`, because the Today assembler writes there and `records` and `reports` read from there. Anything else in the slice is the module's business.
- **Dates** are local calendar dates as `YYYY-MM-DD`. The "logging day" is the calendar day except before 04:00, when it is the previous day. Times of day are `HH:MM` 24-hour strings. Timestamps are ISO 8601 with offset.
- **`createdAt`** on a day record is set on first save and never changed. It is what the record-quality footer uses to distinguish same-day entries from backfilled ones.
- **Unknown keys are preserved.** The store, the migrations and the backup merge all copy keys they do not recognise. A backup from a newer build restored on an older build keeps the newer module's data intact and untouched.
- **Deleting** a module's data removes `modules.<id>` (or `family.children[p].modules.<id>`) entirely. Disabling leaves it in place. Deleting a child profile removes `family.children[p]` entirely.

## Reserved field ids

The Today assembler reserves `_derived` within a module day record for a map of
field ids to their last automatically calculated values. This distinguishes
editable calculations from manual answers across reloads and backups. Records
without it retain their existing values without guessing their origin. It is
not report content. See `decisions/ADR-014-derived-value-provenance.md`.

Outside `audience: "adult"` modules the kernel rejects these `today` field ids at registration: `dose`, `med`, `times`, `onset`, `woreOff`, `rebound`. This is the mechanical form of "no medication in the Family space".

## Encryption envelope

When a passcode is set, `localStorage["adnotia-v1"]` holds this instead of the document:

```json
{
  "enc": 1,
  "v": 1,
  "kdf": "PBKDF2-SHA256",
  "iter": 500000,
  "salt": "<base64 16 bytes>",
  "iv": "<base64 12 bytes>",
  "ct": "<base64>"
}
```

- Key: PBKDF2-SHA256 over the UTF-8 passcode with the stored salt and iteration count, output an AES-GCM-256 key, non-extractable.
- Every write uses a fresh IV. The salt changes only when the passcode changes.
- The same envelope shape is used for backup files, with a separate salt and a key derived from the backup passphrase. A backup file is recognisable by `enc: 1`; a plain backup is the raw document.
- Iteration count is stored so it can be raised in future without breaking old data.

## Backup file

Filename `adnotia-YYYY-MM-DD.json`. Content is either the raw document (only if encryption is unavailable in the browser, and the UI says so) or the envelope above. Restore:

1. Detect envelope; if present, ask for the passphrase and decrypt. Wrong passphrase changes nothing.
2. Run kernel migration on the restored document to the current `schemaVersion`.
3. **Merge, do not replace.** For each module slice and each child profile, day records and entries from the backup overwrite same-key records in the live document; everything else is unioned. Questions are deduplicated by text. `lastBackup`, `lastAppointment` and `baseline` take the more recent value where both exist.
4. Run every enabled module's `migrate`.
5. Report counts: entries added, entries updated, profiles added.

Merging rather than replacing is what makes "restore onto a second device" and "restore after a partial data loss" both safe.

## Migration rules

- `schemaVersion` migrations are pure functions `(doc) => doc`, applied in order, tested pairwise from every historical version. Version 1 is the shape above.
- Module migrations are `(slice, fromVersion) => slice`, the same way.
- A migration may rename or restructure but never drops a key it does not recognise.
- A migration is written before the code that needs it, and shipped in the same release.
- `CHANGELOG.md` lists every migration with the version pair and a one-line description.

## The v0 monolith mapping

The reference implementation stores everything under one key, `adhd-titration-log-v1`, in a flatter shape. The kernel's `schemaVersion` 0 → 1 migration imports it:

| v0                                                                                                                   | v1                                                                 |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `entries[d].{med,dose,unit,times,adherence,focus,mood,onset,woreOff,rebound,reboundTime,appetite,heart,side,detail}` | `modules.medication.days[d]`                                       |
| `entries[d].{bed,wake,sleep,sleepq,sleepLatency,sleepNote}`                                                          | `modules.sleep.days[d]` as `{bed,wake,hours,quality,latency,note}` |
| `entries[d].{win,miss,createdAt}`                                                                                    | `kernel.days[d]`                                                   |
| `questions`, `baseline`, `overall`, `lastAppt`, `lastBackup`                                                         | `kernel.*`                                                         |
| `last` (carry-forward cache)                                                                                         | dropped; `carry: "nearestPrior"` recomputes it                     |

The migration enables `medication` and `sleep` when it finds v0 data, sets `space: "adult"`, and keeps the old key untouched until the person confirms the import worked, then removes it. If the old key holds an encryption envelope, it is decrypted with the passcode first; the envelope format is unchanged between v0 and v1.
