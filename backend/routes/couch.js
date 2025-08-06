import { createProxyMiddleware } from 'http-proxy-middleware'
import { DB_ADDRESS, DB_NAME } from '../db.js'

const couchDbProxyOptions = {
	target: DB_ADDRESS, // some requests, like _session, target the host, not a particular DB
	changeOrigin: true, // Needed for virtual hosted CouchDBs or if CouchDB uses host headers
	ws: true,           // Proxy websockets for _changes feed if needed
	logLevel: 'debug',  // 'debug' for detailed logging, 'info' for less verbose
	encodePath: false,
	//pathRewrite: {
	//	'^/db': `/${DB_NAME}`,	
	//},
	// Optional: Add authentication to CouchDB from the proxy if needed
	// headers: {
	//     'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64')
	// }
}

const couch = createProxyMiddleware(couchDbProxyOptions)
export default couch