import { LitElement, html, css } from 'lit'
import { mcp } from '../mcp.js'
import '../forms/select-item.js'
import '../forms/select-box.js'
import '../config/box.js'
import '../config/base.js'
import '../config/user.js'
import '../config/project.js'
import '../app/dialog.js'
import { translate } from '../translator.js'
import { setUrlParams } from '../router.js'
import { alert } from '../app/alert.js'
import { confirm } from '../app/confirm.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

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
			const editor = this.shadowRoot.querySelector('.center > *:first-child')
			if(editor != this.editor) {
				this.editor = editor
				editor.addEventListener('change', this.updateTainted.bind(this))
				this.editor.type = this.type
			}
		}
		this.editor.item = this.copy
	}
	async fetchItem(){
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
			case 'box':
			case 'user':
				return unsafeHTML(`<config-${this.type}></config-${this.type}>`)
			default:
				return html`<config-base></config-base>`
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
	}

	async delete(){
		const	response = await this.editor.delete()
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
		const response = await this.editor.submit()
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
	}
}

customElements.define('page-config', PageConfig)
