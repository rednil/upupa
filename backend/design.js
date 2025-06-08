import PouchDB from 'pouchdb'
import inspection from './views/inspection.js'
import summary from './views/summary.js'
import pouchdbFind from 'pouchdb-find'
PouchDB.plugin(pouchdbFind)

const {
	DATABASE_URL,
	ADMIN_USERNAME,
	ADMIN_PASSWORD
} = process.env

console.log('DATABASE_URL', DATABASE_URL)
var db = new PouchDB(DATABASE_URL, {
	auth: {
		username: ADMIN_USERNAME,
		password: ADMIN_PASSWORD
	},
})


export async function ensureDesignDocument() {
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
			inspection,
			typename: {"map": `doc => {	if (doc.type && doc.name) { emit([doc.type, doc.name]) }	}`},
			"box":{"map": `doc => {	if (doc.type == 'box') { emit(doc.name) }	}`},
			"species":{"map": `doc => {	if (doc.type == 'species') { emit(doc.name) }	}`},
			summary
			
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

