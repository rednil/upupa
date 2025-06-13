export const map = doc =>  {
	if (doc.type == 'inspection' && doc.occupancy) {
		const date = new Date(doc.date)
		emit([date.getFullYear(), doc.box_id, doc.occupancy, date.getMonth()+1, date.getDate()], doc);  
	}
}
export const reduce = "_last"

export const view = {
	map: map.toString(),
	reduce: reduce.toString()
}

export default view