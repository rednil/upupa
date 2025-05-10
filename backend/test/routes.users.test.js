import { expect } from 'chai'
import request from 'supertest'
import app from '../app.js'
import { setupUsers, userCredentials } from './tools.js'

var auth


/*
async function getUser(){
  const user = await knex('users').where({username: helpers.userCredentials.username}).first()
  return user
}
*/
describe('routes : users', () => {
	beforeEach(async ()=> {
		auth = await setupUsers()
	})
  describe('GET /users', () => {
    it(
			'should return a list of all users if logged in as admin',
			() => auth.admin
      .get('/api/users')
      .expect(200)
			.then(({body}) =>
				expect(body.length).to.equal(2)
			)
    )
    it(
			'should throw an error if a user is not logged in',
			() =>	request(app)
      .get('/api/users')
      .expect(401)
    )
		it(
			'should return only one user if logged in as user',
			() => auth.user
      .get('/api/users')
      .expect(200)
			.then(({body}) =>
				expect(body.length).to.equal(1)
			)
    )
  })
	
  describe('GET /users/:id', () => {
    it('should return the respective user',
			() => auth.user
      .get(`/api/users/${auth.userId}`)
			.expect(200)
			.then(({body}) =>
				expect(body.username).to.equal(userCredentials.username)
			)
    )
    it('should throw an error if a user is not logged in',
			() =>	request(app)
      .get(`/api/users/${auth.userId}`)
      .expect(401)
    )
		
		it('should throw an error if a user requests another users info',
			() => auth.user
      .get(`/api/users/${auth.adminId}`)
      .expect(403)
    )
    it('should throw an error if the id doesnt exist',
			() => auth.admin
			.get(`/api/users/aaaaaaaaaaaaaaaaaaaaaaaa`)
      .expect(404)
    )
  })
	
  describe('DELETE /users/:id', () => {
    it('should delete the respective user',
			async () => {
				await auth.admin
      	.delete(`/api/users/${auth.userId}`)
      	.expect(200)
				await auth.admin
				.get(`/api/users/${auth.userId}`)
				.expect(404)
			}
    )
    it('should throw an error if a user is not logged in',
			async () =>	{
				await request(app)
				.delete(`/api/users/${auth.userId}`)
				.expect(401)
				await auth.admin
				.get(`/api/users/${auth.userId}`)
				.expect(200)
			}
    )
    it('should throw an error if called by user without admin privileges',
			async () => {
				await auth.user
				.delete(`/api/users/${auth.userId}`)
				.expect(403)
				await auth.admin
				.get(`/api/users/${auth.userId}`)
				.expect(200)
			}
    )	
  })
	
  describe('POST /users/', () => {
    it('should create the respective user', 
			async () => {
				const user = {
					username: 'Quert Zuiopü',
					password: 'sEcrEt',
					role: 'USER'
				}
				await auth.admin
      	.post(`/api/users/`)
				.send(user)
				.expect(200)
				.then(({body}) => {
					matchRoleAndUsername(body, user)
					expect(body._id).to.exist
				})
			}	  
    )
  })
	
  describe('PUT /users/:id', () => {
    it('should modify the respective user',
			async () => {
				const changes = {
					username: 'Quert Zuiopü',
					password: 'sEcrEt',
					role: 'ADMIN'
				}
				await auth.admin
				.put(`/api/users/${auth.userId}`)
				.send(changes)
				.expect(200)
				.then(({body}) => {
					matchRoleAndUsername(body, changes)
					expect(body._id).to.eql(auth.userId)
				})
				await auth.admin
				.get(`/api/users/${auth.userId}`)
				.expect(200)
				.then(({body}) => {
					matchRoleAndUsername(body, changes)
				})
    })
    it('should keep unchanged properties', 
			async() => {
				const changes = {
					username: 'Quert Zuiopü',
				}
				await auth.admin
				.put(`/api/users/${auth.userId}`)
				.send(changes)
				.expect(200)
				.then(({body}) => {
					expect(body.username).to.equal(changes.username)
					expect(body.role).to.eql(userCredentials.role)
				})
				await auth.admin
				.get(`/api/users/${auth.userId}`)
				.expect(200)
				.then(({body}) => {
					expect(body.username).to.equal(changes.username)
					expect(body.role).to.eql(userCredentials.role)
				})
			}
    )
    it('should throw an error if a user is not logged in',
			() => request(app)
			.put(`/api/users/${auth.userId}`)
			.send({username: 'Quert Zuiopü'})
			.expect(401)
		)
		it('should throw an error if called by user without admin privileges',
			() => auth.user
			.put(`/api/users/${auth.userId}`)
			.send({username: 'Quert Zuiopü'})
			.expect(403)
		)
  })
	
})

function matchRoleAndUsername(a,b) {
	expect(a.username).to.equal(b.username)
	expect(a.role).to.eql(b.role)
}