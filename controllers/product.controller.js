import express from 'express';
const router = express.Router();


router.get("/", (req, res) => {
    res.end("danh sách product")
})

export default router