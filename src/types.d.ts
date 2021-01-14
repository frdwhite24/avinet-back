import { DocumentType } from "@typegoose/typegoose";
import { Types } from "mongoose";
import { User } from "./schema/users/model";

type MyContext = {
  currentUser: DocumentType<User> | null;
};

type MyToken = {
  id: Types.ObjectId;
  username: string;
};

type Hour =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23;
