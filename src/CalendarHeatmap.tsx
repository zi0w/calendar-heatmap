import React, { useMemo, useState, useEffect } from "react";

// --- 1) Types & Interfaces ----------------------------------------
export type DayValue = { date: string; value: number | null };
type WeekStart = "sun" | "mon";
type WeekdayLanguage = "ko" | "en";

export interface CalendarHeatmapRangeOptions {
  end?: string;
  weekStart?: WeekStart;
}

export type CalendarHeatmapCellSize =
  | number
  | {
      width?: number;
      height?: number;
    };

export interface CalendarHeatmapCellOptions {
  size?: CalendarHeatmapCellSize;
  gap?: number;
  baseColor?: string;
  emptyColor?: string;
  textColor?: string;
  showDate?: boolean;
  showValue?: boolean;
  valueUnit?: string;
}

export interface CalendarHeatmapLabelOptions {
  showMonth?: boolean;
  showWeekday?: boolean;
  weekdayLanguage?: WeekdayLanguage;
  weekdayMarginTop?: number;
}

export interface CalendarHeatmapLegendOptions {
  show?: boolean;
  position?: "top" | "bottom";
  labels?: string[];
  margin?: number;
}

export interface CalendarHeatmapContainerOptions {
  width?: number | string;
  style?: React.CSSProperties;
}

export interface CalendarHeatmapTypographyOptions {
  textColor?: string;
}

export interface CalendarHeatmapProps {
  start: string;
  data: DayValue[];
  range?: CalendarHeatmapRangeOptions;
  cell?: CalendarHeatmapCellOptions;
  labels?: CalendarHeatmapLabelOptions;
  legend?: CalendarHeatmapLegendOptions;
  container?: CalendarHeatmapContainerOptions;
  typography?: CalendarHeatmapTypographyOptions;
  onDayClick?: (info: {
    date: string;
    value: number | null;
    inMonth: boolean;
  }) => void;
}

// --- 2) Type Guards -----------------------------------------------
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

// --- 3) Constants -------------------------------------------------
const WEEKDAY_LABELS: Record<WeekdayLanguage, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ko: ["일", "월", "화", "수", "목", "금", "토"],
};

// --- 4) Style bases -----------------------------------------------
function createGridStyle({
  columns,
  cellWidth,
  gap,
  overrides,
}: {
  columns: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  overrides?: React.CSSProperties;
}): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, ${cellWidth}px)`,
    gap,
    ...overrides,
  };
}

function createDayCellStyle({
  cellWidth,
  cellHeight,
  background,
  opacity,
}: {
  cellWidth: number;
  cellHeight: number;
  background: string;
  opacity: number;
}): React.CSSProperties {
  return {
    borderRadius: 2,
    width: cellWidth,
    height: cellHeight,
    background,
    opacity,
  };
}

const DAY_CONTENT_BASE_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 10,
  lineHeight: 1.1,
  padding: 2,
  boxSizing: "border-box",
};

function getDayContentStyle(
  hasValue: boolean,
  textColor: string
): React.CSSProperties {
  return {
    ...DAY_CONTENT_BASE_STYLE,
    color: textColor,
    opacity: hasValue ? 1 : 0.6,
  };
}

function resolveCellDimensions(
  size: CalendarHeatmapCellSize | undefined,
  fallback: number
) {
  if (isFiniteNumber(size)) {
    return { width: size, height: size };
  }

  if (size && typeof size === "object") {
    const width = isFiniteNumber(size.width) ? size.width : undefined;
    const height = isFiniteNumber(size.height) ? size.height : undefined;

    if (width && height) return { width, height };
    if (width) return { width, height: width };
    if (height) return { width: height, height };
  }

  return { width: fallback, height: fallback };
}

function formatDayValue(value: number | null, unit?: string) {
  if (!isFiniteNumber(value)) return null;
  const formatted = Math.round(value).toLocaleString();
  if (!unit) return formatted;
  return `${formatted}${unit}`;
}

function buildCellAriaLabel({
  iso,
  value,
  inMonth,
  unit,
}: {
  iso: string;
  value: number | null;
  inMonth: boolean;
  unit?: string;
}) {
  if (!inMonth) return `${iso} (다른 달)`;
  if (!isFiniteNumber(value)) return `${iso} 데이터 없음`;
  const formatted = formatDayValue(value, unit);
  return formatted ? `${iso} 값 ${formatted}` : `${iso} 데이터 없음`;
}

function getOrderedWeekdayLabels(
  language: WeekdayLanguage,
  weekStart: WeekStart
) {
  const labels = WEEKDAY_LABELS[language];
  if (weekStart === "sun") return labels;
  return [...labels.slice(1), labels[0]];
}

// --- 5) Date Utils ------------------------------------------------
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const parseYM = (s: string) => {
  const [y, m] = s.split("-").map(Number);
  return new Date(y, m - 1, 1);
};
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfWeek = (date: Date, weekStart: WeekStart) => {
  const day = date.getDay();
  const target = weekStart === "sun" ? 0 : 1;
  const back = (day - target + 7) % 7;
  return addDays(date, -back);
};
const endOfWeek = (date: Date, weekStart: WeekStart) => {
  const day = date.getDay();
  const target = weekStart === "sun" ? 6 : 0;
  const forward = (target - day + 7) % 7;
  return addDays(date, forward);
};

// --- 6) Color Utils -----------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  const bigint = parseInt(
    c.length === 3
      ? c
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : c,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}
function mixToWhite(hex: string, t: number) {
  // t: 0(연함)~1(진함)
  const [r, g, b] = hexToRgb(hex);
  const rr = Math.round(r + (255 - r) * (1 - t));
  const gg = Math.round(g + (255 - g) * (1 - t));
  const bb = Math.round(b + (255 - b) * (1 - t));
  return `rgb(${rr}, ${gg}, ${bb})`;
}
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function buildScale(values: number[]) {
  const finiteVals = values.filter((v): v is number => isFiniteNumber(v));

  const fallbackValue = 0;
  const resolvedMin =
    finiteVals.length > 0 ? Math.min(...finiteVals) : fallbackValue;
  const resolvedMax =
    finiteVals.length > 0 ? Math.max(...finiteVals) : resolvedMin;

  const range = resolvedMax - resolvedMin;

  const intensity = (v: number | null) => {
    if (v == null) return 0;
    if (range === 0) return 1;
    return clamp01((v - resolvedMin) / range);
  };

  return {
    intensity,
    thresholds: [resolvedMin, resolvedMax],
  };
}

// --- 8) Grid/Builders ---------------------------------------------
type MonthDay = { iso: string; inMonth: boolean };
type MonthInfo = { year: number; month: number; days: MonthDay[] };

function buildMonthDays(
  year: number,
  month: number,
  weekStart: WeekStart
): MonthDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = endOfMonth(firstOfMonth);
  const gridStart = startOfWeek(firstOfMonth, weekStart);
  const gridEnd = endOfWeek(lastOfMonth, weekStart);

  const result: MonthDay[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
    const iso = toISO(d);
    const inMonth = d.getMonth() === month;
    result.push({ iso, inMonth });
  }
  return result;
}

function buildMonths(
  startYM: string,
  endYM: string | undefined,
  weekStart: WeekStart
): MonthInfo[] {
  const startMonth = parseYM(startYM);
  const endMonthDate = endYM ? parseYM(endYM) : new Date(); // 없으면 오늘 날짜 기준

  const endYear = endMonthDate.getFullYear();
  const endMonth = endMonthDate.getMonth();

  const months: MonthInfo[] = [];
  let cursor = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1);

  while (
    cursor.getFullYear() < endYear ||
    (cursor.getFullYear() === endYear && cursor.getMonth() <= endMonth)
  ) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    months.push({
      year: y,
      month: m,
      days: buildMonthDays(y, m, weekStart),
    });
    cursor = new Date(y, m + 1, 1);
  }

  return months;
}

// --- 9) UI Subcomponents ------------------------------------------
const DEFAULT_LEGEND_LABELS = ["Low", "Medium", "High", "Very High"];
const LEGEND_STEP_COUNT = 4;
type LegendLevel = { label: string; intensity: number };

function Legend({
  baseColor,
  levels,
  textColor = "#AEB9E1",
  placement = "bottom",
  margin,
}: {
  baseColor: string;
  levels: LegendLevel[];
  textColor?: string;
  placement?: "top" | "bottom";
  margin?: number;
}) {
  if (levels.length === 0) return null;

  const offset = margin ?? 12;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        marginTop: placement === "bottom" ? offset : 0,
        marginBottom: placement === "top" ? offset : 0,
      }}
    >
      {levels.map(({ label, intensity }, idx) => (
        <div
          key={`${label}-${idx}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: mixToWhite(baseColor, intensity),
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: textColor,
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- 10) Main Component --------------------------------------------
export default function CalendarHeatmap({
  start,
  data,
  range,
  cell,
  labels,
  legend,
  container,
  typography,
  onDayClick,
}: CalendarHeatmapProps) {
  const end = range?.end;
  const weekStart = range?.weekStart ?? "sun";

  const cellOptions = cell ?? {};
  const { width: cellWidth, height: cellHeight } = resolveCellDimensions(
    cellOptions.size,
    44
  );
  const gap = cellOptions.gap ?? 4;
  const baseColor = cellOptions.baseColor ?? "#3b82f6";
  const emptyColor = cellOptions.emptyColor ?? "#FFECEC";
  const cellTextColor = cellOptions.textColor ?? "#172343";
  const showDayNumber = cellOptions.showDate ?? true;
  const showDayValue = cellOptions.showValue ?? true;
  const valueUnit = cellOptions.valueUnit;
  const labelOptions = labels ?? {};
  const showMonthLabels = labelOptions.showMonth ?? true;
  const showWeekdayLabels = labelOptions.showWeekday ?? true;
  const weekdayLanguage = labelOptions.weekdayLanguage ?? "en";
  const weekdayMarginTop = labelOptions.weekdayMarginTop ?? 6;

  const legendOptions = legend ?? {};
  const showLegend = legendOptions.show ?? true;
  const legendPosition = legendOptions.position ?? "bottom";
  const legendLabels = legendOptions.labels;
  const legendMargin = legendOptions.margin ?? 12;

  const containerOptions = container ?? {};
  const containerStyle = containerOptions.style;

  const textColor = typography?.textColor ?? "#ffffff";

  const mergedContainerStyle: React.CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    ...containerStyle,
  };

  const dateValueMap = useMemo(() => {
    const m = new Map<string, number | null>();
    for (const { date, value } of data) {
      m.set(date, isFiniteNumber(value) ? value : null);
    }
    return m;
  }, [data]);

  const scaleValues = useMemo(
    () =>
      data
        .map((d) => d.value ?? NaN)
        .filter((v) => Number.isFinite(v)) as number[],
    [data]
  );

  const intensityScale = useMemo(() => buildScale(scaleValues), [scaleValues]);

  const legendLabelsResolved = useMemo(() => {
    const base =
      legendLabels && legendLabels.length > 0
        ? legendLabels
        : DEFAULT_LEGEND_LABELS;
    if (base.length >= LEGEND_STEP_COUNT) {
      return base.slice(0, LEGEND_STEP_COUNT);
    }
    return [
      ...base,
      ...DEFAULT_LEGEND_LABELS.slice(base.length, LEGEND_STEP_COUNT),
    ];
  }, [legendLabels]);

  const legendLevels = useMemo<LegendLevel[]>(() => {
    if (!showLegend) return [];

    return Array.from({ length: LEGEND_STEP_COUNT }, (_, idx) => ({
      label: legendLabelsResolved[idx],
      intensity: idx / (LEGEND_STEP_COUNT - 1),
    }));
  }, [showLegend, legendLabelsResolved]);

  const months = useMemo(
    () => buildMonths(start, end, weekStart),
    [start, end, weekStart]
  );

  const safeMonths = useMemo(() => {
    if (months.length > 0) return months;
    const s = parseYM(start);
    return [
      {
        year: s.getFullYear(),
        month: s.getMonth(),
        days: buildMonthDays(s.getFullYear(), s.getMonth(), weekStart),
      },
    ];
  }, [months, start, weekStart]);

  const [activeMonthIndex, setActiveMonthIndex] = useState(0);

  useEffect(() => {
    setActiveMonthIndex(0);
  }, [start, end]);

  useEffect(() => {
    setActiveMonthIndex((prev) => {
      const maxIndex = safeMonths.length - 1;
      if (prev > maxIndex) return maxIndex;
      return prev;
    });
  }, [safeMonths.length]);

  const activeMonth = safeMonths[activeMonthIndex];
  const days = activeMonth?.days ?? [];

  const weekdayLabels = useMemo(
    () => getOrderedWeekdayLabels(weekdayLanguage, weekStart),
    [weekdayLanguage, weekStart]
  );
  const columns = 7;
  const gridPixelWidth = columns * cellWidth + gap * (columns - 1);

  const gridStyle = useMemo(
    () =>
      createGridStyle({
        columns,
        cellWidth,
        cellHeight,
        gap,
      }),
    [cellWidth, cellHeight, gap]
  );

  const weekdayGridStyle = useMemo(
    () =>
      createGridStyle({
        columns,
        cellWidth,
        cellHeight,
        gap,
        overrides: { marginTop: weekdayMarginTop },
      }),
    [cellWidth, cellHeight, gap, weekdayMarginTop]
  );

  const hasMultipleMonths = safeMonths.length > 1;
  const monthLabel =
    activeMonth && `${activeMonth.year}/${pad(activeMonth.month + 1)}`;

  return (
    <div style={mergedContainerStyle}>
      <div style={{ width: gridPixelWidth }}>
        {showMonthLabels && activeMonth && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            {hasMultipleMonths ? (
              <select
                value={activeMonthIndex}
                onChange={(e) => setActiveMonthIndex(Number(e.target.value))}
                style={{
                  fontSize: 12,
                  fontWeight: 300,
                  padding: "4px 10px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: textColor,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  backgroundImage:
                    "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)",
                  backgroundPosition:
                    "calc(100% - 12px) 50%, calc(100% - 8px) 50%",
                  backgroundSize: "5px 5px, 5px 5px",
                  backgroundRepeat: "no-repeat",
                  paddingRight: 24,
                }}
              >
                {safeMonths.map((m, idx) => (
                  <option
                    key={`${m.year}-${m.month}`}
                    value={idx}
                    style={{ color: textColor }}
                  >
                    {`${m.year}/${pad(m.month + 1)}`}
                  </option>
                ))}
              </select>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 300,
                  color: textColor,
                }}
              >
                {monthLabel}
              </div>
            )}
          </div>
        )}

        {legendPosition === "top" && showLegend && (
          <Legend
            baseColor={baseColor}
            levels={legendLevels}
            textColor={textColor}
            placement="top"
            margin={legendMargin}
          />
        )}

        <div role="grid" aria-label="calendar heatmap" style={gridStyle}>
          {days.map(({ iso, inMonth }) => {
            const dataValue = dateValueMap.get(iso);
            const valueForCell =
              inMonth && isFiniteNumber(dataValue) ? dataValue : null;
            const intensity =
              valueForCell == null ? 0 : intensityScale.intensity(valueForCell);
            const hasValue = inMonth && valueForCell != null;
            const fill = hasValue
              ? mixToWhite(baseColor, intensity)
              : emptyColor;

            const dateObj = new Date(iso);
            const dayNum = dateObj.getDate();
            const formattedValue = formatDayValue(valueForCell, valueUnit);
            const shouldShowValue = inMonth && showDayValue && formattedValue;
            const ariaLabel = buildCellAriaLabel({
              iso,
              value: valueForCell,
              inMonth,
              unit: valueUnit,
            });
            const cellStyle = createDayCellStyle({
              cellWidth,
              cellHeight,
              background: fill,
              opacity: inMonth ? 1 : 0.5,
            });
            const dayContentStyle = getDayContentStyle(
              valueForCell != null,
              cellTextColor
            );

            const handleDayClick = () => {
              if (!onDayClick) return;
              onDayClick({ date: iso, value: valueForCell, inMonth });
            };
            const interactive = !!onDayClick && inMonth;

            if (!inMonth) {
              return (
                <div
                  key={iso}
                  role="grid-cell"
                  aria-hidden={true}
                  style={cellStyle}
                />
              );
            }

            return (
              <div
                key={iso}
                role="grid-cell"
                aria-label={ariaLabel}
                style={{
                  ...cellStyle,
                  cursor: interactive ? "pointer" : "default",
                }}
                onClick={interactive ? handleDayClick : undefined}
              >
                <div style={dayContentStyle}>
                  {showDayNumber && (
                    <span
                      style={{
                        fontWeight: 600,
                        marginBottom: shouldShowValue ? 2 : 0,
                      }}
                    >
                      {dayNum}
                    </span>
                  )}
                  {shouldShowValue && (
                    <span
                      style={{
                        fontSize: 9,
                        opacity: 0.9,
                        textAlign: "center",
                      }}
                    >
                      {formattedValue}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showWeekdayLabels && (
          <div style={weekdayGridStyle}>
            {weekdayLabels.map((label, idx) => (
              <div
                key={`${label}-${idx}`}
                style={{
                  width: cellWidth,
                  height: cellHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: textColor,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        )}

        {legendPosition === "bottom" && showLegend && (
          <Legend
            baseColor={baseColor}
            levels={legendLevels}
            textColor={textColor}
            placement="bottom"
            margin={legendMargin}
          />
        )}
      </div>
    </div>
  );
}
