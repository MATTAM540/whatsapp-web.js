import { defineConfig } from '@prisma/config'
import * as dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
    datasource: {
        url: process.env.LOCAL_DB_URL,
    },
})
