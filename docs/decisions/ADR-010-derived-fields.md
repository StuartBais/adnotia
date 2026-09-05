# ADR-010: A module may derive stored values from the fields it collected

Status: accepted · 2026-09

## Context
The sleep module records a bed time and a wake time, and stores a duration in hours. The monolith fills that duration in as soon as both times are known, rounds it to the nearest quarter hour, and lets the person overwrite it — which they do, because time in bed is not time asleep. `06-data-model.md` stores `hours` alongside `bed` and `wake`, and `08-roadmap.md` asks for it "auto-computed".

The module contract as written has no way to express this. `today` fields are collected independently, `followUp` asks for more detail rather than computing anything, and nothing lets a module say "given what was just entered, this other field follows". Without a hook there are three options, all worse: make the person do arithmetic across midnight, drop the stored value and recompute it in every reader, or let the module reach into the store behind the assembler's back.

## Decision
A manifest may declare an optional `derive(day)` returning values to merge into that day's record. The Today assembler calls it after a field changes and before persisting, so what is stored is what a reader sees.

- It receives only the module's own day record and returns a partial of the same. It cannot read another module's slice, the kernel, or any other date.
- It runs once per save. Its output is not fed back into itself.
- It must be pure and cheap, and must not overwrite a value the person typed: a derived field is a starting point, not a correction.
- It is optional. Most modules will not have one.

## Consequences
- The duration is filled in without being asked for, and stays editable.
- The rule "a module owns exactly one state slice" is unchanged; `derive` narrows rather than widens what a module can reach.
- The registry checks that `derive` is a function and that it does not throw on the module's own fixtures, so a broken one fails at registration rather than on someone's Tuesday.
- `01-module-contract.md` gains the field in its manifest listing.
