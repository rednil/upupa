
export const map = doc =>  {
	if (
		doc.type == 'inspection' &&
		(
			doc.state == 'STATE_SUCCESS' || 
			doc.state == 'STATE_FAILURE'
		)
	) {
		const date = new Date(doc.date)
		let layingStart = 0, breedingStart = 0, hatchDate = 0
		
		if(doc.layingStart) {
			const date = new Date(doc.layingStart)
			layingStart = Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / 86400000)
		}
		if(doc.breedingStart){
			const date = new Date(doc.breedingStart)
			breedingStart = Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / 86400000)
		}
		if(doc.hatchDate){
			const date = new Date(doc.hatchDate)
			hatchDate = Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / 86400000)
		}
		emit(
		[
			doc.state,
			date.getFullYear(),
			doc.species_id,
			doc.occupancy,
			doc.box_id
		],
		[
			doc.clutchSize||0, 
			doc.nestlings||0,
			doc.nestlingsBanded||0,
			layingStart,
			breedingStart,
			hatchDate
		])  
	}
}

export const view = {
	map: map.toString(),
	reduce: "_stats"
}

export default view