import { GraphQLSchema } from "graphql";
import { buildSchema } from "type-graphql";
import { FlightResolvers } from "./flights/resolvers";
import { UserRegisterResolver } from "./users/Register/resolvers";
import { UserSocialResolvers } from "./users/Social/resolvers";

export default async (): Promise<GraphQLSchema> =>
  await buildSchema({
    resolvers: [UserRegisterResolver, UserSocialResolvers, FlightResolvers],
    validate: false,
  });
