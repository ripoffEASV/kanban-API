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
})
