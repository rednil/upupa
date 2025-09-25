import { createProxyMiddleware } from 'http-proxy-middleware'
import { DB_ADDRESS } from '../db.js'

/*

This proxies requests to a couchdb. There are several possible use cases

(1) Accessing the local couchdb with urls like 
/api/db/
/api/db/upupa/_local/_uRiDJGs

(2) Accessing a remote upupa installations couchdb with urls like
/api/db/http://remote:8080/api/db/
/api/db/https://remote/api/db/upupa/_local/_uRiDJGs

(3) Accessing a remote couchdb outside upupa
/api/db/http://remote:8080/
/api/db/https://remote/_local/_uRiDJGs

*/

const urlRegExpStr = 'https?:\\/\\/[^\\/:]+(?::\\d+)?\\/'
const urlRegExp = new RegExp(urlRegExpStr)

const route = createProxyMiddleware({
	target: DB_ADDRESS, // Dummy-Target, overwritten by router
	changeOrigin: true,
	ws: true, // important for WebSockets
	logLevel: 'debug',

	router: (req) => {
		const urlMatch = req.originalUrl.match(urlRegExp)
		return urlMatch ? urlMatch[0] : DB_ADDRESS
	},

	pathRewrite: {
		[urlRegExpStr]: '', 
	},
})

export default route