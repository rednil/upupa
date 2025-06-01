import { LitElement, html, css } from 'lit'
import { translate } from '../translator'

export const INSPECTION_STATES = [
	'STATE_EMPTY',
	'STATE_NEST_BUILDING',
	'STATE_NEST_READY',
	'STATE_EGGS',
	'STATE_BREEDING',
	'STATE_NESTLINGS',
	'STATE_SUCCESS',
	'STATE_OCCUPIED',
	'STATE_ABANDONED'
]
export class SelectState extends LitElement {

  static get properties() {
    return {
      value: { Type: String },
    }
  }

  static get styles() {
    return css`
			
			
    `
  }
		
  render() {
    return html`
      <select @change=${this.changeCb} .value=${this.value}>
				${INSPECTION_STATES.map(state => html`
					<option value=${state}>${translate(state)}</option>
				`)}
			</select>
    `
  }
	changeCb(evt){
		this.value = evt.target.value
		this.dispatchEvent(new CustomEvent('change'))
	}
}

customElements.define('select-state', SelectState)
