import { db } from './src/lib/db.js';

async function debug() {
    console.log("Checking DB models...");
    // Prisma client properties are sometimes on the prototype or hidden
    const models = Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$'));
    console.log("DB model keys found:", models);
    
    if (db.contact) {
        console.log("SUCCESS: db.contact exists");
        console.log("Testing a query (findFirst)...");
        try {
            const count = await db.contact.count();
            console.log("Query success! Contact count:", count);
        } catch (e) {
            console.error("Query failed:", e.message);
        }
    } else {
        console.log("FAILURE: db.contact is undefined");
        console.log("All keys in db:", Object.keys(db));
    }
    process.exit(0);
}

debug().catch(console.error);
