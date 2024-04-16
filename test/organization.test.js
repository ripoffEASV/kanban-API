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

    /* it('should POST a valid organization', (done) => {
        let org = {
            orgName: 'mocha chai org test',
            createdByID: '660ed1ed146d2827caca17c9',
            ownerID: '660ed1ed146d2827caca17c9',
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
            done();
        });
    }); */
})
