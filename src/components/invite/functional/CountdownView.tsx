"use client";

import { useEffect, useMemo, useState } from "react";
import type { InvitePartStyle } from "@/lib/invite-builder";
import { partStyleFromConfig } from "@/components/invite/renderer/visual-style";

function remaining(target: string, now: number) {
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownView({
  target,
  parts = {},
  initialNow,
}: {
  target: string;
  parts?: Record<string, InvitePartStyle>;
  initialNow?: number;
}) {
  const [time, setTime] = useState(() =>
    initialNow
      ? remaining(target, initialNow)
      : { days: 0, hours: 0, minutes: 0, seconds: 0 }
  );

  useEffect(() => {
    const update = () => setTime(remaining(target, Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const units = useMemo(
    () => [
      ["dias", time.days],
      ["horas", time.hours],
      ["min", time.minutes],
      ["seg", time.seconds],
    ] as const,
    [time]
  );

  return (
    <div data-part="countdown" style={partStyleFromConfig(parts.countdown)}>
      {units.map(([label, value]) => (
        <div key={label} data-part="unit" style={partStyleFromConfig(parts.unit)}>
          <strong data-part="number" style={partStyleFromConfig(parts.number)}>
            {String(value).padStart(2, "0")}
          </strong>
          <span data-part="label" style={partStyleFromConfig(parts.label)}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
