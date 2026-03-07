import { defineConfig } from '@prisma/config'
import * as dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
    datasource: {
        url: `${process.env.TURSO_DATABASE_URL}?authToken=${process.env.TURSO_AUTH_TOKEN}`,
    },
})
