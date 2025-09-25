import express from 'express'
import multer from 'multer'
import zlib from 'zlib'
import { pipeline } from 'stream/promises'
import { Writable } from 'stream'
import fs from 'fs'
import { DB_ADDRESS, designDoc } from '../db.js'
import path from 'path'

var router = express.Router()

// Multer-Konfiguration für Dateiuploads
const upload = multer({ dest: 'uploads/' })

const removeTrailingComma = str => {
	return (str.slice(-1) == ',') ? str.slice(0,-1) : str
}

async function destroyDB(url, cookie){
	try {
    let r = await fetch(`${url}`, {
      method: 'DELETE',
      headers: {
        cookie: cookie
      }
    })
		console.log(`Database deletion response:`, r.status, r.statusText)
		r = await fetch(`${url}`, {
      method: 'PUT',
      headers: {
        cookie: cookie
      }
    })
    console.log(`Database creation response`, r.status, r.statusText)
		r = await fetch(path.join(url, designDoc._id), {
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

async function bulkImportDocs(url, docs, cookie) {
  const response = await fetch(path.join(url, '_bulk_docs'), {
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

router.post('/:target', upload.single('zipFile'), async (req, res, next) => {
	let { target } = req.params
	if(!target.startsWith('http')) target = path.join(DB_ADDRESS, target)
	const source = req.file?.path
	if(!source) {
		return res.status(400).json({ message: 'IMPORT_FAILED', detail: 'SOURCE_MISSING' })
	}
  try {
		const { cookie } = req.headers
		await destroyDB(target, cookie)

    const gunzip = zlib.createGunzip()
    const readStream = fs.createReadStream(source)
    
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
						const response = await bulkImportDocs(target, docsToImport, cookie)
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
				const response = await bulkImportDocs(target, docsToImport, cookie)
				callback(response.status == 201 ? undefined : response)
			}
		})

    await pipeline(readStream, gunzip, collectStream)
    console.log(`Imported ${nDocsImported} documents`)
    res.status(200).json({ message: 'IMPORT_SUCCESSFULL', count: nDocsImported })

  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ message: 'IMPORT_FAILED', detail: error })
  } finally {
 		// Temporäre Datei löschen
    fs.unlinkSync(source)
	}
})

export default router