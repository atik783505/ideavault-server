const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT;
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.use(cors());
app.use(express.json());

async function run() {
    try {
        await client.connect();
        const database = client.db('ideavaultdb')
        const ideas = database.collection('ideascollections')
        const commentCollection = database.collection('comment')

        app.post('/ideas', async (req, res) => {
            const data = req.body
            const result = await ideas.insertOne(data)
            res.send(result)
        })

        app.get('/ideas', async (req, res) => {
            const cursor = ideas.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/ideas/:id', async (req, res) => {
            const { id } = req.params
            const result = await ideas.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })
        app.get('/myideas/:userId', async (req, res) => {
            const { userId } = req.params
            const result = await ideas.find({ userId }).toArray()
            res.send(result)
        })
        app.delete('/myideas/:id', async (req, res) => {
            const { id } = req.params
            const result = await ideas.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })
        app.patch('/myideas/:id', async (req, res) => {
            const { id } = req.params
            const updateData = req.body
            const result = await ideas.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData })
            res.send(result)
        })
        app.post('/comment', async (req, res) => {
            const comment = req.body
            comment.createdAt = new Date();
            const result = await commentCollection.insertOne(comment)
            res.send(result)
        })
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});