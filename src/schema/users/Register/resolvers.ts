/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { hash, verify as passwordVerify } from "argon2";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { sign } from "jsonwebtoken";

import { JWT_SECRET, MIN_PASSWORD_LENGTH } from "../../../utils/config";
import { UserModel } from "../model";
import { UpdateUserInput, UserResponse } from "../types";
import { MyContext } from "../../../types";
import { isError } from "../../../utils/typeGuards";
import {
  userExistsError,
  incorrectPasswordError,
  missingDocError,
  mutationFailedError,
  notAuthorisedError,
  passwordTooShortError,
  missingInvalidTokenError,
} from "../../../utils/errorMessages";
import { getAllUsers, getUser } from "../services";

@Resolver()
export class UserRegisterResolver {
  @Query(() => UserResponse)
  async getAllUsers() {
    // TODO: Add auth which requires admin role to carry out this query
    return {
      users: await getAllUsers(),
    };
  }

  @Query(() => UserResponse)
  async getUser(@Arg("username") username: string) {
    // TODO: Add auth which requires admin role to carry out this query
    const user = await getUser(username);
    if (!user) return missingDocError("User");
    return {
      user,
    };
  }

  @Query(() => UserResponse)
  async whoAmI(@Ctx() { currentUser }: MyContext) {
    return currentUser
      ? { user: await getUser(currentUser.username) }
      : missingInvalidTokenError();
  }

  @Mutation(() => UserResponse)
  async createUser(
    @Arg("username") username: string,
    @Arg("password") password: string
  ) {
    const existingUser = await getUser(username);
    if (existingUser) return userExistsError();

    if (password.length < MIN_PASSWORD_LENGTH) return passwordTooShortError();

    const hashedPassword = await hash(password);
    const user = new UserModel({
      username: username,
      password: hashedPassword,
    });

    try {
      await user.save();
    } catch (error) {
      if (isError(error)) {
        if (process.env.NODE_ENV !== "production") {
          return {
            errors: [{ type: "user error", message: error.message }],
          };
        } else {
          return mutationFailedError("User");
        }
      }
    }

    const userForToken = {
      username: user.username,
      id: user._id.toString(),
    };
    const token = sign(userForToken, JWT_SECRET);

    return {
      user,
      token,
    };
  }

  @Mutation(() => UserResponse)
  async deleteUser(
    @Arg("username") username: string,
    @Ctx() { currentUser }: MyContext
  ) {
    if (!currentUser) return notAuthorisedError();

    const userToDelete = await getUser(username);
    if (!userToDelete) return missingDocError("User");

    if (userToDelete.username !== currentUser.username)
      return notAuthorisedError();

    try {
      await UserModel.findByIdAndDelete(userToDelete._id);
    } catch (error) {
      if (isError(error)) {
        if (process.env.NODE_ENV !== "production") {
          return {
            errors: [{ type: "user error", message: error.message }],
          };
        } else {
          return mutationFailedError("User");
        }
      }
    }

    return {
      user: userToDelete,
    };
  }

  @Mutation(() => UserResponse)
  async loginUser(
    @Arg("username") username: string,
    @Arg("password") password: string
  ) {
    const user = await getUser(username);
    if (!user) return missingDocError("User");

    const valid = await passwordVerify(user.password, password);
    if (!valid) return incorrectPasswordError();

    const userForToken = {
      username: user.username,
      id: user._id.toString(),
    };
    const token = sign(userForToken, JWT_SECRET);

    return { token };
  }

  @Mutation(() => UserResponse)
  async updateUser(
    @Arg("username") username: string,
    @Arg("options") options: UpdateUserInput,
    @Ctx() { currentUser }: MyContext
  ) {
    if (!currentUser) return notAuthorisedError();

    const userToUpdate = await getUser(username);
    if (!userToUpdate) return missingDocError("User");

    if (userToUpdate.username !== currentUser.username)
      return notAuthorisedError();

    let updatedUser;
    try {
      updatedUser = await UserModel.findByIdAndUpdate(
        userToUpdate._id,
        { ...options },
        { new: true }
      );
    } catch (error) {
      if (isError(error)) {
        if (process.env.NODE_ENV !== "production") {
          return {
            errors: [{ type: "user error", message: error.message }],
          };
        } else {
          return mutationFailedError("User");
        }
      }
    }

    return {
      user: updatedUser,
    };
  }

  @Mutation(() => UserResponse)
  async updateUsername(
    @Arg("username") username: string,
    @Arg("newUsername") newUsername: string,
    @Ctx() { currentUser }: MyContext
  ) {
    if (!currentUser) return notAuthorisedError();

    const userToUpdate = await getUser(username);
    if (!userToUpdate) return missingDocError("User");

    if (userToUpdate.username !== currentUser.username)
      return notAuthorisedError();

    userToUpdate.username = newUsername;

    try {
      await userToUpdate.save();
    } catch (error) {
      if (isError(error)) {
        if (process.env.NODE_ENV !== "production") {
          return {
            errors: [{ type: "user error", message: error.message }],
          };
        } else {
          return mutationFailedError("User");
        }
      }
    }

    const userForToken = {
      username: userToUpdate.username,
      id: userToUpdate._id.toString(),
    };

    const token = sign(userForToken, JWT_SECRET);

    return { token, user: userToUpdate };
  }

  @Mutation(() => UserResponse)
  async updatePassword(
    @Arg("password") currentPassword: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { currentUser }: MyContext
  ) {
    if (!currentUser) return notAuthorisedError();

    const valid = await passwordVerify(currentUser.password, currentPassword);
    if (!valid) return incorrectPasswordError();

    if (newPassword.length < MIN_PASSWORD_LENGTH)
      return passwordTooShortError();

    const hashedPassword = await hash(newPassword);

    let updatedUser;
    try {
      updatedUser = await UserModel.findByIdAndUpdate(
        currentUser._id,
        { password: hashedPassword },
        { new: true }
      );
    } catch (error) {
      if (isError(error)) {
        if (process.env.NODE_ENV !== "production") {
          return {
            errors: [{ type: "user error", message: error.message }],
          };
        } else {
          return mutationFailedError("User");
        }
      }
    }

    if (!updatedUser) return mutationFailedError("User");

    return { user: updatedUser };
  }
}
