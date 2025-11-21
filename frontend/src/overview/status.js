import { Overview } from "./base"

export class OverviewStatus extends Overview {
	async _getInfo(boxes){
		return boxes.map(box => {
			let label, classList
			const lastInspection = box.lastInspection
			if(lastInspection) {
				label = translate(lastInspection.state)
				classList = [lastInspection.state]
			}
			return this.finalize(box, label, classList)
		})
	}
}
