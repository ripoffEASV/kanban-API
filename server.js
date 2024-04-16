const mongoose = require("mongoose");
require("dotenv-flow").config();

mongoose.set('strictQuery', false);
mongoose.connect(process.env.DB_URI,
    {
        useUnifiedTopology: true,
        useNewUrlParser: true
    }
).catch(error => console.log("Error connecting to MongoDB:" + error));
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

//Define routes
const organizationRoute = require("./Routes/OrganizationRoute");
const projectRoute = require("./Routes/ProjectRoute");
const stateRoute = require("./Routes/StateRoute");
const taskRoute = require("./Routes/TaskRoute");
const userRoute = require("./Routes/UserRoute");

app.use("/api/organizations", organizationRoute);
// app.use(projectRoute);
// app.use(stateRoute);
// app.use(taskRoute);
app.use("/api/users", userRoute);

app.listen(PORT, async (req, res) => {
  console.log("Server Listening on PORT:", PORT);
});

app.get('/api/health-check', (req, res) => {
  res.status(200).send({message: 'Health check was successful!9999'});
})

module.exports = app;