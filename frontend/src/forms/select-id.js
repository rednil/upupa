import { LitElement, html, css } from 'lit'

const promises = {}

const labels = {
	species: 'Vogelart',
	boxes: 'Nistkasten'
}

export class SelectId extends LitElement {
	static get properties() {
		return {
			type: { type: String }, // the api endpoint, e.g. "species"
			value: { type: String }, // the selected _id
			options: { type: Array }, // the api response 
			key: { type: String }, // the key used to name each option, e.g. "name"
			autoselect: { type: Boolean },
			disabled: { type: Boolean }
		}
	}

	static get styles() {
		return css`
			:host(.bold), :host(.bold) select {
				font-weight: bold;
			}
			
		`
	}
	constructor(){
		super()
		this.options = []
	}
	
	render() {
		console.log('render', this.value, typeof this.value)
		return html`
			<label for="select">${labels[this.type] || this.type}</label>
			<select ?disabled=${this.disabled} id="select" @change=${this._changeCb}>
				${this.autoselect ? '' : html`<option>---</option>`}
				${this.options.map(option => html`
					<option ?selected=${option._id==this.value} value="${option._id}">${option[this.key]}</option>
				`)}
			</select>
		`
	}
	
	_changeCb(evt){
		this.value = evt.target.value
		this.dispatchEvent(new Event('change'))
	}
	connectedCallback(){
		super.connectedCallback()
		if(!promises[this.type]){
			promises[this.type] = new Promise(async resolve => {
				const response = await fetch(`/api/${this.type}`)
				const options = await response.json()
				resolve(options)
			})
		}
		promises[this.type].then(options => {
			this.options = options
			console.log('autoselect', this.autoselect, this.value)
			if(this.autoselect && !this.value && options.length>0){
				this.value = options[0]._id
				this.dispatchEvent(new Event('change'))
			}
		})
	}

}

customElements.define('select-id', SelectId)
