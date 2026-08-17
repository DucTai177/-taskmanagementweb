import prisma from '../db.js'

const CategoryModel = {
    findAll: async () => {
        console.log("đã vào")
        let data = await prisma.category.findMany()
        console.log("data", data)
        return await prisma.category.findMany()
    },
    create: async (data) => {
        return await prisma.category.create({
            data
        })
    },
    delete: async (catId) => {
        return await prisma.category.delete({
            where: {
                id: catId
            }
        })
    },
}


export { CategoryModel }