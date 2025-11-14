import { createRoot } from "react-dom/client";
import { CalendarHeatmap, type DayValue } from "../src";

const START_YM = "2025-01";
const END_YM = "2025-12";

// 간단한 데모용 데이터 생성 함수 (start~end 사이 모든 날짜에 랜덤 값)
function generateDemoData(startYM: string, endYM: string): DayValue[] {
  const [startYear, startMonth] = startYM.split("-").map(Number);
  const [endYear, endMonth] = endYM.split("-").map(Number);

  const startDate = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(endYear, endMonth, 0);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const toLocalISO = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const result: DayValue[] = [];
  for (
    let d = new Date(startDate.getTime());
    d <= endDate;
    d.setDate(d.getDate() + 1)
  ) {
    const iso = toLocalISO(d); // YYYY-MM-DD
    const value = Math.round(Math.random() * 5000);
    result.push({ date: iso, value });
  }
  return result;
}

const data = generateDemoData(START_YM, END_YM);

function App() {
  return (
    <CalendarHeatmap
      start={START_YM}
      data={data} 
      range={{ end: END_YM, weekStart: "sun" }} 
      cell={{
        size: { width: 52, height: 40 }, 
        gap: 4,
        baseColor: "#fdbab0",
        emptyColor: "#FFECEC",
        textColor: "#172343",
      }}
      labels={{
        weekdayLanguage: "en",
        showWeekday: true,
      }}
      legend={{
        show: true,
        position: "bottom",
      }}
      container={{
        style: {
          padding: 24,
          borderRadius: 8,
          background: "#172343", 
        },
      }}
      typography={{
        textColor: "#ffffff",
      }}
    />
  );
}

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<App />);
