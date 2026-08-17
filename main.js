import express from 'express';
import prisma from './db.js'
import bodyParser from 'body-parser';
import api from './api.js'

const app = express()
const port = 3000


app.use(bodyParser.json())

app.use("/api", api)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})