import express from 'express';
import { CategoryModel } from '../models/category.model.js';
import axios from 'axios'
const router = express.Router();


router.get("/", async (req, res) => {

    axios.get("https://apiportal.rikkei.edu.vn/dashboard/classes-count")
        .then(res => {
            console.log("res", res)
        })
        .catch(err => {
            console.log("er", err)
        })

    // let data = await CategoryModel.findAll()
    // res.json(data)
})


router.post("/", async (req, res) => {
    let data = await CategoryModel.create(req.body)
    res.json(data)
})

router.delete("/:catId", async (req, res) => {
    let deleteId = req.params.catId;
    let data = await CategoryModel.delete(deleteId)
    res.json(data)
})

export default router


// get http://localhost:3000/api/categories => danh sách danh mục
// get http://localhost:3000/api/categories/category_id => chi tiết 1 danh mục
// post http://localhost:3000/api/categories => thêm mới danh mục (gửi thêm body, object danh mục thêm)
// delete http://localhost:3000/api/categories/category_id => xóa danh mục
// put http://localhost:3000/api/categories/category_id => cập nhật danh mục  (gửi thêm body, object danh mục cần sửa)


// restful api