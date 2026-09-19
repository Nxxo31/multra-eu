export const todayISO = () => new Date().toISOString().slice(0, 10);

export const nowSql = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) =>
  Math.ceil((new Date(a) - new Date(b)) / 86400000);

export const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
};
