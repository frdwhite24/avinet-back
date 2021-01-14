import { Hour } from "../types";

export const getFlightTitle = (timeOfDay: Hour): string => {
  let title: string;
  if (timeOfDay >= 5 && timeOfDay < 12) {
    title = "Morning flight";
  } else if (timeOfDay >= 12 && timeOfDay < 18) {
    title = "Afternoon flight";
  } else if (timeOfDay >= 18 && timeOfDay < 22) {
    title = "Evening flight";
  } else if (timeOfDay >= 22 || timeOfDay < 5) {
    title = "Night flight";
  } else {
    title = "Flight";
  }
  return title;
};
