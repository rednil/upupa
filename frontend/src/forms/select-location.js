import { html, css, LitElement } from 'lit'
import '../components/location-show'
import '../components/location-edit'
import '../app-dialog'


export class SelectLocation extends LitElement {
  static get properties() {
    return {
      value: { type: Object },
			disabled: { type: Boolean }
    }
  }

  static get styles() {
    return css`
			:host {
				display: flex;
				flex-direction: column;
			}
			:host(:not(.valid)) {
				height: fit-content !important;
			}
			location-show {
				flex: 1
			}
			
			location-edit {
				width: 100%;
				height: 100%; 
			}
			button {
				margin-top: 1em;
			}
    `
  }
	render(){
		const validPos = this.value?.lat && this.value?.lon
		if(validPos) this.classList.add('valid')
		else this.classList.remove('valid')
		return html`
			${validPos ? html`
				<location-show .value=${this.value}></location-show>
			`:''}
			${this.disabled ? '': html`
				<button @click=${this.edit}>Ort bearbeiten</button>
			`}
			
			<app-dialog
				max
				primary="OK"
				secondary="Abbrechen"
				@primary=${this.okCb}
				@discard=${() => this.requestUpdate()}
				discard="secondary"
				head="Position festlegen"
			>
				${this.dialog?.open ? html`
					<location-edit
						class="edit"
						showLocationControls
						.value=${this.value}
					></location-edit>
					<slot></slot>
				`:''}
					
				
				
			</app-dialog>
		`
		
	}
	firstUpdated(){
		this.dialog = this.shadowRoot.querySelector('app-dialog')
	}
	edit(){
		//this.editor.value = this.value
		this.dialog.open = true
		//setTimeout(() => this.editor.map.invalidateSize())
		this.requestUpdate()
	}
	okCb(){
		const { value } = this.shadowRoot.querySelector('location-edit')
		if(value.lat != this.value?.lat || value.lon != this.value?.lon){
			this.value = value
			this.dispatchEvent(new Event('change'))
		}
		this.dialog.open = false
	}
}

customElements.define('select-location', SelectLocation)
