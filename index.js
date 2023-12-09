const express = require('express');
const app = express();
const cors = require('cors');

const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require('stripe')(process.env.PYPMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lkveqnp.mongodb.net/?retryWrites=true&w=majority`;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ywokowo.mongodb.net/?retryWrites=true&w=majority`;


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
   
   
    //await client.connect();

    const userCollection = client.db("asmdata").collection("users");
    const assetdataCollection = client.db("asmdata").collection("assetdata");
    const packsgeCollection = client.db("asmdata").collection("packsge");
    const requestCollection = client.db("asmdata").collection("request");
    const makerequestCollection = client.db("asmdata").collection("makerequest");
    const adduserCollection = client.db("asmdata").collection("adduser");
    //const paymentCollection = client.db("asmdata").collection("create-payment-intent");
   

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    // middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    // users related api
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

//.get data by id
app.get('/users/:id', async(req,res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await userCollection.findOne(query);
  res.send(result);
})

app.put("/users/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  console.log("id", id, data);
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedUSer = {
    $set: {
      name:data.name,
      profileurl:data.profileurl,
      dateOfBirth:data.dateOfBirth
    },
  };
  const result = await userCollection.updateOne(
    filter,
    updatedUSer,
    options
  );
  res.send(result);
});



    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email: email}
      const result = await userCollection.findOne(query);
      res.send(result);
    });





    // app.get('/users/admin/:email', async (req, res) => {
    //   const email = req.params.email;

    //   if (email !== req.decoded.email) {
    //     return res.status(403).send({ message: 'forbidden access' })
    //   }

    //   const query = { email: email };
    //   const user = await userCollection.findOne(query);
    //   let admin = false;
    //   if (user) {
    //     admin = user?.role === 'admin';
    //   }
    //   res.send({ admin });
    // })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // app.patch('/users/admin/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const updatedDoc = {
    //     $set: {
    //       role: 'admin'
    //     }
    //   }
    //   const result = await userCollection.updateOne(filter, updatedDoc);
    //   res.send(result);
    // })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

 //for assetData  data endpoint
    app.post('/assetdata', async(req,res)=> {
      const item = req.body;
      const result = await   assetdataCollection.insertOne(item);
      res.send(result);
    })

    //for assetData 
     app.get('/assetdata', async(req,res)=> {
      const result =await assetdataCollection.find().toArray();
      res.send(result)
  })


  //asset delete
  app.delete('/assetdata/:id', async(req,res)=> {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await assetdataCollection.deleteOne(query);
    res.send(result);
  })


  //asset get for updat
  app.get('/assetdata/:id', async(req,res)=> {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await assetdataCollection.findOne(query);
    res.send(result);
  })



//asset update
app.put('/assetdata/:id', async (req, res) => {
  const item = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      productName: item.productName,
      productType: item.productType,
      productQuantity: item.productQuantity,
      date: item.date,
      stockstatus: item.stockstatus,
      assettype: item.assettype,
    },
  };
  try {
    const result = await assetdataCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).send("Internal Server Error");
  }
});


//for em requast data endpoint
app.post('/request', async(req,res)=> {
  const item = req.body;
  const result = await requestCollection.insertOne(item);
  res.send(result);
})
//for admin requas
app.get('/request', async(req,res)=> {
  const result =await requestCollection.find().toArray();
  res.send(result)
})

// //asset update
// app.put('/request/:id', async (req, res) => {
//   const item = req.body;
//   const id = req.params.id;
//   const filter = { _id: new ObjectId(id) };
//   const updateDoc = {
//     $set: {
//       status: item.status,
//       currentDate: new Date(),
//     },
//   };
//   try {
//     const result = await requestCollection.updateOne(filter, updateDoc);
//     res.send(result);
//   } catch (error) {
//     console.error("Error updating asset:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

app.put('/request/:id', async (req, res) => {
  const item = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };

  // Include approvedDate in the update document if status is 'Approve'
  const updateDoc = {
    $set: {
      status: item.status,
    },
  };

  if (item.status === 'Approve') {
    updateDoc.$set.approvedDate = new Date().toISOString();
  }

  try {
    const result = await requestCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).send("Internal Server Error");
  }
});


  //requast delete
  app.delete('/request/:id', async(req,res)=> {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await requestCollection.deleteOne(query);
    res.send(result);
  })






  // // //menu update get data
  // app.patch('/assetdata/:id', async(req,res)=> {
  //   const item =req.body;
  //   const id = req.params.id;
  //   const filter = { _id: new ObjectId(id)}
  //   const updateDoc ={
  //     $set:{
  //       name:item.name,
  //       category:item.price,
  //       recipe: item.recipe,
  //       image: item.image
  //     }
  //   }
  //   const result = await assetdataCollection.updateOne(filter, updateDoc)
  //   res.send(result);
  // })




  //for review data endpoint
  app.get('/packsge', async(req,res)=> {
      const result =await packsgeCollection.find().toArray();
      res.send(result)
  })
//menu update edit data 
// app.get('/menu/:id', async(req,res)=> {
//   const id = req.params.id;
//   const query = {_id: new ObjectId(id)}
//   const result = await menuCollection.findOne(query);
//   res.send(result);
// })

  //for cart data collection
  app.post('/makerequest', async(req, res)=>{
    const item = req.body;
    const result = await makerequestCollection.insertOne(item);
    res.send(result);
  })

  //cart dats geting methood
  app.get('/makerequest', async(req, res)=>{
    const email =req.query.email;
    const query = {email:email}
    const result = await makerequestCollection.find(query).toArray();
    res.send(result);
  })




//makerequest 
app.put('/makerequest/:id', async (req, res) => {
  const item = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };

  const updateDoc = {
    $set: {
      status: item.status, 
    },
  };
  if (item.status === 'Approve') {
    updateDoc.$set.approvedDate = new Date().toISOString();
  }
  try {
    const result = await makerequestCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).send("Internal Server Error");
  }
});

//aduser id
app.post('/adduser', async(req,res)=> {
  const item = req.body;
  const result = await   adduserCollection.insertOne(item);
  res.send(result);
})


  app.get('/adduser', async(req,res)=> {
    const result =await adduserCollection.find().toArray();
    res.send(result)
})


app.delete("/adduser/:id", async (req, res) => {
  const id = req.params.id;
  console.log("delete", id);
  const query = {_id: new ObjectId(id)};
  const result = await adduserCollection.deleteOne(query);
  console.log(result);
  res.send(result);
});



// app.post("/create-payment-intent", async (req, res) => {
//   const { price } = req.body;
//   const amount = price * 100;
  
//   if (!price || amount < 1) {
//     return res.status(400).json({ error: "Invalid amount" });
//   }

//   try {
//     const { client_secret } = await stripe.paymentCollection.create({
//       amount: amount,
//       currency: "usd",
//       payment_method_types: ["card"],
//     });

//     res.send(client_secret);
//   } catch (error) {
//     console.error("Error creating payment intent:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });



// app.post("/create-payment-intent", async (req, res) => {
//   const { price } = req.body;
//   console.log(price);
//   const amount = price * 100;
//   if (!price || amount < 1) {
//     return;
//   }
//   const { client_secret } = await stripe.paymentIntents.create({
//     amount: amount,
//     currency: "usd",
//     payment_method_types: ["card"],
//   });
//   res.send(client_secret);
//   console.log(client_secret);
// });






    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('server is running')
})

app.listen(port, () => {
  console.log(`asset-management is sitting on port ${port}`);
})
