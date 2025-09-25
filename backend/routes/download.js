import express from 'express'
import { pipeline } from 'stream/promises'
import zlib from 'zlib'
import { DB_ADDRESS } from '../db.js'
import path from 'path'

const urlRegExp = /((?<protocol>\w+):\/\/(?<hostName>[\w\-\.]+)(:(?<port>\d+))?)?((?<proxyPath>.*\/))?(?<dbName>[^/]+)\/?/

var router = express.Router()

router.get('/:url', async (req, res, next) => {
	const { url } = req.params
	if(!url) return res.status(400).json({error: 'URL_MISSING'})
	const urlMatch = url.match(urlRegExp)
	if(!urlMatch) return res.status(400).json({error: 'URL_MALFORMATTED'})
	const target = urlMatch.groups
	if(!target.hostName){
		url = path.join(DB_ADDRESS, url)
	}
	const hostName = (target.hostName || req.host).replace(/\./g, '-')
	const dateStr = new Date().toISOString().split('T')[0]
	const filename = `${hostName}-${target.dbName}-${dateStr}.json.zip`
	console.log('url', url)
	console.log('filename', filename)
	const response = await fetch(path.join(url, '_all_docs?include_docs=true'),
		{headers: {
			cookie: req.headers.cookie
		}}
	)
	res.setHeader('Content-Type', 'application/zip');
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
	const gzip = zlib.createGzip()
	await pipeline(response.body, gzip, res); 
})

export default router