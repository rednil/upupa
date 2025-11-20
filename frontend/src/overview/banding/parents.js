import { Overview } from "../base"

export class OverviewBandingParents extends Overview {
	async _getInfo(boxes, lastInspections){
		return boxes.map(box => {
			let text
			const lastInspection = lastInspections[box._id]
			if(lastInspection?.occupancy) { 
				text = `M: ${lastInspection.maleBanded?'ja':'nein'}, W: ${lastInspection.femaleBanded?'ja':'nein'}`
			}
			return this.attachInfo(box, text)
		})
	}
}