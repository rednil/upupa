import { LitElement, html, css } from 'lit'
import { translate } from '../translator'

export class ButtonUpload extends LitElement {
	static get properties() {
		return {
			href: { type: String },
			state: { type: String }
		}
	}
	static get styles() {
		return css`
			app-dialog {
				text-align: center;
			}
			app-dialog > * {
				padding: .5em;
			}
			.warning {
				color: red;
				font-weight: bold;
			}
			.success {
				display: none;
				color: green;
				font-weight: bold;
			}
			.STATE_SUCCESS .success {
				display: block;
			}
			.progress {
				display: none;
				font-weight: bold;
				animation: blink 1s linear infinite;
			}
			@keyframes blink {
        0% {
          opacity: 0.2;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.2;
        }
      }
			.STATE_PROGRESS .progress {
				display: block;
			}
		`
	}
	constructor(){
		super()
		this.clear()
	}
	render() {
		return html`
			<button @click=${this.importCb}>Import</button>
			
			<app-dialog
				id="dialog"
				primary=${translate(this.state == 'STATE_SUCCESS' ? 'CLOSE' : 'IMPORT')}
				secondary=${translate('CANCEL')}
				discard="secondary"
				head=${translate('IMPORT_DATA')}
				?primary_disabled=${this.state == 'STATE_INIT' || this.state == 'STATE_PROGRESS'}
				?secondary_disabled=${this.state == 'STATE_PROGRESS' || this.state == 'STATE_SUCCESS'}
				@primary=${this.okCb}
				class=${this.state}
			>
				<div class="warning">Achtung!</div>
				<div>Alle in der Datenbank vorhandenen Daten werden überschrieben!</div>
				
				<form>
					<input @change=${this.fileCb} id="input" type="file" class="form-control-file" name="zipFile">
				</form>
				${this.file.name ? this.renderFileInfo() : ''}
				<div class="warning">${this.error}</div>
				<div class="progress">${translate('PLEASE_WAIT')}</div>
				<div class="success">${translate('IMPORT_SUCCESSFULL')}</div>
      </app-dialog>
		`
	}
	renderFileInfo(){
		return html`
			<div>${`${translate('FILESIZE')}: ${Math.round(this.file.size/1000)} kB`}</div>
			<div>${`${translate('LAST_MODIFIED')}: ${new Date(this.file.lastModified).toLocaleDateString()}`}</div>
		`
	}
	firstUpdated(){
		this.form = this.shadowRoot.querySelector('form')
	}
	clear(){
		this.error = ''
		this.file = {}
		this.state = 'STATE_INIT'
	}
	importCb(){
		this.clear()
		this.shadowRoot.querySelector('input').value = ''
		this.shadowRoot.querySelector('app-dialog').open = true
	}
	fileCb(evt){
		console.log('value', evt.target.value)
		this.formData = new FormData(this.form)
		this.file = this.formData.get('zipFile')
		console.log('file', this.file)
		this.error = ''
		this.state = this.file.name ? 'STATE_READY' : 'STATE_INIT'
	}
	async okCb(){
		this.state = 'STATE_PROGRESS'
		try{
			let response = await fetch("/api/upload", {
				method: "POST",
				body: this.formData,
			})
			if(response.status == 200) this.state = 'STATE_SUCCESS'
			else {
				this.state = 'STATE_ERROR'
				const result = await response.json()
				this.error = result.message
				console.log(result)
			}
		}
		catch(e){
			this.error = `${e.name}: ${e.message}`
			this.state = 'STATE_ERROR'
		}
	}
}

customElements.define('button-upload', ButtonUpload)
