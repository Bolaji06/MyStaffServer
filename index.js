require("dotenv").config();
const pgp = require("pg-promise")();
const express = require("express");

const path = require('node:path');
const fs = require('node:fs');

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
  max: Number(POOL_COUNT),
  ssl: true,
};

const db = pgp(configOption);

const message = [{
  status: 404,
  message: "Can\'nt retrieve data"
}]

app.get("/", (req, res) => { 
  fs.readFile(path.join(__dirname, 'index.html'), 'utf-8', (err, data) => {
    if (err) throw err;
    res.type('.html');
    res.send(data)
  })
  
})
 

app.get("/api/data", async (req, res) => {
  const queryText = "SELECT * FROM mystaff";
  try {
    const response = await db.any(queryText);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.type("application/json");
    res.send(JSON.stringify(response));
  } catch (err) {
    res.status(500).json({ error: 'Internal Server error'});
    throw new Error(err);

  }
});

app.use((req, res, next) => {
  res.status(404).json(message);
})

app.listen(8000, () => {
  console.log("Server running...");
});
