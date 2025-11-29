import { mcp } from "../mcp"
import { getUsers } from "./users"

async function idStartsWith(str, options){
	options.startkey = str
	options.endkey = str + '\ufff0' 
	if(options.descending) {
		options.startkey = options.endkey
		options.endkey = str
	}
	return await mcp.project.localDB.allDocs(options)
}
export async function allDocsByType(type){
	switch(type){
		case 'user': return await getUsers()
		case 'project': return await getProjects()
		default: {
			return (await idStartsWith(`${type}-`, {
				include_docs: true
			}))
			.rows.map(row => row.doc)
			.sort((a,b) => ('' + a.name).localeCompare(b.name))
		}
	}
}
async function getProjects(){
	return (
		await mcp.db('project')
		.allDocs({include_docs: true})
	)
	.rows.map(row => row.doc)
}
