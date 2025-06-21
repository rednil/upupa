
export const map = doc =>  {
	if (
		doc.type == 'inspection' &&
		(
			doc.state == 'STATE_SUCCESS' || 
			doc.state == 'STATE_FAILURE'
		)
	) {
		const date = new Date(doc.date)
		emit(
		[
			date.getFullYear(),
			doc.state,
			doc.species_id,
			doc.occupancy
		],
		[
			doc.clutchSize||0, 
			doc.nestlings||0,
			doc.nestlingsBanded||0
		])  
	}
}

export const view = {
	map: map.toString(),
	reduce: "_stats"
}

export default view