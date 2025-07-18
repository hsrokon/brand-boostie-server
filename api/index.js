const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const serverless = require("serverless-http");
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aczhr3x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    //users
    const userCollection = client.db("BrandBoostieDB").collection('users');

    app.get('/users/:email', async(req, res)=>{
      const query = {email: req.params.email};
      const user = await userCollection.findOne(query);
      if (user) {
          res.status(200).send(user)
      } else{
        res.status(404).send({message: 'User not found'})
      }
    })

    app.post('/users', async(req, res)=> {
      const user = req.body;
      user.role = "user";
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.patch('/users', async(req, res)=> {
      const query = {email : req.body.email};
      //console.log(query);
      const updateField = {
        $set: {
          lastLoggedIn : req.body.lastLoggedIn
        }
      }
      const result = await userCollection.updateOne(query, updateField);
      
      res.send(result);
    })


    //blogs
    const blogCollection = client.db("BrandBoostieDB").collection("blogs");

    app.post('/blogs', async (req, res) => {
      const blog = req.body;
      blog.createdAt = new Date();
      const user = await userCollection.findOne({ email : blog.email });

      if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: 'Forbidden' });
      }

      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });

    app.get('/blogs', async(req, res)=> {
      const result = await blogCollection.find().toArray();
      res.send(result);
    })

    app.get('/blogs/:id', async(req, res)=> {
      const id = req.params.id;
      const filter = { _id : new ObjectId(id)};
      const result = await blogCollection.findOne(filter);
      res.send(result);
    })

    
    //case study
    const caseStudyCollection = client.db("BrandBoostieDB").collection("caseStudies");

    app.post('/caseStudies', async (req, res) => {
      const caseStudy = req.body;

      const user = await userCollection.findOne({ email: caseStudy.email });
      if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: "Forbidden" });
      }

      caseStudy.createdAt = new Date();

      const result = await caseStudyCollection.insertOne(caseStudy);
      res.send(result);
    });

    app.get('/caseStudies', async(req, res)=> {
      const result = await caseStudyCollection.find().toArray();
      res.send(result);
    })

    app.get('/caseStudies/:id', async(req, res)=> {
      const id = req.params.id;
      const filter = { _id : new ObjectId(id)};
      const result = await caseStudyCollection.findOne(filter);
      res.send(result);
    })


    //payment claims
    const paymentClaimCollection = client.db('BrandBoostieDB').collection('paymentClaims');

    // Save claim
    app.post("/paymentClaims", async (req, res) => {
      const newClaim = req.body;
      newClaim.status = "Received";
      newClaim.isVerified= false;
      const result = await paymentClaimCollection.insertOne(newClaim);
      res.send(result);
    });

    // Update claim status
    app.patch("/paymentClaims/:id/status", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      const filter = { _id: new ObjectId(id) };
      const update = { $set: { status } };

      const result = await paymentClaimCollection.updateOne(filter, update);
      res.send(result);
    });

    // Verify claim
    app.patch("/paymentClaims/:id/verify", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const update = { $set: { isVerified: true } };

      const result = await paymentClaimCollection.updateOne(filter, update);
      res.send(result);
    });

    // Get claims for specific user by email
    app.get("/paymentClaims", async (req, res) => {
      const email = req.query.email;
      const query = email ? { email } : {};
      const result = await paymentClaimCollection.find(query).toArray();
      res.send(result);
    });

    //subscribers
    const subscriberCollection = client.db("BrandBoostieDB").collection("subscribers");

    app.post("/subscribers", async (req, res) => {
      const { email } = req.body;

      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }

      // Prevent duplicate entries
      const alreadyExists = await subscriberCollection.findOne({ email });
      if (alreadyExists) {
        return res.status(409).send({ message: "Already subscribed" });
      }

      const result = await subscriberCollection.insertOne({ email, subscribedAt: new Date() });
      res.send(result);
    });

    app.get("/subscribers", async (req, res) => {
      const subscribers = await subscriberCollection.find().toArray();
      res.send(subscribers);
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', async(req, res)=> {
    res.send("Hi I'm brandboostie's server");
})

module.exports = app;
module.exports.handler = serverless(app);