import { LitElement, html, css } from 'lit'
import { translate } from '../translator'

export const INSPECTION_STATES = [
	'STATE_EMPTY',
	'STATE_NEST_BUILDING',
	'STATE_NEST_READY',
	'STATE_OCCUPIED',
	'STATE_EGGS',
	'STATE_BREEDING',
	'STATE_NESTLINGS',
	'STATE_SUCCESS',
	'STATE_FAILURE'
]
export class SelectState extends LitElement {

  static get properties() {
    return {
      value: { Type: String },
			lastValue: { Type: String }
    }
  }

  static get styles() {
    return css`
			
			
    `
  }
		
  render() {
    return html`
      <select @change=${this.changeCb} .value=${this.value}>
				${INSPECTION_STATES.map((state, idx) => html`
					<option
						.disabled=${this.isDisabled(idx)}
						.value=${state}
						.selected=${state==this.value}
						>${translate(state)}</option>
				`)}
			</select>
    `
  }
	isDisabled(idx){
		let lastIdx = (
			this.lastValue && 
			this.lastValue != 'STATE_SUCCESS' &&
			this.lastValue != 'STATE_FAILURE'
		 ) ? INSPECTION_STATES.indexOf(this.lastValue) : 0
		const occupancyStarted = (lastIdx >= INSPECTION_STATES.indexOf('STATE_EGGS'))
		const finished = (idx > INSPECTION_STATES.indexOf('STATE_NESTLINGS'))
		const regression = (idx < lastIdx)
		return (
			(occupancyStarted && regression) ||
			(!occupancyStarted && finished)
		)
	}
	changeCb(evt){
		this.value = evt.target.value
		this.dispatchEvent(new CustomEvent('change'))
	}
}

customElements.define('select-state', SelectState)
