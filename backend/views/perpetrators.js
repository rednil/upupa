
export const map = doc =>  {
	if (
		doc.type == 'inspection' && doc.perpetrator_id
	) {
		const date = new Date(doc.date)
		const year = date.getFullYear()
		const day = Math.ceil((date - new Date(year, 0, 1)) / 86400000)
		const week = Math.ceil(day / 7)
		emit(
		[
			doc.perpetrator_id,
			year,
			week,
			day
		],
		1
		)  
	}
}

export const view = {
	map: map.toString(),
	reduce: "_stats"
}

export default view