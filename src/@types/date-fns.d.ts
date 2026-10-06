declare module 'date-fns' {
  export function differenceInDays(dateLeft: Date | number | string, dateRight: Date | number | string): number;
  export function endOfMonth(date: Date | number | string): Date;
  export function format(date: Date | number | string, formatStr: string, options?: any): string;
  export function parse(dateString: string, formatString: string, referenceDate: Date | number, options?: any): Date;
  export function addDays(date: Date | number | string, amount: number): Date;
  export function addMonths(date: Date | number | string, amount: number): Date;
  export function isAfter(date: Date | number | string, dateToCompare: Date | number | string): boolean;
  export function isBefore(date: Date | number | string, dateToCompare: Date | number | string): boolean;
  export function isValid(date: any): boolean;
}
