export const map = doc =>  {
	if (doc.type == 'inspection') {
		const date = new Date(doc.date)
		emit([doc.box_id, date.getFullYear()], doc) 
	}
}
export const reduce = (keys, values, rereduce) => {
	
	if(rereduce){
		let summaries = []
		for (let i = 0; i < values.length; i++) {
			summaries = summaries.concat(values[i])
		}
		return summaries
	}
	else {
		return values.reduce((summaries, inspection) => {
			const species_id = inspection.species_id
			if(species_id){
				
				if(!summaries.length || (summaries[summaries.length-1].species_id != species_id)){
					summaries.push({ species_id })
				}
				
			}
			return summaries
		}, [])
	}
}

export const view = {
	map: map.toString(),
	reduce: reduce.toString()
}

export default view