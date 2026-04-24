import mongoose from "mongoose"
import { afterAll, beforeAll } from "vitest"

beforeAll(async () => {
    await mongoose.connect('mongodb://admin:super_admin@localhost:27017/graphql-test?authSource=admin')
    await mongoose.connection.db?.dropDatabase()
})

afterAll(async () => {
    await mongoose.connection.destroy()
})