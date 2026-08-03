import prisma from '../db.js'

const CategoryModel = {
    findAll: async () => {
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
                id: +catId
            }
        })
    },
}


export { CategoryModel }