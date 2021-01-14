import faker from "faker";
import { connect, disconnect } from "../../database";
import { generateFlights, generateUsers } from "../../test-utils/generators";
import { graphqlRequest } from "../../test-utils/graphqlRequest";
import { getFlightTitle } from "../../utils/helpers";
import { isHour } from "../../utils/typeGuards";
import { FlightModel } from "./model";

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await FlightModel.deleteMany({});
});

afterAll(async () => {
  await disconnect();
});

describe("Querying flights", () => {
  test("to get all flights", async () => {
    // Database setup
    const { flights } = await generateFlights(3);

    // Request
    const getAllFlights = `
      query {
        getAllFlights {
          flights {
            totalFlightTime
            title
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: getAllFlights,
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        getAllFlights: {
          flights: flights.map((flight) => {
            return {
              totalFlightTime: flight.totalFlightTime,
              title: flight.title,
            };
          }),
        },
      },
    });
  });

  test("to get one flight", async () => {
    // Database setup
    const { dbFlights } = await generateFlights(3);

    // Request
    const getFlight = `
      query getFlight($id: String!){
        getFlight(id: $id) {
          flight {
            _id
            totalFlightTime
            title
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: getFlight,
      variableValues: {
        id: dbFlights[1]._id.toString(),
      },
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        getFlight: {
          flight: {
            _id: dbFlights[1]._id.toString(),
            totalFlightTime: dbFlights[1].totalFlightTime,
            title: dbFlights[1].title,
          },
        },
      },
    });
  });
});

describe("Mutating flights", () => {
  test("to create a flight with custom title", async () => {
    // Database setup
    const { dbUsers } = await generateUsers();

    const options = {
      flightTimeDate: "2018-12-25, 12:30",
      totalFlightTime: Math.floor(Math.random() * 6),
      title: faker.lorem.sentence(),
    };

    // Request
    const createFlight = `
      mutation createFlight($options: FlightInfoInput!){
        createFlight(options: $options) {
          flight {
            totalFlightTime
            title
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: createFlight,
      variableValues: {
        options,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        createFlight: {
          flight: {
            totalFlightTime: options.totalFlightTime,
            title: options.title,
          },
        },
      },
    });
  });

  test("to create a flight with default time based title", async () => {
    // Database setup
    const { dbUsers } = await generateUsers();
    const flightTime = "2018-12-25, 12:30";
    const flightHours = new Date(flightTime).getHours();

    if (!isHour(flightHours)) {
      throw new Error("Unable to extract date from faked date object.");
    }
    const expectedTitle = getFlightTitle(flightHours);

    const options = {
      flightTimeDate: flightTime,
      totalFlightTime: Math.floor(Math.random() * 6),
    };

    // Request
    const createFlight = `
      mutation createFlight($options: FlightInfoInput!){
        createFlight(options: $options) {
          flight {
            totalFlightTime
            title
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: createFlight,
      variableValues: {
        options,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        createFlight: {
          flight: {
            totalFlightTime: options.totalFlightTime,
            title: expectedTitle,
          },
        },
      },
    });
  });
});
