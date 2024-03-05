const router = require("express").Router();
const users = require("../Models/userModel");

const verifyToken = require("../auth");

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
    });
});

router.post("/login", (req, res) => {
  const data = req.body;

  const user = users.find({ email: data.email, password: data.password });
  if (!user) {
    res
      .status(404)
      .json({ Message: "No user found with provided information" });
  } else {
    //console.log(user);

    const tokenEmail = user.email + ":" + Date.now().toString(); // date.now() is for creating an UID

    const token = jwt.sign(
      {
        exp: Date.now() / 1000 + 60 * 60 * 24, // token should expire in 24 hours
        data: tokenEmail,
      },
      process.env.SECRET
    );

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
});

module.exports = router;
