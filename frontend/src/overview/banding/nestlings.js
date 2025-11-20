import { msPerDay, Overview } from "../base"

function getShortDate(date){
	return new Date(date).toLocaleDateString(undefined, {day: "numeric", month: "numeric"})
}

export class OverviewBandingNestlings extends Overview {
	async _getInfo(boxes, lastInspections){
		return boxes.map(box => {
			let text
			let classList = []
			const lastInspection = lastInspections[box._id]
			if(
				lastInspection?.state == 'STATE_BREEDING' ||
				lastInspection?.state == 'STATE_NESTLINGS'
			){
				if(lastInspection.nestlingsBanded > 0){
					text = `Beringt: ${lastInspection.nestlingsBanded}`,
					classList.push('banded')
				}
				else if(
					lastInspection.bandingWindowStart && 
					lastInspection.bandingWindowStart 
					
				){
					const now = new Date()
					const daysRemaining = Math.round((new Date(lastInspection.bandingWindowEnd).getTime() - now.getTime()) / msPerDay)
					if(now > new Date(lastInspection.bandingWindowStart)){
						classList.push('banding')
						if(daysRemaining < 0) {
							text = 'Verpasst'
							classList.push('overdue')
						}
						else if(daysRemaining < 2) {
							classList.push('urgent')
							text = 'Dringend'
						}
						else if(daysRemaining < 4) {
							classList.push('required')
							text = 'Erforderlich'
						}
						else {
							classList.push('possible')
							text = 'Möglich'
						}
					}
					else {
						classList.push('todo')
						text = `${getShortDate(lastInspection.bandingWindowStart)}-${getShortDate(lastInspection.bandingWindowEnd)}`
					}
				}
			}
			return this.attachInfo(box, text, classList)
		})
	}
}