# ADR-002: AGPL-3.0

Status: accepted · 2026-09

## Context
The privacy claim is unverifiable without source. A permissive licence would allow a closed fork that adds tracking and a paywall, which is exactly the product category Adnotia exists to counter.

## Decision
AGPL-3.0. Anyone distributing a modified version, including over a network, must publish their changes.

## Consequences
- Some contributors avoid AGPL projects. Accepted.
- Charging for hosting a copy remains permitted; hiding modifications does not.
- Third-party code must be AGPL-compatible. Runtime dependencies are zero anyway.
