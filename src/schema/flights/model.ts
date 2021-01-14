import { prop, getModelForClass, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Field, ID, ObjectType } from "type-graphql";
import { User } from "../users/model";
// import { Coordinate } from "./types";

@ObjectType()
export class Flight {
  @Field(() => ID, { nullable: true })
  _id!: mongoose.Types.ObjectId;

  @Field(() => [User], { nullable: true })
  @prop({ required: true, ref: User })
  public createdBy?: Ref<User>[];

  @Field({ nullable: true })
  @prop({ required: true, type: Date })
  public flightTimeDate!: Date;

  @Field({ nullable: true })
  @prop({ required: true })
  public title?: string;

  @Field({ nullable: true })
  @prop()
  public totalFlightTime?: number;

  @Field({ nullable: true })
  @prop()
  public operatingCapacity?: string;

  @Field({ nullable: true })
  @prop()
  public nightFlightTime?: number;

  @Field({ nullable: true })
  @prop()
  public instrumentFlightTime?: number;

  @Field({ nullable: true })
  @prop()
  public otherFlightTime?: number;

  @Field({ nullable: true })
  @prop()
  public aircraftType?: string;

  @Field({ nullable: true })
  @prop()
  public aircraftReg?: string;

  @Field({ nullable: true })
  @prop()
  public departureAerodrome?: string;

  @Field({ nullable: true })
  @prop()
  public destinationAerodrome?: string;

  // @Field(() => [Coordinate], { nullable: true })
  // @prop()
  // public viaLocations?: Array<Coordinate>;

  @Field({ nullable: true })
  @prop()
  public takeOffs?: number;

  @Field({ nullable: true })
  @prop()
  public landings?: number;

  @Field({ nullable: true })
  @prop()
  public remarks?: string;
}

export const FlightModel = getModelForClass(Flight);
