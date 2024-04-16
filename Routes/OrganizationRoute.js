const express = require("express");
const app = express();
const orgs = require("../Models/OrganizationModel");
const users = require("../Models/userModel");
const mongoose = require("mongoose");

const verifyToken = require("../auth");

app.post("/addNewOrganization", verifyToken, async (req, res) => {
  try {
    let data = req.body;

    data.createdByID = req.user.id;

    if (!data.ownerID) {
      data.ownerID = req.user.id;
    }

    await orgs
      .insertMany(data)
      .then((result) => {
        res.status(200).json({ message: "Organization created", org: result });
      })
      .catch((err) => {
        res.status(500).send({
          message: "There was an error adding a new Organization",
          error: err.message,
        });
      });
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/getOrganizationsFromID", verifyToken, async (req, res) => {
  try {
    const foundOrgs = await orgs.find({
      $or: [
        { createdByID: req.user.data.id },
        { ownerID: req.user.data.id },
        { "orgMembers.userID": req.user.data.id },
      ],
    });
    console.log(foundOrgs);

    res.status(200).json({ organizations: foundOrgs });
  } catch (error) {
    console.error("Error in getOrganizationsFromID route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getSpecificOrg/:orgID", verifyToken, async (req, res) => {
  try {
    console.log("get specific org: ", req.params.orgID);
    const organizationDetails = await orgs.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.orgID),
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ownerId: "$ownerID" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$ownerId" }] },
              },
            },
            {
              $project: { _id: 0, password: 0 }, // Exclude the password field
            },
          ],
          as: "owner",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { createdById: "$createdByID" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$createdById" }] },
              },
            },
            {
              $project: { _id: 0, password: 0 }, // Exclude the password field
            },
          ],
          as: "createdByUser",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { orgMemberUserIDs: "$orgMembers.userID" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    "$_id",
                    {
                      $map: {
                        input: "$$orgMemberUserIDs",
                        as: "id",
                        in: { $toObjectId: "$$id" },
                      },
                    },
                  ],
                },
              },
            },
            {
              $project: { password: 0 }, // Exclude the password field
            },
          ],
          as: "orgUsers",
        },
      },
    ]);

    console.log("organizationDetails: ", organizationDetails);

    res.status(200).json({ message: "found org", org: organizationDetails });
  } catch (error) {
    console.error("Error in getSpecificOrg route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = app;
