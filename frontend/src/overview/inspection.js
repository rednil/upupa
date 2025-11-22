import { msPerDay, Overview } from "./base"

export const currentYear = new Date().getFullYear()

export class OverviewInspection extends Overview {
	async _getInfo(boxes, options){
		const now = new Date().getTime()
		const year = options.year || currentYear
		const isCurrentYear = (year == currentYear)
		// if we are looking on the current year, in the "lastInspection" view
		// we dont want to see boxes that have been relocated or removed
		if(isCurrentYear) boxes = boxes.filter(box => !box.validUntil)
		return boxes.map(box => {
			let label = 'Keine'
			let classList = ['last_inspection']
			const lastInspection = box.lastInspection
			const visits = [new Date(box.validFrom).getTime()]
			if(box.validUntil) visits.push(new Date(box.validUntil).getTime())
			if(lastInspection) visits.push(new Date(lastInspection.date).getTime())
			const lastVisit = Math.max(...visits)
			if(lastVisit > new Date(`${year}-01-01`).getTime()) {
				if(isCurrentYear) {
					const daysPassed = Math.floor((now - lastVisit) / msPerDay)
					label = `${daysPassed}d`
					if(daysPassed < 1) classList.push('lt1d')
					else if(daysPassed < 7) classList.push('lt7d')
					else classList.push('gt7d')
				}
				else  {
					label = new Date(lastVisit).toLocaleDateString()
				}
			}
			return this.finalize(box, label, classList)
		})
	}
}