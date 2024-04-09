process.env.NODE_ENV = 'test';

const organization = require('../Models/OrganizationModel');
const user = require('../Models/userModel');

beforeEach((done) => { 
    organization.deleteMany({}, function(err) {});
    user.deleteMany({}, function(err) {});
    done();
});

afterEach((done) => {
    organization.deleteMany({}, function(err) {});
    user.deleteMany({}, function(err) {});
    done();
});