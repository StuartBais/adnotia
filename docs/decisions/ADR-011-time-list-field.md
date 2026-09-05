# ADR-011: A `timeList` field type, for a prescription taken more than once a day

Status: accepted · 2026-09

## Context
Stimulant prescriptions are often split: an extended-release dose in the morning and a short-acting one in the early afternoon is a common pattern, and the whole point of the cover-across-the-day chart is to show what that does to the day. `06-data-model.md` already stores `times` as an array, and the monolith already collects one.

The contract's field types are all single-valued. `time` collects one. `followUp` asks for detail once a field has a value, which does not express "and another, as many as there are". Working around it would mean one of: asking only for the first dose and losing the rest, storing a comma-separated string and parsing it in every reader, or letting the module render its own control — which the design system forbids, because a control built twice behaves differently in two places.

## Decision
A `timeList` field type, collecting an ordered list of `HH:MM` values into an array. The kernel provides the control, as it does for every other field type.

- It stores `string[]`, matching what `06-data-model.md` already specifies for `times`.
- Empty and malformed entries are dropped on save, and the list is kept in clock order, so readers never have to sort or filter.
- It carries like any other field, so a prescription taken at 08:00 and 13:00 yesterday starts today the same way.
- The declared `cost` covers the whole list, not each row.

## Consequences
- The medication log can express a split dose, and the per-dose comparison and cover chart have the data they need.
- One more field type for every future renderer to handle; the registry checks the type is known, so a missed case fails at registration.
- It is deliberately not a general "list of anything". A module wanting a list of something else needs its own decision, on its own merits.
