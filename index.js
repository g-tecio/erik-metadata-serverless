// index.js

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');

const USERS_TABLE = process.env.USERS_TABLE;

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  console.log(dynamoDb);
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
};

app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
  res.send('Hello World!')
})

// Get User endpoint
app.get('/metadata/:id', function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      id: req.params.id,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get metadata' });
    }
    if (result.Item) {
      const {id, name, owner_id, created_at, schema} = result.Item;
      res.json({ id, name, owner_id, created_at, schema });
    } else {
      res.status(404).json({ error: "Metadata not found" });
    }
  });
})

// Create User endpoint
app.post('/metadata', function (req, res) {
  const { id, name, owner_id, created_at, schema } = req.body;
  if (typeof id !== 'string') {
    res.status(400).json({ error: '"id" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      id: id,
      name: name,
      owner_id: owner_id,
      created_at: created_at,
      schema: schema
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create metadata' });
    }
    res.json({ id, name, owner_id, created_at, schema });
  });
})

module.exports.handler = serverless(app);