const router = require("express").Router();
const users = require("../Models/userModel");
const mongoose = require("mongoose");
//const router = express().router;

router.post("/helloCars", async (req, res) => {
  res.send("hello world!");
});

router.post("/addUser", async (req, res) => {
  const data = req.body;
  users
    .insertMany(data)
    .then((data) => {
      res.status(200).send("user added");
    })
    .catch((err) => {
      res.status(500).send({
        title: "There was an error adding a new user",
        message: err.message,
      });
    });

  //   try {
  //     data = req.body;
  //     console.log(req.body);
  //     console.log(data);
  //     Users.insert(data);
  //     res.status(200).send("ok?");
  //   } catch (err) {
  //     res.status(500).send({ message: err.message });
  //   }
});

router.get("/", (req, res) => {
  users
    .find({})
    .then((data) => {
      console.log("test: ", data);
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    })
    .finally(() => {
      console.log("request completed");
      //mongoose.disconnect;
    });
});

router.get("/findByEmail/:email", (req, res) => {
  users
    .findOne({ Email: req.params.email })
    .then((data) => {
      console.log("test: ", data);
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    })
    .finally(() => {
      console.log("request completed");
      //mongoose.disconnect;
    });
});


module.exports = router;
