import { LitElement, html, css } from 'lit'
import { translate } from '../translator'
import { routes } from '../router'

export class SelectRoute extends LitElement {

  static get properties() {
    return {
			selected: { type: String },
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
		
			select {
				border: 0;
				outline: none;
			}
    `
  }
	
	nav(evt){
		this.selected = evt.target.value
		window.location.hash = `#/${this.selected}`
	}
	
  render() {
    return html`
      <select @change=${this.nav}>
				${routes.filter(({menu}) => menu).map(({id}) => html`
					<option value="${id}">${translate(`MENU_${id}`)}</option>
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
