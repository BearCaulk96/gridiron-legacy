# Gridiron Legacy

A browser-based American football **franchise dynasty** simulator.

Build your dream team across **32 cities** (same markets as the NFL, with original franchise nicknames). Draft, trade, manage coaches and the salary cap, and simulate seasons — with **no microtransactions and no pay-to-win**.

## Play

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

## Difficulty modes

| Mode | Feel |
|------|------|
| **Casual** | Soft cap, full draft visibility, generous trades, friendlier sims |
| **Rookie** | Draft grades, fair trades, light assist — best first dynasty |
| **Pro** | Hard cap, scouting fog, scheme fit, need-based trade AI |
| **Veteran** | Ruthless market, scarce scouting, injuries, every choice bites |

Progress saves automatically in your browser (`localStorage`).

## Stack

React + TypeScript + Vite. All simulation runs client-side.
