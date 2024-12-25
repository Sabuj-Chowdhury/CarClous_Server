const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i53p4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("carCloud-db"); // database
    const carsCollection = db.collection("cars"); //cars collection

    // ********************POST****************************

    // Route to store car details with user info in DB
    app.post("/add-car", async (req, res) => {
      const data = req.body;
      const result = await carsCollection.insertOne(data);
      res.send(result);
    });

    // ********************GET*****************************

    // Route to get all cars posted by that logged in user
    app.get("/my-cars/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "owner.email": email };
      const result = await carsCollection.find(query).toArray();
      res.send(result);
    });

    // Route for single car data from DB by "_id"
    app.get("/car/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carsCollection.findOne(query);
      res.send(result);
    });

    // Route to get all cars or using limit also sorting on price and date added Also search
    app.get("/all-cars", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const sort = req.query.sort;
      const search = req.query.search;

      let sortOptions = {};
      if (sort === "asc") {
        sortOptions = { price: 1 }; // Ascending sort by price
      } else if (sort === "dsc") {
        sortOptions = { price: -1 }; // Descending sort by price
      }

      let query = {};
      if (search) {
        query = {
          $or: [
            { brand: { $regex: search, $options: "i" } },
            { model: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
          ],
        };
      }

      let result;

      if (!isNaN(limit) && limit > 0) {
        result = await carsCollection
          .find(query)
          .sort(sortOptions)
          .limit(limit)
          .toArray();
      } else {
        result = await carsCollection.find(query).sort(sortOptions).toArray();
      }
      res.send(result);
    });

    // ********************PATCH***************************

    // ********************PUT***************************

    // routes for update a single car by id in the DB
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: data,
      };
      const options = { upsert: true };

      const result = await carsCollection.updateOne(filter, update, options);
      res.send(result);
    });

    // ********************DELETE***************************

    // route for deleting a car data from DB
    app.delete("/car/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carsCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

// default route
app.get("/", async (req, res) => {
  res.send("Server running!!!!");
});

// listen
app.listen(port, () => {
  console.log(`server running at ${port}`);
});
