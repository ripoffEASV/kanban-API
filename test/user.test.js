const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const server = require('../server');
chai.use(chaiHttp);

let createdOrgId = '';
let loginToken = '';

describe('User workflow tests', () => {
    it('should create organization', (done) => {
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
            .set('Cookie', `auth-token=${process.env.AUTH_TOKEN}`)
            .send(org)
            .end((err, res) => {
                res.should.have.status(200);
                const ownerID = res.body.org[0].ownerID;
                const createdByID = res.body.org[0].createdByID;
                expect(createdByID).to.be.a('string').that.is.not.empty
                expect(ownerID).to.be.a('string').that.is.not.empty
                expect(createdByID).to.be.equal(ownerID)
                done();
            });
    });
});