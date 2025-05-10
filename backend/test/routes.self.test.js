
import { expect } from 'chai'
import request from 'supertest'
import app from '../app.js'
import { setupUsers, adminCredentials } from './tools.js'


var auth


describe('routes : self', () => {
	beforeEach(async ()=> {
		auth = await setupUsers()
	})
  describe('GET /self', () => {
    it(
			'should return the correct username',
			() => auth.admin.get('/api/self')
			.expect(200)
			.then(({body}) =>
				expect(body.username).to.equal(adminCredentials.username)
			)
    )
    it('should throw an error if a user is not logged in', done => {
      request(app).get('/api/self')
      .expect(401, done)
    })
  })
})

