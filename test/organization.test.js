const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const server = require('../server');

chai.use(chaiHttp);

describe('/First Test Collection', () => {

    it('test default API health check...', (done) => {

        chai.request(server)
        .get('/api/health-check')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');    
            const actualVal = res.body.message;
            expect(actualVal).to.match(/^Health check was successful!/);      
            done();
        });
    });

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
                expect(ownerID).to.be.an('array').that.is.not.empty;
                expect(ownerID[0]).to.equal(createdByID);
                done();
            });
    });
})
