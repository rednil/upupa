import { expect } from 'chai'
import request from 'supertest'
import app from '../app.js'
import { setupUsers, userCredentials } from './tools.js'

var auth


const path = '/api/auth'

describe('routes : auth', () => {
	beforeEach(async ()=> {
		auth = await setupUsers()
	})
	/*
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const username = 'Volzotan Smeik'
      const res = await request(app)
			.post(`${path}/register`)
      .send({
        username,
        password: 'Fogarre'
      })
      .expect(200)
			.then(({body}) =>
				expect(body.username).to.equal(username)
			)
    })
		
    it('should complain if the user exists', async () => {
      const res = await request(app)
      .post(`${path}/register`)
      .send(userCredentials)
      .expect(400)
    })
  })
  */
  describe('POST api/auth/login', () => {
    it('should login a user', () => request(app)
      .post(`${path}/login`)
      .send(userCredentials)
			.expect(200)
			.then(({body}) =>
				expect(body.username).to.equal(userCredentials.username)
			)
    )
		
    it('should not login an unregistered user', () => request(app)
      .post(`${path}/login`)
      .send({
        username: 'Blaubär',
        password: 'Herbert'
      })
			.expect(404)
			.then(({body, redirects, type}) => {
      	expect(redirects.length).to.equal(0)
      	expect(type).to.eql('application/json')
      	expect(body.error).to.eql('WRONG_USERNAME_OR_PASSWORD')
			})
    )
		
  })

  describe(`DELETE ${path}/login`, () => {
    it('should logout a user', () => auth.user
      .delete(`${path}/login`)
			.expect(200)
    )
    it('should throw an error if a user is not logged in', () => request(app)
     	.delete(`${path}/login`)
      .expect(401)
    )
    
  })
	
  describe('GET /self', () => {
    it('should return the correct username', () => auth.user
      .get('/api/self')
			.expect(200)
			.then(({body}) =>
      	expect(body.username).to.eql(userCredentials.username)
			)
    )
    it('should throw an error if a user is not logged in', () => request(app)
      .get('/api/self')
			.expect(401)
    )
  })
		
})