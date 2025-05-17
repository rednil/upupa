import { LitElement, html, css } from 'lit'

export class SelectRoute extends LitElement {

  static get properties() {
    return {
      routes: { Type: Array },
			selected: { Type: String }
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
		console.log('render selecte-route', this.selected)
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

const translations = {
	'#/overview': 'Übersicht',
	'#/status': 'Nistkastenkontrolle',
	'#/calendar': 'Beringungskalender',
	'#/users': 'Benutzer',
	'#/map': 'Karte'
}

function translate(key){
	return translations[key]
}

customElements.define('select-route', SelectRoute)
