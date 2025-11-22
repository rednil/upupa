import { LitElement, html, css } from 'lit'
import { mcp } from '../mcp.js'
import '../forms/select-item.js'
import '../forms/select-box.js'
import '../components/box-edit.js'
import '../components/generic-edit.js'
import '../components/user-edit.js'
import '../components/project-edit.js'
import '../app-dialog.js'
import { translate } from '../translator.js'
import { setUrlParams } from '../router.js'
import { alert } from '../forms/alert.js'
import { confirm } from '../forms/confirm.js'

export class PageConfig extends LitElement {
	static get properties() {
		return {
			id: { type: String },
			item: { type: Object },
			copy: { type: Object},
			type: { type: String },
			tainted: { type: Boolean },
			year: { type: Number }
		}
	}
	static get styles() {
		return css`
			:host  {
				flex: 1;
				overflow-y: auto;
			}
			:host > div {
				min-height: 0;
			}
			:host > div > div {
				max-width: 40em;
				margin: 0 auto;
				padding: 0.5em;
			}
			.top {
				display: flex;
				justify-content: space-between;
			}
			.bottom {
				overflow-y: auto;
			}
			.bottom {
				display: flex;
				justify-content: space-between
			}
		`
	}
	constructor(){
		super()
		this.type = 'box'
		this.item = {}
		this.copy = {}
		this.tainted = false
	}
	
	render() {
		return html`
			
			<div>
				<div class="top">
					${this.renderHead()}
				</div>
				<div class="center">
					${this.renderConfig()}
				</div>
				<div class="bottom">
					${this.item?._id ? html`
						<button @click=${this.delete}>Löschen</button>
					`:''}
					<button .disabled=${!this.tainted} @click=${this.cancel}>Änderungen verwerfen</button>
					<button .disabled=${!this.tainted} @click=${this.submit}>Speichern</button>
				</div>
			</div>
			
		`
	}
	renderHead(){
		return [
			this.renderTypeSelector(),
			this.type == 'box' ? this.renderBoxSelector() : this.renderItemSelector(),
			(this.item && !this.item._id && !this.fetching) ? html`<span>Neuer Eintrag</span>` : '' ,
			html`<button ?disabled=${this.tainted || this.fetching} @click=${this.addCb}>+</button>`
		]
	}
	renderTypeSelector(){
		return html`
			<select .value=${this.type} @change=${this.changeCollectionCb}>
				<option value="project">Projekt</option>
				<option value="box">Nistkasten</option>
				<option value="architecture">${translate('ARCHITECTURE')}</option>
				<option value="species">Vogelart</option>
				<option value="perpetrator">Eindringling</option>
				<option value="mounting">Anbringung</option>
				<option value="user">Benutzer</option>
			</select>
		`
	}
	renderItemSelector(){
		return html`
			<select-item
				class="itemselector"
				style=${(this.item && !this.item._id) ? 'display:none' : ''}
				.type=${this.type} 
				.value=${this.id} 
				autoselect
				@change=${this.changeItemCb}
			></select-item>
		`
	}
	renderBoxSelector(){
		return html`
			<select-box
				class="itemselector"
				style=${(this.item && !this.item._id) ? 'display:none' : ''}
				.value=${this.id}
				.year=${this.year}
				autoselect
				@change=${this.changeItemCb}
			></select-box>
		`
	}
	changeCollectionCb(evt){
		this.id = null
		this.type = evt.target.value
		this.updateHistory()
	}
	willUpdate(changed){
		if(changed.has('id')) this.fetchItem()
	}
	updated(changed){
		if(changed.has('type')) {
			this.editor = this.shadowRoot.querySelector('.center > *:first-child')
		}
	}
	async fetchItem(){
		console.log('fetchItem')
		this.fetching = true
		this.item = this.id ? await mcp.db(this.type).get(this.id) : {}
		this.copy = {...this.item}
		this.fetching = false
		this.updateTainted()
	}
	async changeItemCb(evt){
		this.id = evt.target.value
		this.updateHistory()
	}
	renderConfig(){
		switch(this.type){
			case 'project':
				return html`<project-edit .item=${this.copy} @change=${this.updateTainted}></project-edit>`
			case 'box':
				return html`<box-edit .item=${this.copy} @change=${this.updateTainted}></box-edit>`
			case 'user':
				return html`<user-edit .item=${this.copy} @change=${this.updateTainted}></user-edit>`
			default:
				return html`<generic-edit .item=${this.copy} @change=${this.updateTainted}></generic-edit>`
		}
	}
	addCb(){
		this._backupItem = {...this.item}
		this.tainted = true
		this.item = {
			type: this.type,
		}
		this.copy = {...this.item}
	}
	updateTainted(){
		this.tainted = (JSON.stringify(this.item) != JSON.stringify(this.copy))
		if(this.tainted) console.log('tainted', this.item, this.copy)
	}

	async delete(){
		let response
		if(this.editor.delete) {
			response = await this.editor.delete()
		}
		else {
			const confirmation = await confirm(`${this.item.name || this.item.username} löschen?`)
			if(confirmation) {
				response = await mcp.db(this.type).remove(this.item)
			}
		}
		console.log('delete response', response)
		if(response?.ok){
			this.shadowRoot.querySelector('.itemselector').fetchOptions()
		}
	}
	cancel(){
		if(this._backupItem) {
			this.item = this._backupItem
			delete this._backupItem
		}
		this.copy = {...this.item}
		this.tainted = false
	}
	updateHistory(){
		setUrlParams({
			type: this.type,
			id: this.id
		}, true)
	}
	async submit(){
		if(!this.copy.name) return alert(translate('MISSING_NAME'))
		let response = null
		if(this.editor.submit) {
			response = await this.editor.submit()
		}
		else {
			response = await mcp.db(this.type).put(mcp.finalize(this.copy))
		}
		console.log('response', response)
		if(response?.ok){
			if(response.id == this.id){
				await this.fetchItem()
				this.updateTainted()
			}
			else {
				this.id = response.id // this will trigger fetchItem and updateTaintet
				this.updateHistory()
			}
			this.shadowRoot.querySelector('.itemselector').fetchOptions()
		}
		/*
		this.copy.type = this.type
		const items = [this.copy]
		if(this.item._id && !this.copy._id) {
			delete this.copy._rev
			this.item.validUntil = this.copy.validFrom
			items.push(this.item)
		}
		
		if(response[0].ok){
			this.id=response[0].id
			this.updateHistory()
		}
		
		*/
	}
}

customElements.define('page-config', PageConfig)
