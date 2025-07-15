const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
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

app.listen(port, ()=> {
    console.log(`Server running on port ${port}`);
})