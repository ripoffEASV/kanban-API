process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const organization = require('../Models/OrganizationModel');
const user = require('../Models/userModel');
const server = require('../server');

before(async () => {
    await organization.deleteMany({});
    await user.deleteMany({});
    
    // Create a user
    let newUser = {
        username: 'testUser',
        email: 'test@test.dk',
        fName: 'Test',
        lName: 'User',
        password: 'ThisIsATestUserForE2ETesting',
    }

    await chai.request(server).post('/api/users/register').send(newUser);

    const res = await chai.request(server).post('/api/users/login').send({ emailOrUsername: newUser.username, password: newUser.password });
    process.env.AUTH_TOKEN = res.body.data.token;
});

after(async () => {
    await organization.deleteMany({});
    await user.deleteMany({});
});