const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const server = require('../server');
chai.use(chaiHttp);

let createdOrgId = '';
let loginToken = '';

describe('User workflow tests', () => {
    it('should register + login a user and create organization', (done) => {
        let user = {
            username: 'testUser',
            email: 'test@test.dk',
            fName: 'Test',
            lName: 'User',
            password: 'ThisIsATestUserForE2ETesting',
        }

        chai.request(server).post('/api/users/register').send(user).end((err, res) => {
            expect(res.status).to.be.equal(200);   
            expect(res.body).to.be.a('object');
            expect(res.body.error).to.be.equal(null);

            chai.request(server)
                    .post('/api/users/login')
                    .send({
                        "emailOrUsername": user.email,
                        "password": user.password
                    })
                    .end((err, res) => {
                        expect(res.status).to.be.equal(200);
                        expect(res.body.error).to.be.equal(null);                        
                        let token = res.body.data.token;
                        expect(token).to.be.a('string').that.is.not.empty;
                        loginToken = token;

                        let org = {
                            orgName: 'mocha chai org test',
                            createdByID: '',
                            ownerID: '',
                            orgMembers: [],
                            projectIDs: [],
                            inviteArray: []
                        }

                        chai.request(server)
                        .post('/api/organizations/addNewOrganization')
                        .set('Cookie', `auth-token=${token}`)
                        .send(org)
                        .end((err, res) => {
                            res.should.have.status(200);
                            const ownerID = res.body.org[0].ownerID;
                            const createdByID = res.body.org[0].createdByID;
                            expect(createdByID).to.be.a('string').that.is.not.empty
                            expect(ownerID).to.be.a('string').that.is.not.empty
                            expect(createdByID).to.be.equal(ownerID)
                            createdOrgId = res.body.org
                            console.log(createdOrgId, loginToken);
                            done();
                        });
                    });
        })
    });
});