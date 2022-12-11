export const Numbers = {
  percentFrom: (from: number, to: number) => Math.round((from / to) * 100),
  isNumber: (number: number) => !isNaN(number),
  maxPagesFor: (pages: number, itemsEachPage: number) => Math.max(1, Math.ceil(pages / itemsEachPage))
};
