export function toISODateInput(value, fallbackISO) {
  try {
    if (!value) return fallbackISO;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return fallbackISO;
    return d.toISOString().slice(0, 10);
  } catch {
    return fallbackISO;
  }
}

export function formatDateBR(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}
