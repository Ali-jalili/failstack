export const stageColors: Record<string, string> = {
  TRIGGER: "#fb7185",
  FAILURE: "#fbbf24",
  PROPAGATION: "#fb7185",
  IMPACT: "#fb7185",
  DETECTION: "#fbbf24",
  MITIGATION: "#a78bfa",
  ROOT_CAUSE: "#fbbf24",
  PREVENTION: "#34d399",
  RECOVERY: "#60a5fa",
};

export function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function patternLabel(value: string) {
  return label(value).replace(/\b\w/g, (character) => character.toUpperCase());
}

export function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function dateTimeLabel(value: string) {
  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

export function durationLabel(value: number) {
  if (value < 60) return value + " min";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? hours + "h " + minutes + "m" : hours + "h";
}

export function offsetClockLabel(occurredAt: string, offset: number) {
  const base = new Date(occurredAt).getTime();
  const time = new Date(base + offset * 60000);
  return time.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

export function short(value: string, max: number) {
  return value.length > max ? value.slice(0, max) + "…" : value;
}

export function wrapSvgLabel(value: string, maxChars: number) {
  const lines: string[] = [];
  for (const word of value.trim().split(/\s+/)) {
    const last = lines.length - 1;
    if (last >= 0 && `${lines[last]} ${word}`.length <= maxChars) {
      lines[last] += ` ${word}`;
    } else if (lines.length < 2) {
      lines.push(short(word, maxChars));
    } else {
      lines[1] = short(lines[1], maxChars - 1);
      break;
    }
  }
  return lines;
}

