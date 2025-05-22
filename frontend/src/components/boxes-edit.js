import { LitElement, html } from 'lit'
import { proxy } from '../proxy'
export class BoxesEdit extends LitElement {
	static get properties() {
		return {
			item: { type: Object },
			copy: { type: Object}
		}
	}
	constructor(){
		super()
		this.copy = {}
		this.item = {}
	}
	set item(item = {}){
		this._item = item
		this.copy = {...item}
	}
	
	render() {
		return html`
			<div>
				<label for="Name" >Name</label>
				<input id="Name" .value=${this.copy.name || ''} @change=${this.propSetter('name')}>
			</div>
			<div>
				<label for="Breitengrad" >Breitengrad</label>
				<input id="Breitengrad" .value=${this.copy.lat || ''} @change=${this.propSetter('lat')}>
			</div>
			<div>
				<label for="Längengrad" >Längengrad</label>
				<input id="Längengrad" .value=${this.copy.lon || ''} @change=${this.propSetter('lon')}>
			</div>
			<button @click=${this.submit}>Speichern</button>
		`
	}
	propSetter(key){
		return evt => this.copy[key] = evt.target.value
	}
	async submit(){
		const response = await proxy.set('boxes', this.copy, this)
	}
}

customElements.define('boxes-edit', BoxesEdit)
