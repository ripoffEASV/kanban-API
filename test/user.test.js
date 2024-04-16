const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const server = require('../server');
chai.use(chaiHttp);

describe('User workflow tests', () => {
    it('should create user and login', (done) => { 
        let newUser = {
            username: 'testUser2',
            email: 'test2@test.dk',
            fName: 'Test',
            lName: 'User',
            password: 'ThisIsATestUserForE2ETesting',
        }
    
        chai.request(server)
                .post('/api/users/register')
                .send(newUser)
                .end((erro, res) => {
                    expect(res.status).to.be.equal(200);   
                    expect(res.body).to.be.a('object');
                    expect(res.body.error).to.be.equal(null);

                    chai.request(server)
                            .post('/api/users/login')
                            .send({
                                "emailOrUsername": newUser.email,
                                "password": newUser.password
                            })
                            .end((err, res) => {
                                expect(res.status).to.be.equal(200);
                                expect(res.body.error).to.be.equal(null);
                                expect(res.body.data.token).to.be.a('string').that.is.not.empty;
                                done();
                            });
        })
    
        // chai.request(server).post('/api/users/login').send({ emailOrUsername: newUser.username, password: newUser.password });
    });
});