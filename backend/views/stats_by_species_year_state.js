
export const map = doc =>  {
	if (
		doc.type == 'inspection' &&
		(
			doc.state == 'STATE_SUCCESS' || 
			doc.state == 'STATE_FAILURE'
		)
	) {
		const date = new Date(doc.date)
		let incubation = 0
		if(doc.breedingStart && doc.hatchDate){
			const hatchDate = new Date(doc.hatchDate).getTime()
			const breedingStart = new Date(doc.breedingStart).getTime()
			incubation = (hatchDate - breedingStart) / 86400000
		}
		emit(
		[
			doc.species_id,
			date.getFullYear(),
			doc.state,
			doc.occupancy
		],
		[
			doc.clutchSize||0, 
			doc.nestlings||0,
			doc.nestlingsBanded||0,
			incubation
		])  
	}
}

export const view = {
	map: map.toString(),
	reduce: "_stats"
}

export default view