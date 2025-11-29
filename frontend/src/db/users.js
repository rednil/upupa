import { mcp } from "../mcp"
export const userPrefix = 'org.couchdb.user'

export async function getUsers(){
	return (
		await mcp.project.userDB.allDocs({
			startkey: userPrefix,
			endkey: userPrefix + '\ufff0', 
			include_docs: true,
		})
	)
	.rows.map(row => row.doc)
}