import { Overview } from "./base"

export class OverviewStatus extends Overview {
	async _getInfo(boxes, lastInspections){
		return boxes.map(box => {
			let text, classList
			const lastInspection = lastInspections[box._id]
			if(lastInspection) {
				text = translate(lastInspection.state)
				classList = [lastInspection.state]
			}
			return this.attachInfo(box, text, classList)
		})
	}
}
