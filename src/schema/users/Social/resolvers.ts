/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

import { UserResponse } from "../types";
import { MyContext } from "../../../types";
import { isError } from "../../../utils/typeGuards";
import {
  alreadyFollowingError,
  missingFollowerError,
  missingDocError,
  mutationFailedError,
  notAuthorisedError,
  notFollowingError,
  notToSelfError,
} from "../../../utils/errorMessages";
import { getUser } from "../services";

@Resolver()
export class UserSocialResolvers {
  @Query(() => UserResponse)
  async getFollowers(@Ctx() { currentUser }: MyContext) {
    if (!currentUser) return notAuthorisedError();

    const user = await getUser(currentUser.username);
    if (!user) return missingDocError("User");

    return {
      users: user.followers,
    };
  }

  @Query(() => UserResponse)
  async getFollowing(@Ctx() { currentUser }: MyContext) {
    if (!currentUser) return notAuthorisedError();

    const user = await getUser(currentUser.username);
    if (!user) return missingDocError("User");

    return {
      users: user.following,
    };
  }

  @Mutation(() => UserResponse)
  async followUser(
    @Arg("username") username: string,
    @Ctx() { currentUser }: MyContext
  ) {
    if (!currentUser) return notAuthorisedError();
    if (currentUser.username === username) return notToSelfError();

    const userToFollow = await getUser(username, false);
    if (!userToFollow) return missingDocError("User");

    if (
      userToFollow.followers?.find((follower) => {
        if (!follower) {
          return;
        }
        return follower.toString() === currentUser._id.toString();
      })
    )
      return alreadyFollowingError();

    userToFollow.followers?.push(currentUser._id);
    currentUser.following?.push(userToFollow._id);

    try {
      await userToFollow.save();
      await currentUser.save();
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

    // This should be improved, it's a long standing issue with mongoose not
    // being able to repopulate a saved document and so an extra db query
    // must be carried out to send in the response
    // TODO: Find a better way to do this rather than carry out extra DB query
    const newUserFollowing = await getUser(currentUser.username);
    if (!newUserFollowing) return missingDocError("User");

    return {
      user: newUserFollowing,
    };
  }

  @Mutation(() => UserResponse)
  async unfollowUser(
    @Arg("username") username: string,
    @Ctx() { currentUser }: MyContext
  ) {
    if (!currentUser) return notAuthorisedError();
    if (currentUser.username === username) return notToSelfError();

    const userToUnfollow = await getUser(username, false);
    if (!userToUnfollow) return missingDocError("User");

    // TODO: clean up this find block
    if (
      !userToUnfollow.followers?.find((follower) => {
        if (!follower) {
          return;
        }
        return follower.toString() === currentUser._id.toString();
      })
    )
      return notFollowingError();

    // Filter out userId, as per above TODO, this needs to be handled cleaner,
    // the problem is because the followers and following array can be [] and
    // so the variable within array methods can be undefined requiring the
    // extra if statement
    userToUnfollow.followers = userToUnfollow.followers.filter((userId) => {
      if (userId) {
        return userId.toString() !== currentUser._id.toString();
      }
      return;
    });
    currentUser.following = currentUser.following.filter((userId) => {
      if (userId) {
        return userId.toString() !== userToUnfollow._id.toString();
      }
      return;
    });

    try {
      await userToUnfollow.save();
      await currentUser.save();
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

    // This should be improved, it's a long standing issue with mongoose not
    // being able to repopulate a saved document and so an extra db query
    // must be carried out to send in the response object
    // TODO: Find a better way to do this rather than carry out extra DB query
    const updatedCurrentUser = await getUser(currentUser.username);
    if (!updatedCurrentUser) return missingDocError("User");

    return {
      user: updatedCurrentUser,
    };
  }

  @Mutation(() => UserResponse)
  async removeFollower(
    @Arg("username") username: string,
    @Ctx() { currentUser }: MyContext
  ) {
    if (!currentUser) return notAuthorisedError();
    if (currentUser.username === username) return notToSelfError();

    const userToRemove = await getUser(username, false);
    if (!userToRemove) return missingDocError("User");

    // TODO: clean up this find block
    if (
      !currentUser.followers.find((follower) => {
        if (!follower) {
          return;
        }
        return follower.toString() === userToRemove._id.toString();
      })
    )
      return missingFollowerError();

    // Filter out userId, as per above TODO, this needs to be handled cleaner,
    // the problem is because the followers and following array can be [] and
    // so the variable within array methods can be undefined requiring the
    // extra if statement
    userToRemove.following = userToRemove.following.filter((userId) => {
      if (!userId) {
        return;
      }
      return userId.toString() !== currentUser._id.toString();
    });
    currentUser.followers = currentUser.followers.filter((userId) => {
      if (!userId) {
        return;
      }
      return userId.toString() !== userToRemove._id.toString();
    });

    try {
      await userToRemove.save();
      await currentUser.save();
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

    // This should be improved, it's a long standing issue with mongoose not
    // being able to repopulate a saved document and so an extra db query
    // must be carried out to send in the response object
    // TODO: Find a better way to do this rather than carry out extra DB query
    const updatedCurrentUser = await getUser(currentUser.username);
    if (!updatedCurrentUser) return missingDocError("User");

    return {
      user: updatedCurrentUser,
    };
  }
}
