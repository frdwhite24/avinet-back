import faker from "faker";
import { verify as passwordVerify } from "argon2";
import { verify } from "jsonwebtoken";
import { connect, disconnect } from "../../../database";
import { graphqlRequest } from "../../../test-utils/graphqlRequest";
import { generateUsers } from "../../../test-utils/generators";
import { MyToken } from "../../../types";
import { JWT_SECRET, MIN_PASSWORD_LENGTH } from "../../../utils/config";
import { User, UserModel } from "../model";
import { DocumentType } from "@typegoose/typegoose";

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
});

afterAll(async () => {
  await disconnect();
});

describe("User register resolvers", () => {
  test("query getting all users", async () => {
    // Database setup
    const { cleanedUsers } = await generateUsers(3);

    // Request
    const getAllUsers = `
      query {
        getAllUsers {
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
      source: getAllUsers,
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        getAllUsers: {
          users: cleanedUsers,
        },
      },
    });

    // Database check
    const allUsers = await UserModel.find({});
    cleanedUsers.forEach((user) => {
      expect(allUsers).toEqual(
        expect.arrayContaining([expect.objectContaining(user)])
      );
    });
  });

  test("query getting one user", async () => {
    // Database setup
    const { cleanedUsers } = await generateUsers(2);

    // Request
    const getUser = `
      query getUser($username: String!) {
        getUser(username: $username) {
          user {
            username
            firstName
            lastName
            emailAddress
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: getUser,
      variableValues: {
        username: cleanedUsers[0].username,
      },
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        getUser: {
          user: cleanedUsers[0],
        },
      },
    });
  });

  test("query getting one user fails", async () => {
    // Database setup
    await generateUsers(2);

    // Request
    const getUser = `
      query getUser($username: String!) {
        getUser(username: $username) {
          errors {
            message
          }
        }
      }
    `;
    const response = await graphqlRequest({
      source: getUser,
      variableValues: {
        username: "madeUpUser",
      },
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        getUser: {
          errors: [{ message: "User doesn't exist." }],
        },
      },
    });
  });

  test("query who am I", async () => {
    // Database setup
    const { cleanedUsers, dbUsers } = await generateUsers();

    // Request
    const whoAmI = `
      query {
        whoAmI {
          user {
            username
            firstName
            lastName
            emailAddress
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: whoAmI,
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        whoAmI: {
          user: cleanedUsers[0],
        },
      },
    });
  });

  test("mutation create user", async () => {
    const user = {
      username: faker.internet.userName(),
      password: faker.internet.password(),
    };

    // Request
    const createUser = `
      mutation createUser(
        $username: String!
        $password: String!
        ) {
        createUser(username: $username, password: $password) {
          user {
            username
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: createUser,
      variableValues: { username: user.username, password: user.password },
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        createUser: {
          user: { username: user.username },
        },
      },
    });

    // Database check
    const dbUser = await UserModel.findOne({ username: user.username });
    expect(dbUser).toBeDefined();
    expect(dbUser?.username).toEqual(user.username);
  });

  test("mutation create user returns valid token", async () => {
    const user = {
      username: faker.internet.userName(),
      password: faker.internet.password(),
    };

    // Request
    const createUser = `
      mutation createUser(
        $username: String!
        $password: String!
        ) {
        createUser(username: $username, password: $password) {
          token
        }
      }
    `;

    const response = await graphqlRequest({
      source: createUser,
      variableValues: { username: user.username, password: user.password },
    });

    // Response check
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const token = response.data?.createUser.token as string;
    const decodedToken = verify(token, JWT_SECRET) as MyToken;

    const createdUser = decodedToken
      ? await UserModel.findById(decodedToken.id)
      : null;

    expect(createdUser).not.toBeNull();
    expect(createdUser?.username).toBe(user.username);
  });

  test("mutation create user fails with existing user", async () => {
    const { users } = await generateUsers();

    const user = {
      username: users[0].username,
      password: users[0].password,
    };

    // Request
    const createUser = `
      mutation createUser(
        $username: String!
        $password: String!
        ) {
        createUser(username: $username, password: $password) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: createUser,
      variableValues: { username: user.username, password: user.password },
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        createUser: {
          errors: [{ message: "Username already exists." }],
        },
      },
    });
  });

  test("mutation create user fails with short password", async () => {
    // Database setup
    const user = {
      username: faker.internet.userName(),
      password: "blah",
    };

    // Request
    const createUser = `
      mutation createUser(
        $username: String!
        $password: String!
        ) {
        createUser(username: $username, password: $password) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: createUser,
      variableValues: { username: user.username, password: user.password },
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        createUser: {
          errors: [
            {
              message: `Password length is too short, minimum length is ${MIN_PASSWORD_LENGTH} chars.`,
            },
          ],
        },
      },
    });
  });

  test("mutation delete user", async () => {
    // Database setup
    const { cleanedUsers, dbUsers } = await generateUsers();

    // Request
    const deleteUser = `
      mutation deleteUser($username: String!) {
        deleteUser(username: $username) {
          user {
            username
            firstName
            lastName
            emailAddress
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: deleteUser,
      variableValues: { username: cleanedUsers[0].username },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        deleteUser: {
          user: cleanedUsers[0],
        },
      },
    });

    // Database check
    const deletedUser = await UserModel.findOne({
      username: cleanedUsers[0].username,
    });

    expect(deletedUser).toBeNull();
  });

  test("mutation delete user fails doesn't exist", async () => {
    // Database setup
    const { dbUsers } = await generateUsers();

    // Request
    const deleteUser = `
      mutation deleteUser($username: String!) {
        deleteUser(username: $username) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: deleteUser,
      variableValues: { username: "madeUpUser" },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        deleteUser: {
          errors: [{ message: "User doesn't exist." }],
        },
      },
    });
  });

  test("mutation delete user fails not authorised", async () => {
    // Database setup
    const { dbUsers } = await generateUsers(2);

    // Request
    const deleteUser = `
      mutation deleteUser($username: String!) {
        deleteUser(username: $username) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: deleteUser,
      variableValues: { username: dbUsers[1].username },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        deleteUser: {
          errors: [{ message: "Not authorised to carry out this action." }],
        },
      },
    });
  });

  test("mutation login user", async () => {
    // Database setup
    const { users, dbUsers } = await generateUsers();

    // Request
    const loginUser = `
      mutation loginUser(
          $username: String!
          $password: String!
        ) {
        loginUser(username: $username, password: $password) {
          token
        }
      }
    `;

    const response = await graphqlRequest({
      source: loginUser,
      variableValues: {
        username: users[0].username,
        password: users[0].password,
      },
    });

    // Response check
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const token = response?.data?.loginUser?.token;
    const decodedToken = verify(token, JWT_SECRET) as MyToken;

    expect(decodedToken.username).toBe(users[0].username);
    expect(decodedToken.id).toBe(dbUsers[0]._id.toString());
  });

  test("mutation login user fails if doesn't exist", async () => {
    // Request
    const loginUser = `
      mutation loginUser(
          $username: String!
          $password: String!
        ) {
        loginUser(username: $username, password: $password) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: loginUser,
      variableValues: {
        username: "madeUpUser",
        password: "badpassword!",
      },
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        loginUser: {
          errors: [{ message: "User doesn't exist." }],
        },
      },
    });
  });

  test("mutation login user fails if wrong password", async () => {
    // Database setup
    const { users } = await generateUsers();

    // Request
    const loginUser = `
      mutation loginUser(
          $username: String!
          $password: String!
        ) {
        loginUser(username: $username, password: $password) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: loginUser,
      variableValues: {
        username: users[0].username,
        password: "badpassword!",
      },
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        loginUser: {
          errors: [{ message: "Incorrect password." }],
        },
      },
    });
  });

  test("mutation update username", async () => {
    // Database setup
    const { cleanedUsers, dbUsers } = await generateUsers();
    const newUsername = "newUsername";

    // Request
    const updateUsername = `
      mutation updateUsername(
        $username: String!
        $newUsername: String!
      ) {
        updateUsername(
          username: $username,
          newUsername: $newUsername
        ) {
          user {
            username
            firstName
            lastName
            emailAddress
          }
          token
        }
      }
    `;

    const response = await graphqlRequest({
      source: updateUsername,
      variableValues: {
        username: cleanedUsers[0].username,
        newUsername: newUsername,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const responseUser = response?.data?.updateUsername?.user;
    expect(responseUser).toMatchObject({
      ...cleanedUsers[0],
      username: newUsername,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const token = response?.data?.updateUsername?.token;
    const decodedToken = verify(token, JWT_SECRET) as MyToken;

    expect(decodedToken.username).toBe(newUsername);
    expect(decodedToken.id).toBe(dbUsers[0]._id.toString());

    // Database check
    const updatedUser = await UserModel.findById(dbUsers[0]._id);
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.username).toBe(newUsername);
  });

  test("mutation update username fails user doesn't exist", async () => {
    // Database setup
    const { dbUsers } = await generateUsers();

    // Request
    const updateUsername = `
      mutation updateUsername(
        $username: String!
        $newUsername: String!
      ) {
        updateUsername(
          username: $username,
          newUsername: $newUsername
        ) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: updateUsername,
      variableValues: {
        username: "madeUpUser",
        newUsername: "anotherMadeUpUser",
      },
      currentUser: dbUsers[0],
    });

    expect(response).toMatchObject({
      data: {
        updateUsername: {
          errors: [{ message: "User doesn't exist." }],
        },
      },
    });
  });

  test("mutation update username fails not authorised", async () => {
    // Database setup
    const { dbUsers } = await generateUsers(2);

    // Request
    const updateUsername = `
      mutation updateUsername(
        $username: String!
        $newUsername: String!
      ) {
        updateUsername(
          username: $username,
          newUsername: $newUsername
        ) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: updateUsername,
      variableValues: {
        username: dbUsers[1].username,
        newUsername: "newUsername",
      },
      currentUser: dbUsers[0],
    });

    expect(response).toMatchObject({
      data: {
        updateUsername: {
          errors: [{ message: "Not authorised to carry out this action." }],
        },
      },
    });
  });

  test("mutation update password", async () => {
    // Database setup
    const { users, cleanedUsers, dbUsers } = await generateUsers();
    const newPassword = faker.internet.password();

    // Request
    const updatePassword = `
      mutation updatePassword(
        $password: String!
        $newPassword: String!
      ) {
        updatePassword(
          password: $password,
          newPassword: $newPassword
        ) {
          user {
            username
            firstName
            lastName
            emailAddress
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: updatePassword,
      variableValues: {
        password: users[0].password,
        newPassword: newPassword,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        updatePassword: {
          user: cleanedUsers[0],
        },
      },
    });

    // Database check
    const updatedUser = (await UserModel.findById(
      dbUsers[0]._id
    )) as DocumentType<User>;
    expect(updatedUser).toBeDefined();

    const isNewPassValid = await passwordVerify(
      updatedUser.password,
      newPassword
    );
    const isOldPassValid = await passwordVerify(
      updatedUser.password,
      users[0].password
    );
    expect(isNewPassValid).toBeTruthy();
    expect(isOldPassValid).toBeFalsy();
  });

  test("mutation update password fails incorrect password", async () => {
    // Database setup
    const { users, dbUsers } = await generateUsers();
    const newPassword = faker.internet.password();

    // Request
    const updatePassword = `
      mutation updatePassword(
        $password: String!
        $newPassword: String!
      ) {
        updatePassword(
          password: $password,
          newPassword: $newPassword
        ) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: updatePassword,
      variableValues: {
        password: "incorrectPassword",
        newPassword: newPassword,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        updatePassword: {
          errors: [{ message: "Incorrect password." }],
        },
      },
    });

    // Database check
    const updatedUser = (await UserModel.findById(
      dbUsers[0]._id
    )) as DocumentType<User>;
    expect(updatedUser).toBeDefined();

    const isNewPassValid = await passwordVerify(
      updatedUser.password,
      newPassword
    );
    const isOldPassValid = await passwordVerify(
      updatedUser.password,
      users[0].password
    );
    expect(isNewPassValid).toBeFalsy();
    expect(isOldPassValid).toBeTruthy();
  });

  test("mutation update password fails too short password", async () => {
    // Database setup
    const { users, dbUsers } = await generateUsers();
    const newPassword = faker.internet
      .password()
      .substring(0, MIN_PASSWORD_LENGTH - 1);

    // Request
    const updatePassword = `
      mutation updatePassword(
        $password: String!
        $newPassword: String!
      ) {
        updatePassword(
          password: $password,
          newPassword: $newPassword
        ) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: updatePassword,
      variableValues: {
        password: users[0].password,
        newPassword: newPassword,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        updatePassword: {
          errors: [
            {
              message: `Password length is too short, minimum length is ${MIN_PASSWORD_LENGTH} chars.`,
            },
          ],
        },
      },
    });

    // Database check
    const updatedUser = (await UserModel.findById(
      dbUsers[0]._id
    )) as DocumentType<User>;
    expect(updatedUser).toBeDefined();

    const isNewPassValid = await passwordVerify(
      updatedUser.password,
      newPassword
    );
    const isOldPassValid = await passwordVerify(
      updatedUser.password,
      users[0].password
    );
    expect(isNewPassValid).toBeFalsy();
    expect(isOldPassValid).toBeTruthy();
  });

  test("mutation update user", async () => {
    // Database setup
    const { cleanedUsers, dbUsers } = await generateUsers();
    const options = {
      emailAddress: faker.internet.email(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    };

    // Request
    const updateUser = `
      mutation updateUser(
        $username: String!
        $options: UpdateUserInput!
      ) {
        updateUser(
          username: $username,
          options: $options
        ) {
          user {
            username
            firstName
            lastName
            emailAddress
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: updateUser,
      variableValues: {
        username: dbUsers[0].username,
        options,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        updateUser: {
          user: {
            ...cleanedUsers[0],
            emailAddress: options.emailAddress,
            firstName: options.firstName,
            lastName: options.lastName,
          },
        },
      },
    });

    // Database check
    const updatedUser = (await UserModel.findById(
      dbUsers[0]._id
    )) as DocumentType<User>;
    expect(updatedUser).toBeDefined();
    expect(updatedUser.firstName).toBe(options.firstName);
    expect(updatedUser.lastName).toBe(options.lastName);
    expect(updatedUser.emailAddress).toBe(options.emailAddress);
  });

  test("mutation update user fails missing user", async () => {
    // Database setup
    const { dbUsers } = await generateUsers();
    const options = {
      emailAddress: faker.internet.email(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    };

    // Request
    const updateUser = `
      mutation updateUser(
        $username: String!
        $options: UpdateUserInput!
      ) {
        updateUser(
          username: $username,
          options: $options
        ) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: updateUser,
      variableValues: {
        username: "madeUpUser",
        options,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        updateUser: {
          errors: [{ message: "User doesn't exist." }],
        },
      },
    });
  });

  test("mutation update user fails not authorised", async () => {
    // Database setup
    const { cleanedUsers, dbUsers } = await generateUsers(2);
    const options = {
      emailAddress: faker.internet.email(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    };

    // Request
    const updateUser = `
      mutation updateUser(
        $username: String!
        $options: UpdateUserInput!
      ) {
        updateUser(
          username: $username,
          options: $options
        ) {
          errors {
            message
          }
        }
      }
    `;

    const response = await graphqlRequest({
      source: updateUser,
      variableValues: {
        username: dbUsers[1].username,
        options,
      },
      currentUser: dbUsers[0],
    });

    // Response check
    expect(response).toMatchObject({
      data: {
        updateUser: {
          errors: [{ message: "Not authorised to carry out this action." }],
        },
      },
    });

    // Database check
    const updatedUser = (await UserModel.findById(
      dbUsers[1]._id
    )) as DocumentType<User>;
    expect(updatedUser).toBeDefined();
    expect(updatedUser).toEqual(expect.objectContaining(cleanedUsers[1]));
  });
});
