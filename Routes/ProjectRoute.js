const express = require("express");
const app = express();
const projects = require("../Models/ProjectModel");
const states = require("../Models/StateModel");
const mongoose = require("mongoose");
const verifyToken = require("../auth");

app.post("/addNewProject", verifyToken, async (req, res) => {
  try {
    let data = req.body;
    console.log(data)

    let stateIDArray = [];
    let userIDArray = [];

    await Promise.all(data.projectMembers.map(async (element) => {
      userIDArray.push(element._id); // Push just the ID, not in an object
    }));

    let newProject = await projects.create({
      projectName: data.projectName,
      projectStateIDs: [],
      members: userIDArray,
      orgID: data.orgID
    });

    await Promise.all(data.projectBoards.map(async (element) => {
      let stateID = await states.create({
        stateName: element.title,
      });
      const resultID = stateID._id;
      console.log(element.title, resultID);
      stateIDArray.push(resultID); // Push just the ID, not in an object
    }));

    await projects.findOneAndUpdate(
      { _id: newProject._id },
      { projectStateIDs: stateIDArray }
    );

    res.status(209).json({message: "Project added successfully"});
  } catch (error) {
    console.log(error.message);
    res.status(500).json({message: "Internal Server Error"});
  }
});

app.get("/getProjects:/orgID", verifyToken, async (req, res) =>{

  try {
    
    const orgID = req.params.orgID;

    const orgProjects = projects.find({orgID: orgID})
    console.log(orgProjects);
    res.send("plz")



  } catch (error) {
    
  }

})


module.exports = app;
