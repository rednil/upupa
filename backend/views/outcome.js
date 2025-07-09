
export const map = doc =>  {
	if (
		doc.type == 'inspection' &&
		(
			doc.state == 'STATE_SUCCESS' || 
			doc.state == 'STATE_FAILURE'
		)
	) {
		const year = new Date(doc.date).getFullYear()

		emit(
			[
				year
			],
			{
				state: doc.state,
				reasonForLoss: doc.reasonForLoss,
				perpetrator_id: doc.perpetrator_id,
				year
			}
		)  
	}
}

export const reduce = (keys, values, rereduce) => {
	if(rereduce){
		return values.reduce((result, value) => {
			Object.entries(value).forEach(([key, count]) => {
				result[key] = (result[key] || 0) + count
			})
			return result
		}, {})
	}
	else {
		return values.reduce((result, { state, reasonForLoss, perpetrator_id }) => {
			let key = 'SUCCESS'
			if(state == 'STATE_FAILURE'){
				if(!reasonForLoss) key = 'UNKNOWN_FAILURE'
				else if(reasonForLoss == 'PREDATION') key = perpetrator_id || 'UNKNOWN_PREDATION'
				else key = reasonForLoss
			}
			result[key] = (result[key] || 0) + 1
			return result
		}, {})
	}
}
export const view = {
	map: map.toString(),
	reduce: reduce.toString()
}

export default view