import { LitElement, html, css } from 'lit'
import { translate } from '../translator'
export class SelectRoute extends LitElement {

  static get properties() {
    return {
      routes: { Type: Array },
			selected: { Type: String },
			self: { Type: Object }
    }
  }

  static get styles() {
    return css`
			select {
				direction: rtl;
				text-align: left;
				border: 0;

			}
			select option {
				direction: ltr;
			}
			
    `
  }
	constructor(){
		super()
		this.routes = []
	}
	
	nav(evt){
		window.location.hash = this.selected = evt.target.value
	}
	
  render() {
    return html`
      <select @change=${this.nav}>
				${this.routes.filter(({menu}) => menu).map(({path}) => html`
					<option value="${path}">${translate(path)}</option>
				`)}
			</select>
    `
  }
	updated() {
		// the select is not changing its value automatically
    this.shadowRoot.querySelector('select').value = this.selected
  }
}

customElements.define('select-route', SelectRoute)
