const express = require("express");
const userModel = require("../Models/userModel");
const mongoose = require("mongoose");
const app = express();

app.get("/helloCars", async (req, res) => {
  res.send("hello world!");
});

app.get("/users", async (req, res) => {
  try {
    const users = await userModel.findOne();
    //if (!users) res.status(404).send("No item found");

    console.log(users);
    res.send(users);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  } finally {
    mongoose.disconnect();
  }
});

app.get("/users/:email", async (req, res) => {
  //await mongoose.connect(process.env.DB_URI);
  //console.log(req.params);
  try {
    const user = await userModel.find({ Email: req.params.email });
    if (!user) res.status(404).send("No user found");
    console.log(user);
    res.send(user);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

module.exports = app;
