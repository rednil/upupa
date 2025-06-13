import PouchDB from 'pouchdb'

// cannot get pouchdbFind to work in browser with esm style import
// import pouchdbFind from 'pouchdb-find'
// PouchDB.plugin(pouchdbFind)

import inspections from './views/inspections.js'
import summaries from './views/summaries.js'

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

export async function ensureDesignDocument(db) {
	/*
	await db.createIndex({
		"index": {
    	"fields": ["type"]
		},
	})
	*/
  const designDocId = "_design/upupa";
  const newDesignDoc = {
    "_id": "_design/upupa",
		"views": {
			inspections,
			summaries
		}
  };

  try {
    const existingDoc = await db.get(designDocId);
    // If the design document exists, update it with the new content
    // and preserve the _rev
    await db.put({
      ...newDesignDoc,
      _rev: existingDoc._rev,
    });
    console.log("Design document 'upupa' updated.");
  } catch (error) {
    if (error.status === 404) {
      // Design document doesn't exist, create it
      await db.put(newDesignDoc);
      console.log("Design document 'upupa' created.");
    } else {
      // Other error, re-throw
      throw error;
    }
  }
}

