export const map = doc =>  {
	if (doc.type == 'inspection' && doc.occupancy) {
		const date = new Date(doc.date)
		emit([date.getFullYear(), doc.box_id, doc.occupancy], doc) 
	}
}
export const reduce = (keys, values, rereduce) => {
	let output
	var latest = null
	values.forEach(input => {
		const date = new Date(input.date).getTime()
		if(!latest || (date > latest)){
			latest = date
			output = input
		}
	})
	return output
}


export const summaryByBox = {
	map: map.toString(),
	reduce: reduce.toString()
}
