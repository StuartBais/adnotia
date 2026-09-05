# ADR-004: Modules are opt-in, and the home screen is not the medication log

Status: accepted · 2026-09

## Context
Most adults with ADHD are not on medication at any given time. An app that opens onto a dose field tells them it is not for them. Cognitive load is the enemy of daily use.

## Decision
Nothing is enabled by default except the shell. First run asks what the person wants help with. The home screen is assembled from their choices. Medication appears only for people who say they are currently being treated.

## Consequences
- Modules must work alone and together; see the contract.
- The daily check-in has a cost budget the shell enforces.
- The medication log is one tool among several, not the product.
