import { Hour } from "../types";

export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const isHour = (hour: number): hour is Hour => {
  return hour >= 0 && hour <= 23;
};
