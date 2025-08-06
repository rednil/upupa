import { LitElement, html, css } from 'lit'
import '../forms/select-item.js'
import '../forms/select-box.js'
import '../components/box-edit.js'
import '../components/generic-edit.js'
import '../components/user-edit.js'
import '../components/project-edit.js'
import '../app-dialog.js'
import { Proxy } from '../proxy.js'
import { translate } from '../translator.js'
import { setUrlParams } from '../router.js'

export class PageConfig extends LitElement {
	static get properties() {
		return {
			_id: { type: String },
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
		this.proxy = new Proxy(this)
		this.type = 'box'
		this._item = {}
		this.copy = {}
		this.tainted = false
	}
	set item(item = {}){
		this._item = item
		this.copy = {...item}
	}
	get item(){
		return this._item
	}
	render() {
		return html`
			<app-dialog
				id="delete-dialog"
				primary="Abbrechen"
				secondary="Löschen"
				@secondary=${this.delete}
				discard="primary"
				title="Löschen"
			>
				<div>${this.item.name || this.item.username}</div>
      </app-dialog>
			<app-dialog
				id="missing-prop"
				primary="OK"
				discard="primary"
				title="Fehlende Information"
			>
				<div>Der Eintrag braucht einen Namen!</div>
      </app-dialog>
			<div>
				<div class="top">
					${this.renderHead()}
				</div>
				<div class="center">
					${this.renderConfig()}
				</div>
				<div class="bottom">
					<button @click=${this.confirmDeletion}>Löschen</button>
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
			(this.item && !this.item._id) ? html`<span>Neuer Eintrag</span>` : '' ,
			html`<button .disabled=${this.tainted} @click=${this.addCb}>+</button>`
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
				<option value="user">Benutzer</option>
			</select>
		`
	}
	renderItemSelector(){
		return html`
			<select-item 
				style=${(this.item && !this.item._id) ? 'display:none' : ''}
				.type=${this.type} 
				.value=${this._id} 
				autoselect
				@change=${this.changeItemCb}
			></select-item>
		`
	}
	renderBoxSelector(){
		return html`
			<select-box 
				style=${(this.item && !this.item._id) ? 'display:none' : ''}
				.value=${this._id}
				.year=${this.year}
				autoselect
				@change=${this.changeItemCb}
			></select-box>
		`
	}
	changeCollectionCb(evt){
		this.type = evt.target.value
		setUrlParams({type: this.type})
	}
	changeItemCb(evt){
		this.item = evt.target.item
		this._id = evt.target.value
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
	}
	updateTainted(){
		this.tainted = (JSON.stringify(this._item) != JSON.stringify(this.copy))
	}
	confirmDeletion(){
		this.shadowRoot.querySelector('#delete-dialog').open = true
	}
	async delete(){
		this.shadowRoot.querySelector('#delete-dialog').open = false
		const response = await this.proxy.remove(this.item)
		if(response?.deletedCount){
			this.shadowRoot.querySelector('select-item').fetchData()
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
			_id: this._id
		})
	}
	async submit(){
		if(!this.copy.name) return this.shadowRoot.querySelector('#missing-prop').open = true
		const items = [this.copy] 
		if(this.item._id && !this.copy._id) {
			this.item.validUntil = this.copy.validFrom
			items.push(this.item)
		}
		const response = await this.proxy.bulkDocs(this.type, items)
		if(response[0].ok){
			this._id=response[0].id
			this.updateHistory()
		}
		this.proxy.clearTypeCache(this.type)
		this.shadowRoot.querySelector('select-item').fetchOptions()
		this.item = {...this.copy}
		this.updateTainted()
	}
}

customElements.define('page-config', PageConfig)
