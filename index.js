const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(
    new URL('http://localhost:3000/api/auth/jwks')
)

const verifyToken = async (req, res, next) => {
    const bearerToken = req.headers.authorization
    if (!bearerToken) {
        return res.status(401).json({ message: 'unauthoeized' })
    }
    const token = bearerToken.split(' ')[1]
    if (!token) {
        return res.status(401).json({ message: 'unauthoeized' })
    }
    try {
        const { payload } = await jwtVerify(token, JWKS)
        console.log(payload)
        next()
    } catch {
        return res.status(401).json({ message: 'unauthoeized' })
    }
}

async function run() {
    try {
        await client.connect();
        const database = client.db('ideavaultdb')
        const ideas = database.collection('ideascollections')
        const commentCollection = database.collection('comment')

        app.post('/ideas',verifyToken, async (req, res) => {
            const data = req.body
            const result = await ideas.insertOne(data)
            res.send(result)
        })

        app.get('/ideas', async (req, res) => {
            const { search, category } = req.query
            const query = {}
            if (search) query.title = { $regex: search, $options: 'i' }
            if (category) query.category = category

            const cursor = ideas.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/ideas/:id', verifyToken, async (req, res) => {
            const { id } = req.params
            const result = await ideas.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })
        app.get('/myideas/:userId',verifyToken, async (req, res) => {
            const { userId } = req.params
            const result = await ideas.find({ userId }).toArray()
            res.send(result)
        })
        app.delete('/myideas/:id',verifyToken, async (req, res) => {
            const { id } = req.params
            const result = await ideas.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })
        app.patch('/myideas/:id',verifyToken, async (req, res) => {
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
        app.get('/comment/:ideaId', async (req, res) => {
            const { ideaId } = req.params
            const result = await commentCollection.find({ ideaId }).toArray()
            res.send(result)
        })
        app.delete('/comment/:id', async (req, res) => {
            const { id } = req.params
            const result = await commentCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })
        app.patch('/comment/:id', async (req, res) => {
            const { id } = req.params
            const updatedData = req.body
            const result = await commentCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData })
            res.send(result)
        })
        app.get('/mycomment/:userId', async (req, res) => {
            const { userId } = req.params
            const result = await commentCollection.find({ userId }).toArray()
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