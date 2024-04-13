require("dotenv").config();
const pgp = require("pg-promise")();
const express = require("express");

const path = require('node:path');
const fs = require('node:fs');
const { error } = require("node:console");

const app = express();

const PORT = 8000;
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
    res.send(data);
  });
  
});

// async function getAPI(params){
//   try {
//     const response = await db.any(params.queryText);

//     params.res.setHeader('Access-Control-Allow-Origin', '*');
//     params.res.setHeader('Access-Control-Allow-Methods', 'GET');
//     params.res.setHeader('Cache-Control', 'max-age=3600');

//     params.res.type('application/json');
//     params.res.send(JSON.stringify(response));
//   }catch(err){
//     params.res.status(400).json({err: 'Internal Server error'})
//     throw new Error(err);
//   }

// }

app.get('/api/data/:id', async (req, res) => {
  const queryText = 'SELECT * FROM mystaff WHERE id=$1';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-cache');

  res.type('application/json');

  const parseId = parseInt(req.params.id);
  console.log(parseId);

  if (isNaN(parseId)){
    return res.status(400).json({error: 'Invalid Request'});
  }

  try{
    const response = await db.any(queryText, [parseId]);
    const findStaff = response.find((staff) => staff.id === parseId);
    if (!findStaff) return res.sendStatus(404);

    return res.send(findStaff);

  }catch(err){
    res.sendStatus(500);
    throw new Error(err);
  }

})

app.get("/api/data", async (req, res) => {
  const queryText = "SELECT * FROM mystaff";
  try {
    const response = await db.any(queryText);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'max-age=3600')
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

app.listen(PORT, () => {
  console.log("Server running...");
});
