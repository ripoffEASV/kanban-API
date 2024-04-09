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
            expect(actualVal).to.be.equal('Health check was successful!');        
            done();
        });
    });


    it('should POST a valid organization', (done) => {
        
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
        .set('Cookie', `auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RVc2VyIiwiZW1haWwiOiJ0ZXN0QHRlc3QuZGsiLCJpZCI6IjY2MTUwNGVkYTJmMzg5ZGM3YWI1MzI3MSIsImlhdCI6MTcxMjY1MzU0OSwiZXhwIjoxNzEyNzM5OTQ5fQ.85qcowu1JowfCsXaZPpHIzX0GedgEoFN08T7kuhlVdk`)
        .send(org)
        .end((err, res) => {
            console.log(res);
            res.should.have.status(200);
            done();
        });
    });


    it('should test two values....', () => {
        //actual test content in here
        let expectedVal = 10;
        let actualVal = 10;

        expect(actualVal).to.be.equal(expectedVal);
    })
})
