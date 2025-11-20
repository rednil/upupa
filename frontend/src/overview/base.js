import { mcp } from '../mcp'

export const msPerDay = 1000 * 60 * 60 * 24

export class Overview {
	async getInfo(year, mode){
		const boxes = await this.fetchBoxes(year)
		const lastInspections = await this.fetchLastInspections(year)
		return await this._getInfo(boxes, lastInspections, mode)
	}
	async fetchBoxes(year){
		return await mcp.db()
		.query('upupa/boxes', {
			startkey: [year],
			endkey: [year, {}],
			include_docs: true
		})
		.then(({rows}) => rows.map(view => view.doc))
	}
	async fetchLastInspections(year){
		return await mcp.db()
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
	async getNameLookup(type){
		const response = await mcp.getByType(type)
		return response.reduce((obj, {_id, name}) => Object.assign(obj, {[_id]: name}), {})
	}
	attachInfo(box, text='', classList=[]){
		box._info = { text, classList }
		return box
	}
}