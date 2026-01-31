export const formatDate = (dateString: string): string => {
  const parts = dateString.split("/");
  const day = parts[0] || "1";
  const month = parts[1] || "1";
  const year = parts[2] || "2025";

  const date = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  );

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};
