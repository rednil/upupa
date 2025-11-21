import { msPerDay, Overview } from "../base"

function getShortDate(date){
	return new Date(date).toLocaleDateString(undefined, {day: "numeric", month: "numeric"})
}

export class OverviewBandingNestlings extends Overview {
	async _getInfo(boxes){
		return boxes.map(box => {
			let label
			let classList = []
			const lastInspection = box.lastInspections
			if(
				lastInspection?.state == 'STATE_BREEDING' ||
				lastInspection?.state == 'STATE_NESTLINGS'
			){
				if(lastInspection.nestlingsBanded > 0){
					label = `Beringt: ${lastInspection.nestlingsBanded}`,
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
							label = 'Verpasst'
							classList.push('overdue')
						}
						else if(daysRemaining < 2) {
							classList.push('urgent')
							label = 'Dringend'
						}
						else if(daysRemaining < 4) {
							classList.push('required')
							label = 'Erforderlich'
						}
						else {
							classList.push('possible')
							label = 'Möglich'
						}
					}
					else {
						classList.push('todo')
						label = `${getShortDate(lastInspection.bandingWindowStart)}-${getShortDate(lastInspection.bandingWindowEnd)}`
					}
				}
			}
			return this.finalize(box, label, classList)
		})
	}
}