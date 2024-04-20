require("dotenv").config();
const pgp = require("pg-promise")();
const express = require("express");

const path = require("node:path");
const fs = require("node:fs");
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
  user: "bjpostgres",
  password: POSTGRES_PASSWORD,
  max: Number(POOL_COUNT),
  ssl: true,
};

const db = pgp(configOption);

const message = [
  {
    status: 404,
    message: "Can'nt retrieve data",
  },
];

app.use(express.json());

app.get("/", (req, res) => {
  fs.readFile(path.join(__dirname, "index.html"), "utf-8", (err, data) => {
    if (err) throw err;
    res.type(".html");
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

app.get("/api/data", async (req, res) => {
  const queryText = "SELECT * FROM mystaff";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "max-age=3600");
  res.type("application/json");

  const { gender } = req.query;

  try {
    const response = await db.any(queryText);

    if (gender && gender !== "male" && gender !== "female") {
      return res.sendStatus(404);
    }
    if (gender) {
      const filter = response.filter((item) => item.gender === gender);
      return res.send(filter);
    }
    return res.send(JSON.stringify(response));
  } catch (err) {
    res.status(500).json({ error: "Internal Server error" });
    throw new Error(err);
  }
});

app.post("/api/data", async (req, res) => {
  const {
    first_name,
    last_name,
    image_url,
    gender,
    email,
    date_hire,
    department,
    description,
  } = req.body;

  const requiredField = [first_name, last_name, image_url, gender, email, date_hire, department, description];

  if (requiredField.some(field => !field)){
    res.status(400).json({ error: "All fields are required "})
  }

  const queryText = `INSERT INTO mystaff
  (first_name, last_name, image_url, gender, email, date_hire, department, description)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;

  try {
    const result = await db.one(queryText, [
      first_name,
      last_name,
      image_url,
      gender,
      email,
      date_hire,
      department,
      description,
    ]);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({error: "Internal Server error"});
    throw new Error(err);
  }
});

app.get("/api/data/:id", async (req, res) => {
  const queryText = "SELECT * FROM mystaff WHERE id=$1";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "no-cache");

  res.type("application/json");

  const { id } = req.params;
  const parseId = parseInt(id);

  if (isNaN(parseId)) {
    return res.status(400).json({ error: "Invalid Request" });
  }

  try {
    const response = await db.any(queryText, [parseId]);
    const findStaff = response.find((staff) => staff.id === parseId);
    if (!findStaff) return res.sendStatus(404);

    return res.send(findStaff);
  } catch (err) {
    res.sendStatus(500);
    throw new Error(err);
  }
});

app.put('/api/data/:id', async (req, res) => {
  const queryText = `UPDATE mystaff SET 
  first_name=$1, last_name=$2, image_url=$3, gender=$4, email=$5,
  date_hire=$6, department=$7, description=$8 WHERE id=$9 RETURNING *`;

  const { body, params: { id } } = req;

  const parseId = parseInt(id);
  if (isNaN(parseId)){
    res.status(500).json({ error: 'Invalid request' });
  }
  const { first_name, last_name, image_url, gender,
     email, date_hire, department, description } = body;
  
  try {
    const updateRecord = await db.oneOrNone(queryText, [first_name, last_name, image_url, gender, 
      email, date_hire, department, description, parseId]);

      if (!updateRecord){
        res.status(500).json({ error: 'Record not found' });
      }

     return res.status(201).json(updateRecord);
  }catch(err){
    res.sendStatus(500);
    throw new Error(err);
  }

});

app.patch('/api/data/:id', async (req, res) => {
  const { params: { id }, body } = req
  const { email } = body;

  const parseId = parseInt(id)
  if (isNaN(parseId)){
    res.status(500).json({error: "Bad Request"});
  }
  const queryText = 'UPDATE mystaff SET email=$1 WHERE id=$2 RETURNING *';

  try{
     const result = await db.oneOrNone(queryText, [email, parseId]);
      if (!result){
        res.sendStatus(400);
      }
      return res.status(201).json(result);
    }catch(err){
      throw new Error(err)
    }
});

app.delete('/api/data/:id', async(req, res) => {
  const { params: { id } } = req;
  const parseId = parseInt(id);

  if (isNaN(parseId)){
    res.status(400).json({error: "Bad Request"});
  }
  const queryText = 'DELETE FROM mystaff WHERE id=$1 RETURNING *';
  try {
    const result = await db.oneOrNone(queryText, [parseId]);
    if (!result){
      res.status(404).json({ error: 'No Record Found'});
    }
    return res.status(204).json(result)
  }catch(err){
    res.status(500).json({error: 'Internal Server Error'})
    throw new Error(err);
  }
})



app.use((req, res, next) => {
  res.status(404).json(message);
});

app.listen(PORT, () => {
  console.log("Server running..." + PORT);
});
