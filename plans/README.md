# plans/

**Plans are ephemeral. Delete one when the work it describes is done.**

A plan is scaffolding for work in flight: the approach, the open questions, the
order of operations. Once the thing is built, the plan is a description of the
past — the code and `docs/` are the present, and a stale plan is worse than no
plan because an agent will read it as current intent.

Contrast with the two durable kinds of writing in this repo:

| | Lives in | Lifetime |
| --- | --- | --- |
| **Plan** | `plans/<topic>.md` | delete on completion |
| **Scene todo** | `<Scene>/todo.md` | lives as long as the scene |
| **Convention / reference** | `docs/`, `AGENTS.md` | until it stops being true |

If a plan produced a rule worth keeping, promote that rule into
`docs/scene-conventions.md` and delete the plan — don't leave the plan as the
only record.

Plans are tracked in git so they can be reviewed and shared; "ephemeral" means
short-lived, not private. Their history survives deletion.
