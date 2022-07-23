export const percentFrom = (from: number, to: number) =>
  Math.round((from / to) * 100);

export const isNumber = (number: number) => !isNaN(number);

export const maxPagesFor = (amount: number, itemsPerPage: number) =>
  Math.max(1, Math.ceil(amount / itemsPerPage));
