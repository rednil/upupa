export const map = doc => {
	if (doc.type == 'inspection') {
		const date = new Date(doc.date)
		emit([date.getFullYear(), doc.box_id], doc); 
	} 
}
export const reduce = (keys, values, rereduce) => {
	var lastValue = null
	var lastDate = null
	values.forEach(value => {
		const date = new Date(value.date)
		if(!lastDate || date.getTime() > lastDate.getTime()){
			lastDate = date
			lastValue = value
		}
	})
	return lastValue
}
export const lastInspection = {
	map: map.toString(),
	reduce: reduce.toString()
}
