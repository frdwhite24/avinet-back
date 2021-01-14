import { DocumentType } from "@typegoose/typegoose";
import { Flight, FlightModel } from "./model";

export const getFlight = async (
  id: string,
  populate = true
): Promise<DocumentType<Flight> | null> => {
  if (populate) {
    return await FlightModel.findById(id).populate("createdBy");
  }
  return await FlightModel.findById(id);
};

export const getAllFlights = async (): Promise<
  DocumentType<Flight>[] | null
> => {
  return await FlightModel.find({}).populate("createdBy");
};
