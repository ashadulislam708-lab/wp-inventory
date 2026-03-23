export const formatBDT = (amount: number | null | undefined): string => {
  if (amount == null) return '0 BDT';
  return `${amount.toLocaleString("en-BD")} BDT`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const bstDate = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  return bstDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const bstDate = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  return bstDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
};

export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

export const maskUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const parts = host.split(".");
    if (parts.length >= 2) {
      const domain = parts.slice(-2).join(".");
      const masked = domain.replace(/^.{0,}(?=\..+$)/, (match) =>
        match.length > 3
          ? match.substring(0, 3) + "***"
          : "***"
      );
      return `${parsed.protocol}//${masked}`;
    }
    return `${parsed.protocol}//******`;
  } catch {
    return "******";
  }
};
