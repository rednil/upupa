import { LitElement, css } from "lit"

export class AnalysisBase extends LitElement {
	static get properties() {
		return {
			species_id: { type: String }
		}
	}
	static get styles() {
		return css`
      :host > * {
				padding: 1em 0.5em 0 0.5em;
			}
		`
	}
}