require("dotenv").config();
const pgp = require("pg-promise")();
const express = require("express");

const app = express();

const {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_DATABASE,
  POSTGRES_PASSWORD,
  POSTGRES_USER,
  POOL_COUNT,
} = process.env;

const configOption = {
  host: POSTGRES_HOST,
  port: Number(POSTGRES_PORT),
  database: POSTGRES_DATABASE,
  user: 'bjpostgres',
  password: POSTGRES_PASSWORD,
  // max: Number(POOL_COUNT),
  ssl: true,
};

const db = pgp(configOption);

app.get("/", (req, res) => {
  res.send("<h1>HomePage</h1>");
});

app.get("/api/data", async (req, res) => {
  const queryText = "SELECT * FROM mystaff";
  try {
    const response = await db.any(queryText);
    res.type("application/json");
    res.send(JSON.stringify(response));
  } catch (err) {
    console.log(err);
  }
});

app.listen(8000, () => {
  console.log("Server running...");
});
