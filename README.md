# calendar-heatmap

A lightweight React **calendar heatmap** component with a **month selector**, **weekday labels**, and a **legend**.  
Values map to color intensity: lower values render lighter, higher values darker. Fully typed with TypeScript.

> **Peer deps:** `react` (>=18), `react-dom` (>=18)

---

## ✨ Features

- Define start month and optional end month (`YYYY-MM`)
- Choose week start (`sun` | `mon`)
- Automatic color scaling (continuous, light → dark) based on data
- Month dropdown, weekday labels, centered legend
- Per-cell control: width/height, gap, colors, text visibility
- Global typography color
- TypeScript declarations included (`.d.ts`)

---

## 📦 Install

```bash
# npm
npm i calendar-heatmap
# pnpm
pnpm add calendar-heatmap
# yarn
yarn add calendar-heatmap
```

## 🚀 Quick Start

```tsx
import { CalendarHeatmap } from "calendar-heatmap";
import type { DayValue } from "calendar-heatmap";

const data: DayValue[] = [
  { date: "2025-08-01", value: 2500 },
  { date: "2025-08-02", value: 1200 },
  // ...
];

export default function Example() {
  return (
    <CalendarHeatmap
      start="2025-01"
      data={data}
      range={{ end: "2025-12", weekStart: "sun" }}

      cell={{
        size: { width: 52, height: 40 }, // or a single number for square cells
        gap: 4,
        baseColor: "#3b82f6",           // color used for value cells (tinted to white)
        emptyColor: "#FFECEC",          // color for empty/other-month cells
        textColor: "#172343",           // text color inside each day cell
        showDate: true,                 // show day number
        showValue: true,                // show numeric value
      }}

      labels={{
        showMonth: true,                // show month label / dropdown
        showWeekday: true,              // show weekday labels under the grid
        weekdayLanguage: "en",          // 'en' | 'ko'
      }}

      legend={{
        show: true,
        position: "bottom",             // 'top' | 'bottom'
        // labels?: ["Low", "Medium", "High", "Very High"]
      }}

      container={{
        // width?: 720 or "100%"
        style: {
          padding: 24,
          borderRadius: 8,
          background: "#172343",
          border: "1px solid #000",
        },
      }}

      typography={{
        textColor: "#ffffff",           // dropdown/labels/legend text color
      }}
    />
  );
}
```

---

## 🧩 Types & Props

### Data shape
```ts
export type DayValue = {
  date: string;         // "YYYY-MM-DD"
  value: number | null; // null = no data
};
```
> Note: Dates must be in local ISO form "YYYY-MM-DD".
Missing days are fine; cells without data render using emptyColor.

### CalendarHeatmapProps
```ts
export interface CalendarHeatmapProps {
  start: string;                  // "YYYY-MM" (first month displayed)
  data: DayValue[];               // per-day values

  range?: {
    end?: string;                 // "YYYY-MM" (defaults to current month)
    weekStart?: "sun" | "mon";    // grid alignment
  };

  cell?: {
    size?: number | { width?: number; height?: number };
    gap?: number;                 // px
    baseColor?: string;           // base color for value cells
    emptyColor?: string;          // color for empty / out-of-month cells
    textColor?: string;           // inside-day text color
    showDate?: boolean;           // show day number
    showValue?: boolean;          // show numeric value
  };

  labels?: {
    showMonth?: boolean;          // show month label/dropdown
    showWeekday?: boolean;        // show weekday labels under the grid
    weekdayLanguage?: "ko" | "en";
  };

  legend?: {
    show?: boolean;
    position?: "top" | "bottom";
    labels?: string[];            // default: ["Low","Medium","High","Very High"]
  };

  container?: {
    width?: number | string;      // e.g. 720 or "100%"
    style?: React.CSSProperties;  // outer wrapper styles
  };

  typography?: {
    textColor?: string;           // general UI text (dropdown/labels/legend)
  };
}
```

---
## 🎨 How coloring works
- The component collects all finite values to compute [min, max].
- Each day’s intensity = (value - min) / (max - min) clamped to [0,1].
- Final swatch = baseColor mixed toward white based on that intensity.
- Cells with null or out-of-month days use emptyColor.

---
## 🐞 Issues & Contributing
- Please open issues for bugs/feature requests.
- PRs are welcome!
