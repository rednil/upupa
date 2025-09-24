import express from 'express'
import multer from 'multer'
import zlib from 'zlib'
import { pipeline } from 'stream/promises'
import { Writable } from 'stream'
import fs from 'fs'
import { designDoc } from '../db.js'

var router = express.Router()

// Multer-Konfiguration für Dateiuploads
const upload = multer({ dest: 'uploads/' })

const COUCHDB_URL = 'http://localhost:8000/api/couch/dev' // Passe die URL deiner CouchDB an

const removeTrailingComma = str => {
	return (str.slice(-1) == ',') ? str.slice(0,-1) : str
}

async function destroyDB(cookie){
	try {
    let r = await fetch(`${COUCHDB_URL}`, {
      method: 'DELETE',
      headers: {
        cookie: cookie
      }
    })
		console.log(`Database deletion response:`, r.status, r.statusText)
		r = await fetch(`${COUCHDB_URL}`, {
      method: 'PUT',
      headers: {
        cookie: cookie
      }
    })
    console.log(`Database creation response`, r.status, r.statusText)
		r = await fetch(`${COUCHDB_URL}/${designDoc._id}`, {
      method: 'PUT',
      headers: {
        cookie: cookie
      },
			body: JSON.stringify(designDoc)
    })
    console.log(`Design doc response`, r.status, r.statusText)
  } catch (error) {
    console.error('Error deleting the database:', error)
    throw error
  }
}

async function bulkImportDocs(docs, cookie) {
  const response = await fetch(`${COUCHDB_URL}/_bulk_docs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookie
    },
    body: JSON.stringify({ docs: docs })
  })
	console.log(`Pushed ${docs.length} docs to db: ${response.status} (${response.statusText})`)
	return response
}

router.post('/', upload.single('zipFile'), async (req, res, next) => {
	const path = req.file?.path
	if(!path) {
		return res.status(500).json({ message: 'IMPORT_FAILED', detail: 'FILE_MISSING' })
	}
  try {
		const { cookie } = req.headers
    
		await destroyDB(cookie)

    const gunzip = zlib.createGunzip()
    const source = fs.createReadStream(path)
    
		let nDocsImported = 0
		let info = {}
		let cliffHanger = ''
		let chunkIdx = 0
		let docsToImport = []

		const collectStream = new Writable({
			async write(chunk, encoding, callback) {
				let nDocsParsed = 0
				try {
					const lines = chunk.toString().split('\r\n').filter(Boolean)
					if(chunkIdx == 0) {
						try{
							info = JSON.parse(lines.shift() + ']}')
							console.log(`Uploaded file claims to contain ${info.total_rows} rows`)
						}
						catch(e){}
					}
					lines.forEach((line) => {						
						line = cliffHanger + line
						try{
							const parsedLine = JSON.parse(removeTrailingComma(line))
							cliffHanger = ''
							nDocsParsed++
							if (parsedLine.doc && parsedLine.doc._id) {
								delete parsedLine.doc._rev
								if(!parsedLine.id.startsWith('_design')) docsToImport.push(parsedLine.doc)
							}
							else {
								console.warn('Parsed line doesnt contain doc with _id', parsedLine)
							}
						}
						catch(e){
							cliffHanger = line
						}
					})
					if(docsToImport.length > 1000){
						nDocsImported += docsToImport.length
						const response = await bulkImportDocs(docsToImport, cookie)
						docsToImport = []
						callback(response.status == 201 ? undefined : response)
					}
					else {
						callback()
					}
					
				}
				catch(e){
					console.error('upload error', e)
					callback(e)
				}
				chunkIdx++
			},
			async final(callback) {
				nDocsImported += docsToImport.length
				const response = await bulkImportDocs(docsToImport, cookie)
				callback(response.status == 201 ? undefined : response)
			}
		})

    await pipeline(source, gunzip, collectStream)
    console.log(`Imported ${nDocsImported} documents`)
    res.status(200).json({ message: 'IMPORT_SUCCESSFULL', count: nDocsImported })

  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ message: 'IMPORT_FAILED', detail: error })
  } finally {
 		// Temporäre Datei löschen
    fs.unlinkSync(path)
	}
})

export default router