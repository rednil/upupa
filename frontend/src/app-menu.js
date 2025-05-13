import { LitElement, html, css } from 'lit'

export class AppMenu extends LitElement {

  static get properties() {
    return {
      selected: { Type: String }
    }
  }

  static get styles() {
    return css`
			button {
				white-space: nowrap;
				border: 0;
				padding: 0.5em;
			}
			.selected{
				
				background-color: lightgray;
			}
    `
  }

	connectedCallback(){
		super.connectedCallback()
		this.selected = window.location.hash
	}

	getMenu(){
		return [
			//['Main Page', ''],
			['Map', '#/box-map'],
			//['Nest Box List', '#/box-list'],
			['Status', '#/box-status'],
			['Users', '#/users'],
		]
	}
	
	nav(evt){
		window.location.hash = this.selected = evt.target.getAttribute('data')
	}
	
  render() {
    return html`
			${this.getMenu().map(([label, path]) => html`
				<button 
					class=${this.selected == path ? 'selected' : ''}
					data=${path} 
					@click=${this.nav}
				>
					${label}
				</button>
			`)}
      
      
    `
  }
}


customElements.define('app-menu', AppMenu)
