process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const organization = require("../Models/OrganizationModel");
const user = require("../Models/userModel");
const project = require("../Models/ProjectModel");
const server = require("../server");

before(async () => {
  await organization.deleteMany({});
  await user.deleteMany({});
  await project.deleteMany({});

  // Create a user
  let newUser = {
    username: "testUser",
    email: "test@test.dk",
    fName: "Test",
    lName: "User",
    password: "ThisIsATestUserForE2ETesting",
  };

  await chai.request(server).post("/api/users/register").send(newUser);

  const res = await chai
    .request(server)
    .post("/api/users/login")
    .send({ emailOrUsername: newUser.username, password: newUser.password });


    const authTokenCookie = res.headers['set-cookie']
      .find(cookie => cookie.startsWith('auth-token='));

    if (authTokenCookie) {
      const tokenValue = authTokenCookie.split(';')[0].split('=')[1];
      process.env.AUTH_TOKEN = tokenValue;
    } else {
      throw new Error('Auth token cookie was not found');
    }
});

after(async () => {
  await organization.deleteMany({});
  await user.deleteMany({});
  await project.deleteMany({});
});
