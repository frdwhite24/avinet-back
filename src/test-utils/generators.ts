import { DocumentType } from "@typegoose/typegoose";
import { hash } from "argon2";
import faker from "faker";
import { Flight, FlightModel } from "../schema/flights/model";
import { User, UserModel } from "../schema/users/model";
import { getFlightTitle } from "../utils/helpers";
import { isHour } from "../utils/typeGuards";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const generateUsers = async (numUsers = 1) => {
  const users = [];
  const dbUsers: DocumentType<User>[] = [];
  const cleanedUsers = [];

  for (let i = 0; i < numUsers; i++) {
    // This is an object within array so the password key can be easily removed
    // by mapping through the array entries.
    const user = [
      {
        username: faker.internet.userName(),
        password: faker.internet.password(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        emailAddress: faker.internet.email(),
      },
    ];
    users.push(user[0]);

    cleanedUsers.push(user.map(({ password: _password, ...rest }) => rest)[0]);

    const newUser = new UserModel({
      username: user[0].username,
      password: await hash(user[0].password),
      firstName: user[0].firstName,
      lastName: user[0].lastName,
      emailAddress: user[0].emailAddress,
    });
    dbUsers.push(newUser);

    await newUser.save();
  }

  return { users, dbUsers, cleanedUsers };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const generateFlights = async (numFlights = 1) => {
  const { dbUsers } = await generateUsers(numFlights);

  const flights = [];
  const dbFlights: DocumentType<Flight>[] = [];

  for (let i = 0; i < numFlights; i++) {
    const flightDate = faker.date.past();
    const flightHours = flightDate.getHours();

    if (!isHour(flightHours)) {
      throw new Error("Unable to extract date from faked date object.");
    }

    const flight = {
      flightTimeDate: flightDate,
      totalFlightTime: Math.floor(Math.random() * 6),
      title: getFlightTitle(flightHours),
    };
    flights.push(flight);

    const newFlight = new FlightModel({
      ...flight,
      createdBy: dbUsers[Math.floor(Math.random() * numFlights)]._id,
    });
    dbFlights.push(newFlight);

    await newFlight.save();
  }

  return { flights, dbFlights, dbUsers };
};
