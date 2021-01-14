/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
} from "type-graphql/dist/decorators";
import { MyContext } from "../../types";
import {
  invalidDate,
  missingDocError,
  mutationFailedError,
  notAuthorisedError,
} from "../../utils/errorMessages";
import { getFlightTitle } from "../../utils/helpers";
import { isError, isHour } from "../../utils/typeGuards";
import { FlightModel } from "./model";
import { getAllFlights, getFlight } from "./services";
import { FlightInfoInput, FlightResponse } from "./types";

@Resolver()
export class FlightResolvers {
  @Query(() => FlightResponse)
  async getAllFlights() {
    // TODO: Add auth which requires admin role to carry out this query
    return {
      flights: await getAllFlights(),
    };
  }

  @Query(() => FlightResponse)
  async getFlight(@Arg("id") id: string) {
    // TODO: Add auth which requires admin role to carry out this query
    const flight = await getFlight(id);
    if (!flight) return missingDocError("flight");
    return {
      flight,
    };
  }

  @Mutation(() => FlightResponse)
  async createFlight(
    @Arg("options") options: FlightInfoInput,
    @Ctx() { currentUser }: MyContext
  ) {
    if (!currentUser) return notAuthorisedError();
    const timeOfDay = options.flightTimeDate.getHours();

    let title: string;
    if (!options.title) {
      if (isHour(timeOfDay)) {
        title = getFlightTitle(timeOfDay);
      } else {
        return invalidDate();
      }
    } else {
      title = options.title;
    }

    // TODO: implement a fetch to a weather API for time and loc of flight

    const newFlight = new FlightModel({
      ...options,
      createdBy: currentUser._id,
      title,
    });

    try {
      await newFlight.save();
    } catch (error) {
      if (isError(error)) {
        if (process.env.NODE_ENV !== "production") {
          return {
            errors: [{ type: "user error", message: error.message }],
          };
        } else {
          return mutationFailedError("flight");
        }
      }
    }

    const updatedFlight = await getFlight(newFlight._id.toString());

    return {
      flight: updatedFlight,
    };
  }
}
