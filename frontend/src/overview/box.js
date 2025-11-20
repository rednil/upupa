import { getBoxLabel } from "../forms/select-box"
import { Overview } from "./base"

export class OverviewBox extends Overview{
	async _getInfo(boxes){
		return boxes.map(box => this.attachInfo(
			box,
			getBoxLabel(box)
		))
	}
}