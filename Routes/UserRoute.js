const express = require("express");
const app = express();
const users = require("../Models/userModel");
const jwt = require("jsonwebtoken");

const verifyToken = require("../auth");

app.post("/addUser", async (req, res) => {
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
});

app.get("/", (req, res) => {
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
    });
});

app.get("/findByEmail/:email", (req, res) => {
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
    });
});

app.get("/logout/:token", async (req, res) => {
  const token = req.params.token.split(" ")[1];

  //Delete stored user if logging in twice
  req.session.user.forEach((element, index) => {
    console.log(element, index);
    if (element.token == token) {
      console.log("match");
      //req.session.user.splice(index, 1);
    }
  });

  res.status(200).json({ message: "successfully logged out" });
});

app.post("/login", async (req, res) => {
  try {
    const data = req.body;

    const user = await users.findOne({
      email: data.email,
      password: data.password,
    });
    if (!user) {
      res
        .status(404)
        .json({ Message: "No user found with provided information" });
    } else {
      const tokenEmail = user.email + ":" + Date.now().toString(); // date.now() is for creating an UID

      const token = jwt.sign(
        {
          exp: Date.now() / 1000 + 60 * 60 * 24, // token should expire in 24 hours
          data: tokenEmail,
        },
        process.env.SECRET
      );
      console.log(req.session ? "session exists" : "session doesnt exist");
      if (typeof req.session.user !== "undefined") {
        // Example: Delete item with id 2
        deleteItemById(req.session.user, user._id);
      } else {
        req.session.user = [];
      }

      req.session.user.push({ id: user._id, email: user.email, token: token });
      console.log(req.session.user);

      // if (!Array.isArray(req.session.user)) {
      //   req.session.user = [];
      // }
      // if (req.session.length) {
      //   //Delete stored user if logging in twice

      //   req.session.user.forEach((element, index) => {
      //     if (element.email == data.email) {
      //       req.session.user.splice(index, 1);
      //     }
      //   });
      // }

      // //add info to session storage
      // req.session.user.push({
      //   email: user.email,
      //   token: token,
      //   id: user._id,
      // });

      await req.session.save();

      res.header("auth-token", token).json({
        error: null,
        data: {
          Status: 200,
          Message: "Token signed successfully",
          data: token,
        },
      });

      //res.status(200).json({ Message: "User Logged in" });
    }
  } catch (error) {
    console.log(error);
  }
});

// Function to find and delete an item from the array
const deleteItemById = (array, itemId) => {
  const index = array.findIndex((item) => item.id === itemId);

  if (index !== -1) {
    // If the item is found, remove it from the array
    array.splice(index, 1);
  }
};

module.exports = app;
