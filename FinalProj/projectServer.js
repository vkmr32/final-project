const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const httpSuccessStatus = 200;
const port = process.argv[2];
const fetch = require('node-fetch');
require("dotenv").config();

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const uri = `mongodb+srv://${userName}:${password}@cluster0.7idjgl4.mongodb.net/${databaseAndCollection.db}?retryWrites=true&w=majority`;

const apiKey = "Etbgxm5uxdoXcW0jGg70xltH0xds0PFt9pe62iaJ";


const { MongoClient, ServerApiVersion } = require('mongodb');
async function main() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();

        app.set("views", path.resolve(__dirname, "templates"));
        app.set("view engine", "ejs");
        app.use(bodyParser.urlencoded({ extended: false }));
      
        // Home
        app.get("/", async (req,res) => {
            res.render("index");
        });

        // Form
        app.get("/form", async (req,res) =>{
            res.render("form");
        });

        // Form Submit
        app.post("/form", async (request, response) => {
            const newRequest = {
                name: request.body.name,
                email: request.body.email,
                month: parseInt(request.body.month),
                day: parseInt(request.body.day),
                year: parseInt(request.body.year),
                backgroundInfo: request.body.backgroundInfo,
            };

            await insertRequest(client, databaseAndCollection, newRequest); // add to MongoDB

            const date = `${newRequest.year}-${String(newRequest.month).padStart(2, '0')}-${String(newRequest.day).padStart(2, '0')}`; // Format date string correctly
            const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`

            try {
                const apodResponse = await fetch(apiUrl);
                if (!apodResponse.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await apodResponse.json();
                response.render("formConfirm", { ...newRequest, data });
            } catch (error) {
                console.error('Error:', error);
                response.status(500).send('An error occurred');
            }
        });

        // Photo
        app.get("/photo", async (req,res) => {
            const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error('network response');
                }

                const data = await response.json();
                res.render("photo", { apodData: data });
            } catch (e) {
                console.error(e);
                res.status(500).send('An error occurred');
            }
        });

        app.listen(port, () => {
            console.log(`Web server is running at http://localhost:${port}`);
        });
  } catch(e) {
        console.error(e);
  }
}

async function insertRequest(client, databaseAndCollection, newRequest) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newRequest);
    console.log(`Entry created with id ${result.insertedId}`);
}

main().catch(console.error);