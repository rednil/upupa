import { createProxyMiddleware } from 'http-proxy-middleware'

const couchDbProxyOptions = {
	target: 'http://localhost:5984/',
	changeOrigin: true, // Needed for virtual hosted CouchDBs or if CouchDB uses host headers
	ws: true,           // Proxy websockets for _changes feed if needed
	logLevel: 'debug',  // 'debug' for detailed logging, 'info' for less verbose
	encodePath: false,
	pathRewrite: {
		'^/db': '/dev',	
		//'^/api/couch': '', // Rewrite path: remove '/api' prefix when forwarding to CouchDB
									 // So '/api/mydb/_all_docs' becomes '/mydb/_all_docs' on CouchDB
	},
	// Optional: Add authentication to CouchDB from the proxy if needed
	// headers: {
	//     'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64')
	// }
}

const couch = createProxyMiddleware(couchDbProxyOptions)
export default couch