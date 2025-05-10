import { getDb, createUser, client } from "../db.js"
import request from 'supertest'
import app from '../app.js'

export const adminCredentials = {
	username: process.env.ADMIN_USERNAME,
	password: process.env.ADMIN_PASSWORD,
	role: 'ADMIN'
}

export const userCredentials = {
	username: 'user',
	password: 'userpass',
	role: 'USER'
}

export async function getAuthAgent(credentials){
	const user = request.agent(app)
  await user
	.post('/api/auth/login')
	.send(credentials)
	.expect(200)
	return user
}

after(async () => {
	console.log('disconnecting DB')
	await client.close()
	process.exit()
})
export async function getAuthAdmin(){
	return await getAuthAgent(adminCredentials)
}

export async function getAuthUser(){
	return getAuthAgent(userCredentials)
}

export async function setupUsers() {
	const db = await getDb()
	await db.collection('users').drop()
	const adminId = (await createUser(adminCredentials)).insertedId.toString()
	const userId = (await createUser(userCredentials)).insertedId.toString()
	const admin = await getAuthAgent(adminCredentials)
	const user = await getAuthAgent(userCredentials)
	return { user, admin, adminId, userId }
}