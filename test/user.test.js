const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const server = require('../server');
chai.use(chaiHttp);

/* describe('User workflow tests', () => {
    it('should register + login a user', (done) => {
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
                        // Asserts
                        expect(res.status).to.be.equal(200);
                        expect(res.body.error).to.be.equal(null);                        
                        let token = res.body.data.token;
                        expect(token).to.be.a('string').that.is.not.empty;
                        done();
                    });
        })
    });
}); */