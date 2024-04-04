process.env.NODE_ENV = 'test';

describe('/First test collection', () => {
    let expect;
    let chai;
    let should;
    let server;

    before(async () => {
        chai = await import('chai');
        const chaiHttp = await import('chai-http');
        expect = chai.expect;
        should = chai.should;
        server = await import('../server.js');
        chai.use(chaiHttp.default); // Assuming chaiHttp is the default export
    });

    it('test health check', (done) => {
        chai.request(server)
            .get('/api/health-check')
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('should test two values.....', () => {
        let expectedVal = 10;
        let actualValue = 10;
        expect(actualValue).to.equal(expectedVal);
    });
});
