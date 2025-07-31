import { LitElement, html, css } from 'lit'
import { translate } from '../translator'
import { routes } from '../router'

export class SelectRoute extends LitElement {

  static get properties() {
    return {
			selected: { type: String },
			self: { type: Object }
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
	
	nav(evt){
		window.location.hash = this.selected = evt.target.value
	}
	
  render() {
    return html`
      <select @change=${this.nav}>
				${routes.filter(({menu}) => menu).map(({path}) => html`
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
