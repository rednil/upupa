import { mcp } from "../mcp"

export async function fetchLastInspections(year){
	return mcp.db()
	.query('upupa/inspections', {
		group: true,
		group_level: 2,
		startkey: [year],
		endkey: [year, {}],
	})
	.then(({rows}) => rows
		.reduce((obj, {key, value}) => Object.assign(
			obj, {[value.box_id]: value}
		), {})
	)
}