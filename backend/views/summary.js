export const map = doc =>  {
	if (doc.type == 'inspection' && doc.occupancy) {
		const date = new Date(doc.date)
		emit([date.getFullYear(), doc.box_id, doc.occupancy], doc) 
	}
}
export const reduce = (keys, values, rereduce) => {
	const bandingStartAge = 7
	const bandingEndAge = 12
	const copyProps = [
		'state',
		'breedingStart',
		'layingStart',
		'hatchDate',
		'reasonForLoss',
		'perpetrator_id',
		'species_id',
		'nestlingsBanded',
		'femaleBanded',
		'maleBanded',
		'nestlings',
		'box_id',
		'occupancy',
		'lastInspection',
		'bandingWindowStart',
		'bandingWindowEnd'
	]
	function inPreparation({state}){
		return (
			state == 'STATE_EMPTY' ||
			state == 'STATE_NEST_BUILDING' ||
			state == 'STATE_NEST_READY'
		)
	}
	
	function isCatastrophic({state}){
		return state == 'STATE_ABANDONED' || state == 'STATE_OCCUPIED'
	}
	
	function incDate(date, days){
		const newDate = new Date(date)
		newDate.setDate(newDate.getDate() + days)
		return newDate
	}
	function createSummary(){
		return {
			clutchSize: 0,
		}
	}
	if(rereduce){
		return values
		.sort((a,b) => new Date(a.lastInspection).getTime()-new Date(b.lastInspection).getTime())
		.reduce(
			(combinedSummary, summary) => {
				copyProps
				.forEach(prop => {
					if (summary[prop]!=null) {
						combinedSummary[prop] = summary[prop]
					}
				})
				if(summary.clutchSize && summary.clutchSize > combinedSummary.clutchSize){
					combinedSummary.clutchSize = summary.clutchSize
				}
				return combinedSummary
			},
			createSummary()
		)
	}

	return values
	.sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime())
	.reduce(
		(summary, inspection) => {
			summary.lastInspection = inspection.date
			if (inPreparation(inspection) || inspection.scope=='OUTSIDE') return summary
			copyProps.forEach(prop => {
				if(inspection[prop] != null) summary[prop] = inspection[prop]
			})
			if(isCatastrophic(inspection)){
				summary.state = 'STATE_FAILURE'
			}
			summary.clutchSize = Math.max(summary.clutchSize, inspection.eggs || 0, inspection.nestlings || 0)
			if(
				summary.state == 'STATE_BREEDING' && 
				!summary.breedingStart &&
				summary.layingStart
			){
				summary.breedingStart = incDate(summary.layingStart, summary.clutchSize)
			}
			if(
				summary.state == 'STATE_EGGS' &&
				!summary.layingStart
			){
				summary.layingStart = incDate(inspection.date, -inspection.eggs)
			}
			if(summary.hatchDate){
				if(!summary.bandingWindowStart){
					summary.bandingWindowStart = incDate(summary.hatchDate, bandingStartAge)
				}
				if(!summary.bandingWindowEnd){
					summary.bandingWindowEnd = incDate(summary.hatchDate, bandingEndAge)
				}
			}
			return summary
		}, 
		createSummary()
	)
}


export const view = {
	map: map.toString(),
	reduce: reduce.toString()
}

export default view