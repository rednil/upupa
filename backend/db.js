import { MongoClient } from 'mongodb'
import { genSaltSync, hashSync } from 'bcrypt'

const {
	DATABASE_HOST,
	DATABASE_PORT,
	DATABASE_ROOT_USERNAME,
	DATABASE_ROOT_PASSWORD,
	DATABASE_NAME,
	ADMIN_USERNAME,
	ADMIN_PASSWORD,
} = process.env

console.log('DATABASE_NAME', DATABASE_NAME)

const uri = `mongodb://${DATABASE_ROOT_USERNAME}:${DATABASE_ROOT_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}`
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
		db = client.db(DATABASE_NAME)
		await ensureAdmin()
		return db
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(1)
  }
}

async function ensureAdmin(){
	const username = ADMIN_USERNAME
  const password = ADMIN_PASSWORD
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

export { getDb, client, uri, DATABASE_NAME, createUser }