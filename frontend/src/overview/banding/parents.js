import { Overview } from "../base"

export class OverviewBandingParents extends Overview {
	async _getInfo(boxes){
		return boxes.map(box => {
			let label
			const lastInspection = box.lastInspection
			if(lastInspection?.occupancy) { 
				label = `M: ${lastInspection.maleBanded?'ja':'nein'}, W: ${lastInspection.femaleBanded?'ja':'nein'}`
			}
			return this.finalize(box, label)
		})
	}
}