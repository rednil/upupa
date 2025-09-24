import PouchDB from 'pouchdb'

// cannot get pouchdbFind to work in browser with esm style import
// import pouchdbFind from 'pouchdb-find'
// PouchDB.plugin(pouchdbFind)

import inspections from './views/inspections.js'
import summaries from './views/summaries.js'
import stats from './views/stats.js'
import outcome from './views/outcome.js'
import boxes from './views/boxes.js'
import perpetrators from './views/perpetrators.js'

const {
	DATABASE_PROTOCOL,
	DATABASE_HOST,
	DATABASE_PORT,
	DATABASE_NAME,
	ADMIN_USERNAME,
	ADMIN_PASSWORD
} = process.env

const protocol = DATABASE_PROTOCOL || 'http'
const host = DATABASE_HOST || 'localhost'
const port = DATABASE_PORT || 5984

export const DB_ADDRESS = `${protocol}://${host}:${port}`
export const DB_NAME = DATABASE_NAME
export const DB_URL = `${DB_ADDRESS}/${DATABASE_NAME}`

console.log('DATABASE_URL', DB_URL)

export const auth = {
	username: ADMIN_USERNAME,
	password: ADMIN_PASSWORD
}

export const db = new PouchDB(DB_URL, { auth })

export const designDoc = {
	"_id": "_design/upupa",
	"views": {
		inspections,
		summaries,
		stats,
		boxes,
		outcome,
		perpetrators,
		
	}
}

export async function ensureDesignDocument(db) {
	/*
	await db.createIndex({
		"index": {
    	"fields": ["type"]
		},
	})
	*/

  try {
    const existingDoc = await db.get(designDoc._id);
		const copy = { ...existingDoc }
		delete copy._rev
		if(JSON.stringify(copy) != JSON.stringify(designDoc)){
			console.log('Design document changed, updating it')
			await db.put({
				...designDoc,
				_rev: existingDoc._rev,
			})
    	console.log("Design document updated.")
		}
		else {
			console.log('Design document is up-to-date')
		}
  } catch (error) {
    if (error.status === 404) {
      console.log("Design document doesn't exist, creating it")
      await db.put(designDoc)
      console.log("Design document created.")
    } else {
      // Other error, re-throw
      throw error;
    }
  }
}

