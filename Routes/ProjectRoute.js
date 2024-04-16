const express = require("express");
const app = express();
const projects = require("../Models/ProjectModel");
const states = require("../Models/StateModel");
const orgs = require("../Models/OrganizationModel");
const mongoose = require("mongoose");
const verifyToken = require("../auth");

app.post("/addNewProject", verifyToken, async (req, res) => {
  try {
    let data = req.body;
    console.log(data);

    let stateIDArray = [];
    let userIDArray = [];

    await Promise.all(
      data.projectMembers.map(async (element) => {
        userIDArray.push(element._id); // Push just the ID, not in an object
      })
    );

    let newProject = await projects.create({
      projectName: data.projectName,
      projectStateIDs: [],
      members: userIDArray,
      orgID: data.orgID,
    });

    await Promise.all(
      data.projectBoards.map(async (element) => {
        let stateID = await states.create({
          stateName: element.title,
        });
        const resultID = stateID._id;
        console.log(element.title, resultID);
        stateIDArray.push(resultID); // Push just the ID, not in an object
      })
    );

    await projects.findOneAndUpdate(
      { _id: newProject._id },
      { projectStateIDs: stateIDArray }
    );

    res.status(209).json({ message: "Project added successfully" });
  } catch (error) {
    res.status(500).json({
      Title: "Something went wrong with adding a new project",
      Message: error.message,
    });
  }
});

app.get("/getSpecificProject/:projectID", async (req, res) => {
  try {
    const projectID = req.params.projectID;
    console.log(projectID);
    projects
      .aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(projectID),
          },
        },
        {
          $lookup: {
            from: "states",
            let: { projectStateIDs: "$projectStateIDs" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      { $toObjectId: "$_id" },
                      {
                        $map: {
                          input: "$$projectStateIDs",
                          as: "projectStateID",
                          in: { $toObjectId: "$$projectStateID" },
                        },
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  stateName: 1,
                  stateID: "$_id",
                },
              },
            ],
            as: "stateInfo",
          },
        },
        {
          $lookup: {
            from: "tasks",
            localField: "stateInfo._id",
            foreignField: "stateID",
            as: "tasks",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { members: "$members" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      { $toObjectId: "$_id" },
                      {
                        $map: {
                          input: "$$members",
                          as: "member",
                          in: { $toObjectId: "$$member" },
                        },
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  email: 1,
                  fName: 1,
                  lName: 1,
                  color: 1,
                },
              },
              {
                $unset: "password",
              },
            ],
            as: "membersInfo",
          },
        },
        {
          $project: {
            projectName: 1,
            projectStateIDs: 1,
            orgID: 1,
            membersInfo: 1,
            stateInfo: 1,
            tasks: 1,
          },
        },
      ])
      .then((projects) => {
        console.log(projects);
        res.send(projects);
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    res.status(500).json({
      Title: "Something went wrong with getting specific project",
      Message: error.message,
    });
  }
});

app.get("/getProjects/:orgID", async (req, res) => {
  try {
    const orgID = req.params.orgID;

    projects
      .aggregate([
        {
          $match: {
            orgID: orgID,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { members: "$members" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      { $toObjectId: "$_id" },
                      {
                        $map: {
                          input: "$$members",
                          as: "member",
                          in: { $toObjectId: "$$member" },
                        },
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  email: 1,
                  fName: 1,
                  lName: 1,
                  color: 1,
                },
              },
              {
                $unset: "password",
              },
            ],
            as: "membersInfo",
          },
        },
        {
          $project: {
            projectName: 1,
            projectStateIDs: 1,
            orgID: 1,
            membersInfo: 1,
          },
        },
      ])
      .then((projects) => {
        console.log(projects);
        res.send(projects);
      })
      .catch((err) => {
        res.send(err);
      });
  } catch (error) {
    res.status(500).json({
      Title: "Something went wrong with getting organization projects",
      Message: error.message,
    });
  }
});

module.exports = app;
