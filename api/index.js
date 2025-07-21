const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const serverless = require("serverless-http");
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gvjpk31.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aczhr3x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gvjpk31.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

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
      const statusNot = req.query.statusNot;

      const query = {};

      if (email) {
        query.email = email;
      }

      if (statusNot) {
        query.status = { $ne: statusNot };
      }

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


    // testimonials
    const testimonialCollection = client.db("BrandBoostieDB").collection("testimonials");
    // GET all testimonials
    app.get("/testimonials", async (req, res) => {
      const data = await testimonialCollection.find().toArray();
      res.send(data);
    });

    // POST a new testimonial
    app.post("/testimonials", async (req, res) => {
      const { name, photo, message, role, email } = req.body;

      if (!name || !photo || !message || !role || !email) {
        return res.status(400).send("Missing fields");
      }

      // Check if this user has a COMPLETED payment claim
      const completedService = await paymentClaimCollection.findOne({
        email,
        status: "Completed",
        isVerified: true,
      });

      if (!completedService) {
        return res.status(403).send({ message: "Only users with completed services can add testimony" });
      }

      const result = await testimonialCollection.insertOne({ name, photo, message, role });
      res.send(result);
    });





    //pricing section
    const pricingCollection = client.db("BrandBoostieDB").collection("pricingPlans");
    // Get all pricing plans
    app.get('/pricingPlans', async (req, res) => {
      const result = await pricingCollection.find().toArray();
      res.send(result);
    });

    // Add a new plan (admin only)
    app.post('/pricingPlans', async (req, res) => {
      const plan = req.body;
      const result = await pricingCollection.insertOne(plan);
      res.send(result);
    });

    // Update an existing plan
    app.patch('/pricingPlans/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await pricingCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    // Delete a plan
    app.delete('/pricingPlans/:id', async (req, res) => {
      const id = req.params.id;
      const result = await pricingCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });




    
    //pricing cards
    const pricingCardCollection = client.db("BrandBoostieDB").collection("pricingCards");

    app.get('/pricingCards', async (req, res) => {
      const result = await pricingCardCollection.find().toArray();
      res.send(result);
    });

    app.post('/pricingCards', async (req, res) => {
      const plan = req.body;

      const user = await userCollection.findOne({ email: plan.email });
      if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: "Forbidden" });
      }

      delete plan.email; // Clean up email after role check
      const result = await pricingCardCollection.insertOne(plan);
      res.send(result);
    });

    app.patch('/pricingCards/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await pricingCardCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.delete('/pricingCards/:id', async (req, res) => {
      const id = req.params.id;
      const result = await pricingCardCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });




    // vouchers collection
    const voucherCollection = client.db("BrandBoostieDB").collection("vouchers");

    // Add a new voucher (Admin)
    app.post('/vouchers', async (req, res) => {
      const voucher = req.body;

      // Basic validation
      if (!voucher.code || !voucher.discountPercentage || !voucher.usageLimit) {
        return res.status(400).send({ message: "Missing voucher code, discount, or usage limit" });
      }

      const existing = await voucherCollection.findOne({ code: voucher.code.trim() });
      if (existing) {
        return res.status(409).send({ message: "Voucher code already exists" });
      }

      // Prepare voucher structure
      const newVoucher = {
        code: voucher.code.trim(),
        discountPercentage: parseInt(voucher.discountPercentage),
        minAmount: voucher.minAmount || 0,
        maxAmount: voucher.maxAmount || Infinity,
        usageLimit: parseInt(voucher.usageLimit),
        usedCount: 0,
        status: "active",
        createdAt: new Date()
      };

      const result = await voucherCollection.insertOne(newVoucher);
      res.send(result);
    });

    // Get all vouchers (Admin)
    app.get('/vouchers', async (req, res) => {
      const vouchers = await voucherCollection.find().toArray();
      res.send(vouchers);
    });

    // Delete a voucher by ID (Admin)
    app.delete('/vouchers/:id', async (req, res) => {
      const id = req.params.id;
      const result = await voucherCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Validate and apply voucher during payment
    app.post('/validate-voucher', async (req, res) => {
      const { code, amount } = req.body;

      if (!code) return res.status(400).send({ valid: false, message: "Missing code" });

      const voucher = await voucherCollection.findOne({ code: code.trim() });

      if (!voucher) return res.status(404).send({ valid: false, message: "Voucher not found" });

      if (voucher.status === "expired" || voucher.usedCount >= voucher.usageLimit) {
        return res.status(400).send({ valid: false, message: "Voucher expired or limit exceeded" });
      }

      // Check min/max if provided
      const price = parseFloat(amount || 0);
      if (voucher.minAmount && price < voucher.minAmount) {
        return res.status(400).send({ valid: false, message: `Minimum amount for voucher is ৳${voucher.minAmount}` });
      }
      if (voucher.maxAmount && price > voucher.maxAmount) {
        return res.status(400).send({ valid: false, message: `Maximum amount for voucher is ৳${voucher.maxAmount}` });
      }

      // Send discount but don't update `usedCount` yet (that should happen after payment)
      return res.send({
        valid: true,
        discount: voucher.discountPercentage,
        voucherId: voucher._id
      });
    });


    app.patch('/vouchers/:id', async (req, res) => {
      const id = req.params.id;
      const update = req.body;

      // Basic validation example (you can expand as needed)
      if (update.code && typeof update.code !== 'string') {
        return res.status(400).send({ message: "Invalid code" });
      }
      if (update.discountPercentage !== undefined) {
        const discount = Number(update.discountPercentage);
        if (isNaN(discount) || discount < 0 || discount > 100) {
          return res.status(400).send({ message: "Invalid discountPercentage" });
        }
        update.discountPercentage = discount;
      }
      if (update.usageLimit !== undefined) {
        const usageLimit = Number(update.usageLimit);
        if (isNaN(usageLimit) || usageLimit < 1) {
          return res.status(400).send({ message: "Invalid usageLimit" });
        }
        update.usageLimit = usageLimit;
      }
      if (update.code) {
        update.code = update.code.trim();
      }

      try {
        const result = await voucherCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: update }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Voucher not found" });
        }

        res.send({ message: "Voucher updated" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update voucher" });
      }
    });


    app.post('/claim-voucher', async (req, res) => {
      const { code } = req.body;

      const voucher = await voucherCollection.findOne({ code });

      if (!voucher || voucher.status === "expired") {
        return res.status(400).send({ message: "Voucher not valid" });
      }

      const updatedCount = voucher.usedCount + 1;
      const updatedStatus = updatedCount >= voucher.usageLimit ? "expired" : "active";

      await voucherCollection.updateOne(
        { code },
        { $set: { usedCount: updatedCount, status: updatedStatus } }
      );

      res.send({ success: true });
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