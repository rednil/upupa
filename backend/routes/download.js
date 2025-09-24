import express from 'express'
import { pipeline } from 'stream/promises'
import zlib from 'zlib'

var router = express.Router()

router.get('/', async (req, res, next) => {
	const response = await fetch('http://localhost:8000/api/couch/upupa/_all_docs?include_docs=true',
		{headers: {
			cookie: req.headers.cookie
		}}
	)
	res.setHeader('Content-Type', 'application/zip');
	res.setHeader('Content-Disposition', 'attachment; filename="upupa-export.json.zip"');
	const gzip = zlib.createGzip()
	await pipeline(response.body, gzip, res); 
})

export default router