import { connect, disconnect } from "../../../database";
import { graphqlRequest } from "../../../test-utils/graphqlRequest";
import { generateUsers } from "../../../test-utils/generators";
import { UserModel } from "../model";

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
});

afterAll(async () => {
  await disconnect();
});

describe("User social resolvers", () => {
  test("query getting followers", async () => {
    // Database and user setup
    const { dbUsers, cleanedUsers } = await generateUsers(2);

    dbUsers[0].following.push(dbUsers[1]._id);
    dbUsers[1].followers.push(dbUsers[0]._id);
    await dbUsers[0].save();
    await dbUsers[1].save();

    // Request;
    const getFollowers = `
      query {
        getFollowers {
          users {
            username
            firstName
            lastName
            emailAddress
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: getFollowers,
      currentUser: dbUsers[1],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        getFollowers: {
          users: [cleanedUsers[0]],
        },
      },
    });
  });

  test("query getting following", async () => {
    // Database and user setup
    const { dbUsers, cleanedUsers } = await generateUsers(2);

    dbUsers[0].following.push(dbUsers[1]._id);
    dbUsers[1].followers.push(dbUsers[0]._id);
    await dbUsers[0].save();
    await dbUsers[1].save();

    // Request;
    const getFollowing = `
      query {
        getFollowing {
          users {
            username
            firstName
            lastName
            emailAddress
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: getFollowing,
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        getFollowing: {
          users: [cleanedUsers[1]],
        },
      },
    });
  });

  test("mutation following a user", async () => {
    // Database and user setup
    const { dbUsers, cleanedUsers } = await generateUsers(2);

    // Request
    const followUser = `
      mutation followUser($username: String!) {
        followUser(username: $username) {
          user {
            username
            firstName
            lastName
            emailAddress
            following {
              username
            }
            followers {
              username
            }
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: followUser,
      variableValues: {
        username: cleanedUsers[1].username,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        followUser: {
          user: {
            ...cleanedUsers[0],
            following: [{ username: cleanedUsers[1].username }],
            followers: [],
          },
        },
      },
    });

    // Database check
    const allUsers = await UserModel.find({}).lean();
    const followingUser = allUsers.find(
      (user) => user.username === cleanedUsers[0].username
    );
    const followedUser = allUsers.find(
      (user) => user.username === cleanedUsers[1].username
    );
    expect(followingUser?.following).toEqual([followedUser?._id]);
    expect(followedUser?.followers).toEqual([followingUser?._id]);
  });

  test("mutation following a user fails", async () => {
    // Database and user setup
    const { dbUsers, cleanedUsers } = await generateUsers(2);

    dbUsers[0].following.push(dbUsers[1]._id);
    dbUsers[1].followers.push(dbUsers[0]._id);
    await dbUsers[0].save();
    await dbUsers[1].save();

    // Request
    const followUser = `
      mutation followUser($username: String!) {
        followUser(username: $username) {
          errors {
            message
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: followUser,
      variableValues: {
        username: cleanedUsers[1].username,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        followUser: {
          errors: [{ message: "Already following this user." }],
        },
      },
    });

    // Database check
    const allUsers = await UserModel.find({}).lean();
    const followingUser = allUsers.find(
      (user) => user.username === cleanedUsers[0].username
    );
    const followedUser = allUsers.find(
      (user) => user.username === cleanedUsers[1].username
    );
    expect(followingUser?.following).toEqual([followedUser?._id]);
    expect(followedUser?.followers).toEqual([followingUser?._id]);
  });

  test("mutation unfollowing a user", async () => {
    // Database and user setup
    const { dbUsers, cleanedUsers } = await generateUsers(2);

    dbUsers[0].following.push(dbUsers[1]._id);
    dbUsers[1].followers.push(dbUsers[0]._id);
    await dbUsers[0].save();
    await dbUsers[1].save();

    // Request
    const unfollowUser = `
      mutation unfollowUser($username: String!) {
        unfollowUser(username: $username) {
          user {
            username
            firstName
            lastName
            emailAddress
            following {
              username
            }
            followers {
              username
            }
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: unfollowUser,
      variableValues: {
        username: cleanedUsers[1].username,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        unfollowUser: {
          user: {
            ...cleanedUsers[0],
            following: [],
            followers: [],
          },
        },
      },
    });

    // Database check
    const allUsers = await UserModel.find({}).lean();
    const followingUser = allUsers.find(
      (user) => user.username === cleanedUsers[0].username
    );
    const followedUser = allUsers.find(
      (user) => user.username === cleanedUsers[1].username
    );
    expect(followingUser?.following).toEqual([]);
    expect(followedUser?.followers).toEqual([]);
  });

  test("mutation unfollowing a user fails", async () => {
    // Database and user setup
    const { dbUsers, cleanedUsers } = await generateUsers(2);

    // Request
    const unfollowUser = `
      mutation unfollowUser($username: String!) {
        unfollowUser(username: $username) {
          errors {
            message
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: unfollowUser,
      variableValues: {
        username: cleanedUsers[1].username,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        unfollowUser: {
          errors: [{ message: "Not following this user." }],
        },
      },
    });
  });

  test("mutation remove follower", async () => {
    // Database and user setup
    const { dbUsers, cleanedUsers } = await generateUsers(2);

    dbUsers[0].following.push(dbUsers[1]._id);
    dbUsers[1].followers.push(dbUsers[0]._id);
    await dbUsers[0].save();
    await dbUsers[1].save();

    // Request
    const removeFollower = `
      mutation removeFollower($username: String!) {
        removeFollower(username: $username) {
          user {
            username
            firstName
            lastName
            emailAddress
            following {
              username
            }
            followers {
              username
            }
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: removeFollower,
      variableValues: {
        username: dbUsers[0].username,
      },
      currentUser: dbUsers[1],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        removeFollower: {
          user: {
            ...cleanedUsers[1],
            following: [],
            followers: [],
          },
        },
      },
    });

    // Database check
    const allUsers = await UserModel.find({}).lean();
    const followingUser = allUsers.find(
      (user) => user.username === cleanedUsers[0].username
    );
    const followedUser = allUsers.find(
      (user) => user.username === cleanedUsers[1].username
    );
    expect(followingUser?.following).toEqual([]);
    expect(followedUser?.followers).toEqual([]);
  });

  test("mutation remove follower fails to self", async () => {
    // Database and user setup
    const { dbUsers } = await generateUsers();

    // Request
    const removeFollower = `
      mutation removeFollower($username: String!) {
        removeFollower(username: $username) {
          errors {
            message
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: removeFollower,
      variableValues: {
        username: dbUsers[0].username,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        removeFollower: {
          errors: [{ message: "Cannot carry out this action on yourself." }],
        },
      },
    });
  });

  test("mutation remove follower fails missing user", async () => {
    // Database and user setup
    const { dbUsers } = await generateUsers();

    // Request
    const removeFollower = `
      mutation removeFollower($username: String!) {
        removeFollower(username: $username) {
          errors {
            message
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: removeFollower,
      variableValues: {
        username: "madeUpUser",
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        removeFollower: {
          errors: [{ message: "User doesn't exist." }],
        },
      },
    });
  });

  test("mutation remove follower fails not following user", async () => {
    // Database and user setup
    const { dbUsers } = await generateUsers(2);

    // Request
    const removeFollower = `
      mutation removeFollower($username: String!) {
        removeFollower(username: $username) {
          errors {
            message
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: removeFollower,
      variableValues: {
        username: dbUsers[1].username,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        removeFollower: {
          errors: [{ message: "This user is not a follower." }],
        },
      },
    });
  });
});
