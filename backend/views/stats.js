const genericMapFunction = doc => {
	if (
		doc.type == 'inspection' &&
		(
			doc.state == 'STATE_SUCCESS' || 
			doc.state == 'STATE_FAILURE'
		)
	) {
		const year = new Date(doc.date).getFullYear()
		let value = doc.__KEY__ || 0

		/* __WILL_BE_UNCOMMENTED__
		if(value){
			const date = new Date(value)
			value = Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / 86400000)
		}
		__WILL_BE_UNCOMMENTED__ */

		emit(
			[
				doc.state,
				year,
				doc.species_id,
				doc.occupancy,
				doc.box_id
			],
			value
		)  
	}
}

function getStatFunction(key, isDate){
	let map = genericMapFunction.toString().replace('__KEY__', key)
	if(isDate) map = map.replace('/* __WILL_BE_UNCOMMENTED__', '').replace('__WILL_BE_UNCOMMENTED__ */', '')
	map = map.replace(/\/\*[\s\S]*?\*\//g, '')
	return {
		map,
		reduce: '_stats'
	}
}

export const clutchSize = getStatFunction('clutchSize')
export const nestlings = getStatFunction('nestlings')
export const nestlingsBanded = getStatFunction('nestlingsBanded')
export const layingStart = getStatFunction('layingStart', true)
export const breedingStart = getStatFunction('breedingStart', true)
export const hatchDate = getStatFunction('hatchDate', true)
