import { getFlightTitle } from "./helpers";

describe("Getting correct default flight title", () => {
  test("for the early hours", () => {
    const response = getFlightTitle(3);
    expect(response).toBe("Night flight");
  });

  test("for the early morning", () => {
    const response = getFlightTitle(7);
    expect(response).toBe("Morning flight");
  });

  test("for the late morning", () => {
    const response = getFlightTitle(11);
    expect(response).toBe("Morning flight");
  });

  test("for the early afternoon", () => {
    const response = getFlightTitle(13);
    expect(response).toBe("Afternoon flight");
  });

  test("for the late afternoon", () => {
    const response = getFlightTitle(17);
    expect(response).toBe("Afternoon flight");
  });

  test("for the evening", () => {
    const response = getFlightTitle(19);
    expect(response).toBe("Evening flight");
  });

  test("for the night", () => {
    const response = getFlightTitle(23);
    expect(response).toBe("Night flight");
  });
});
