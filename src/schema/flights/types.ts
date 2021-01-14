import { Field, InputType, ObjectType } from "type-graphql/dist/decorators";
import { ResponseError } from "../types";
import { Flight } from "./model";

// @ObjectType()
// export class Coordinate {
//   @Field()
//   latitude!: number;
//   @Field()
//   longitude!: number;
// }

@ObjectType()
export class FlightResponse {
  @Field(() => [ResponseError], { nullable: true })
  errors?: Error[];

  @Field(() => Flight, { nullable: true })
  flight?: Flight;

  @Field(() => [Flight], { nullable: true })
  flights?: Flight[];
}

@InputType()
export class FlightInfoInput {
  @Field()
  flightTimeDate!: Date;

  @Field()
  totalFlightTime?: number;

  @Field({ nullable: true })
  title?: string;
}
