process.env.NODE_ENV = "test";

const organization = require("../Models/OrganizationModel");
const user = require("../Models/userModel");

// todo before running all test wipe db
// then create user / make sure a user is created on the fresh db
// then login before all requests

beforeEach((done) => {
  organization.deleteMany({}, function (err) {});
  user.deleteMany({}, function (err) {});

  done();
});

afterEach((done) => {
  organization.deleteMany({}, function (err) {});
  user.deleteMany({}, function (err) {});
  done();
});
