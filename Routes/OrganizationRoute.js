const express = require("express");
const app = express();
const orgs = require("../Models/OrganizationModel");

const verifyToken = require("../auth");

app.post("/addNewOrganization", async (req, res) => {
  try {
    let data = req.body;
    const token = req.headers["authorization"].split(" ")[1];

    let isMatch = false;
    let userID;

    req.session.user.forEach((val) => {
      console.log(val);
      if (val.token == token) {
        isMatch = true;
        userID = val.id;
        console.log("match");
      }
    });

    if (isMatch) {
      console.log("there was a match??");
      data.createdByID = userID;

      await orgs
        .insertMany(data)
        .then((data) => {
          res.status(200).json({ message: "Organization created" });
        })
        .catch((err) => {
          res.status(500).send({
            message: "There was an error adding a new Organization",
          });
        });
    } else {
      res.status(404).send({
        message: "No authorized users found",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/getOrganizationsFromID/:token", async (req, res) => {
  try {
    console.log("running");
    const token = req.params.token;
    console.log(token.toString());
    //const token = req.headers["authorization"].split(" ")[1];

    let userID;
    let matchFound = false;

    // if (!Array.isArray(req.session.user)) {
    //   req.session.user = [];
    // }

    console.log(req.user ? req.session.user.token : "no token");

    req.session.user.forEach((val, index) => {
      if (val.token == token) {
        userID = val.id;
        matchFound = true;
      }
    });

    if (!matchFound) {
      return res.status(404).json({ message: "no match" });
    }

    console.log("userID: ", userID);

    const foundOrgs = await orgs.find({
      createdByID: userID,
      $or: [{ ownerID: userID }, { "orgMembers.userID": userID }],
    });

    console.log("orgs: ", foundOrgs);

    res.status(200).json({ organizations: foundOrgs });
  } catch (error) {
    console.error("Error in getOrganizationsFromID route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = app;
