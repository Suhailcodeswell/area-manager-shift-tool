# Area Manager Shift Tool

Portfolio project by **Suhail Ahmed**: a shift operating tool for a warehouse Area Manager, built for a **fictional Canadian 3PL warehouse**.

Enter who showed up and how much volume is coming. The tool places people on dock, stow, pick, and pack; blocks illegal PIT placements; evaluates SQDC; and generates huddle and handoff text.

**Live demo:** [area-manager-shift-tool.vercel.app](https://area-manager-shift-tool.vercel.app)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tabs

| Tab | Purpose |
|-----|---------|
| **Start here** | What the tool does, load sample or live shift |
| **5-min tour** | Walkthrough of the sample Saturday |
| **Glossary** | Warehouse operations terms |
| **Floor** | Main tool: place people, edit volume, read warnings |
| **Huddle** | Generated stand-up text from the board |
| **Handoff** | Generated shift handoff |
| **Issues / 5-why** | Sample root-cause analysis |
| **How it was made** | Real data sources and what was simulated |

## Data

- **Real:** OSHA ITA warehousing patterns (NAICS 493110), BLS TRIR, Job Bank wages, Ontario ESA, published 3PL UPH bands
- **Simulated:** roster, hourly volume, trucks, call-outs (labeled in the app)

Interview prep and talking points live in `../PORTFOLIO_AND_INTERVIEW_NOTES.md` (not shown in the app).

## Deploy

```bash
npm run build
npx vercel --prod
```
