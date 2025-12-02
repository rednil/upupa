import { mcp } from "../mcp"

export async function fetchBoxesForYear(year){
	return mcp.db()
	.query('upupa/boxes', {
		startkey: [year],
		endkey: [year, {}],
		include_docs: true
	})
	.then(({rows}) => rows.map(view => view.doc))
}