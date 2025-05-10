import { MongoClient } from 'mongodb'
import { genSaltSync, hashSync } from 'bcrypt'

console.log('DATABASE_NAME', process.env.DATABASE_NAME)
const databaseName = process.env.DATABASE_NAME
const uri = "mongodb://admin:admin@localhost:27017"
const client = new MongoClient(uri)
var db
client.on('open', _=> { 
	console.log('DB connected.')
})
client.on('topologyClosed', _=> {
	db = false
	console.log('DB disconnected.')
})

async function getDb() {
  if(db) return db
	try {
    await client.connect()
		db = client.db(databaseName)
		await ensureAdmin()
		return db
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(1)
  }
}

async function ensureAdmin(){
	const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
	if(await db.collection('users').findOne({ username })) return
	await createUser({username, password, role: 'ADMIN'})
}

async function createUser({username, password, role}){
	const db = await getDb()
  password = hashSync(password, genSaltSync())
	return db.collection('users').insertOne({
		username,
		password,
		role, 
    createdAt: new Date()
	})
}

export { getDb, client, uri, databaseName, createUser }