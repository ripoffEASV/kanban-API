const chai = require("chai");
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require("chai-http");
const server = require("../server");

chai.use(chaiHttp);

let projectID;

describe("/test projects", () => {
  it("Test if a new project can be created", (done) => {
    const testData = {
      projectName: "ChaiProject",
      projectBoards: ["Todo", "Doing", "Test", "Release"],
      projectMembers: [1, 2, 3, 4],
      orgID: "1",
    };

    chai
      .request(server)
      .post("/api/projects/addNewProject")
      .send(testData)
      .end((err, res) => {
        projectID = res.body.projectID;
        res.should.have.status(200);
        res.body.should.be.a("object");
        const actualVal = res.body.message;
        expect(actualVal).to.match(/^Project added successfully/);
        done();
      });
  });

  it("Test if a new project contains at least 1 member", (done) => {
    const testData = {
      projectName: "ChaiProject2",
      projectBoards: ["Todo", "Doing", "Test", "Release"],
      projectMembers: [],
      orgID: "1",
    };

    chai
      .request(server)
      .post("/api/projects/addNewProject")
      .send(testData)
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.be.a("object");
        const actualVal = res.body.message;
        expect(actualVal).to.match(
          /^Project must have at least a single member/
        );
        done();
      });
  });

  it("Test if a new project contains at least 1 board", (done) => {
    const testData = {
      projectName: "ChaiProject3",
      projectBoards: [],
      projectMembers: [1, 2, 3, 4],
      orgID: "1",
    };

    chai
      .request(server)
      .post("/api/projects/addNewProject")
      .send(testData)
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.be.a("object");
        const actualVal = res.body.message;
        expect(actualVal).to.match(
          /^Project must have at least a single board/
        );
        done();
      });
  });

  it("Test if a specific project can be found", (done) => {
    chai
      .request(server)
      .get(`/api/projects/getSpecificProject/${projectID}`)
      .end((err, res) => {
        console.log(res.body);
        res.should.have.status(200);
        res.body.should.be.a("object");
        const actualVal = res.body.project;
        expect(actualVal).to.be.an("array");
        done();
      });
  });

  it("Test if a specific project can be found", (done) => {
    chai
      .request(server)
      .get(`/api/projects/getSpecificProject/${projectID}`)
      .end((err, res) => {
        console.log(res.body);
        res.should.have.status(200);
        res.body.should.be.a("object");
        const actualVal = res.body.project;
        expect(actualVal).to.be.an("array");
        done();
      });
  });

  it("Test for finding all projects in an organization", (done) => {
    chai
      .request(server)
      .get(`/api/projects/getProjects/1`)
      .end((err, res) => {
        console.log(res.body);
        res.should.have.status(200);
        res.body.should.be.a("object");
        const actualVal = res.body.project;
        expect(actualVal).to.be.an("array");
        done();
      });
  });
});
