import { LitElement, html, css } from 'lit'
import { mcp } from '../mcp'
export class SelectYear extends LitElement {

  static get properties() {
    return {
			value: { type: Number },
			range: { type: Array }
    }
  }

  static get styles() {
    return css`
			.past {
				background-color: red;
				color: white;
				margin: auto;
				padding: 0.1em;
			}
			.past option {
				background-color: white;
				color: initial;
			}
			select{
				border: 0;
				outline: none;
			}
    `
  }
	
	constructor(){
		super()
		this.range = []
		this.currentYear = new Date().getFullYear()
		this.value = this.currentYear
	}
	
  render() {
		return html`
			<select class=${this.getSelectClass()} value=${this.value} @change=${this.changeCb}>
				${this.range.map(year => html`
					<option 
						.selected=${year == this.value}
						value=${year}
					>${year}</option>	
				`)}
			</select>
		`
  }
	getSelectClass(){
		return this.value==this.currentYear ? 'current' : 'past'
	}
	connectedCallback(){
		super.connectedCallback()
		this.fetchFirstInspection()
	}
	async fetchFirstInspection(){
		this.firstYear = this.currentYear
		const firstInspection = (
			await mcp.db()
			.query('upupa/inspections', {
				reduce: false,
				limit: 1
			})
		)
		.rows.map(({key, value}) => value)
		if(firstInspection?.length){
			this.firstYear =  new Date(firstInspection[0].date).getFullYear()
		}
		this.range = []
		for (let i = this.firstYear; i<=this.currentYear; i++) this.range.push(i)
	}
	changeCb(evt){
		this.value = evt.target.value
		this.dispatchEvent(new CustomEvent('change'))
		
	}
}

customElements.define('select-year', SelectYear)
