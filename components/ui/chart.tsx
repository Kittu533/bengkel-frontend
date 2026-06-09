"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs",
          "min-h-0 min-w-0",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-layer]:outline-hidden",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border",
          "[&_.recharts-radial-bar-background-sector]:fill-muted",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
          "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-sector]:outline-hidden",
          "[&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer
          height="100%"
          minHeight={0}
          minWidth={0}
          width="100%"
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme || itemConfig.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartPayloadItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
};

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelKey,
  nameKey,
  valueFormatter,
}: React.ComponentProps<"div"> & {
  active?: boolean;
  payload?: ChartPayloadItem[];
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  label?: string | number;
  labelKey?: string;
  nameKey?: string;
  valueFormatter?: (value: string | number) => React.ReactNode;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  const tooltipLabel = getTooltipLabel(config, payload[0], label, labelKey);

  return (
    <div
      className={cn(
        "grid min-w-[8rem] gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl",
        className
      )}
    >
      {!hideLabel && tooltipLabel ? (
        <div className="font-medium">{tooltipLabel}</div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = getPayloadKey(item, nameKey);
          const itemConfig = key ? config[key] : undefined;
          const indicatorColor =
            item.color || item.fill || itemConfig?.color || "currentColor";

          return (
            <div
              key={`${key || item.name || item.dataKey}`}
              className="flex min-w-0 items-center gap-2"
            >
              {!hideIndicator ? (
                <span
                  className={cn(
                    "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                    indicator === "dot" && "h-2.5 w-2.5",
                    indicator === "line" && "h-0.5 w-3",
                    indicator === "dashed" && "h-0 w-3 border-t-2 border-dashed bg-transparent"
                  )}
                  style={
                    {
                      "--color-bg": indicatorColor,
                      "--color-border": indicatorColor,
                    } as React.CSSProperties
                  }
                />
              ) : null}
              <span className="truncate text-muted-foreground">
                {itemConfig?.label || key || item.name}
              </span>
              {item.value !== undefined ? (
                <span className="ml-auto font-mono font-medium tabular-nums">
                  {valueFormatter ? valueFormatter(item.value) : item.value}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getPayloadKey(item: ChartPayloadItem, key?: string) {
  const payloadValue = key ? item.payload?.[key] : undefined;
  return String(payloadValue || item.dataKey || item.name || "");
}

function getTooltipLabel(
  config: ChartConfig,
  item: ChartPayloadItem,
  label?: string | number,
  labelKey?: string
) {
  const key = labelKey ? String(item.payload?.[labelKey] || "") : "";
  const configLabel = key ? config[key]?.label : undefined;

  return configLabel || label;
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
