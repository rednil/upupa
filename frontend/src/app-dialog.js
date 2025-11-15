import { LitElement, html, css } from 'lit'

export class AppDialog extends LitElement {
	static get properties() {
		return {
			open: { type: Boolean },
			primary: { type: String },
			primary_disabled: { type: Boolean },
			secondary_disabled: { type: Boolean },
			secondary: { type: String },
			discard: { type: String },
			head: { type: String },
			max: { type: Boolean }
		}
	}

	static get styles() {
		return css`
			.shield {
				position: absolute;
				background-color: black;
				opacity: 0.5;
				left: 0;
				top: 0;
				width: 100%;
				height: 100%;
				z-index: 6000;
			}

			.centerer {
				position: absolute;
				display: flex;
				left: 0;
				top: 0;
				width: 100%;
				height: 100%;
				z-index:6001;
			}
			.window {
				margin: auto;
				background-color: #ededed;
				border-radius: 10px;
				box-shadow: rgba(0, 0, 0, 0.4) 0px 10px 10px;
				display: flex;
				flex-direction: column;
				max-width: 90%;
				max-height: 90%;
				padding-bottom: 1em;
			}
			:host([max]) .window {
				width: 90%;
				height: 90%;
			}
			.content {
				padding: 0 1em;
				display: flex;
				flex: 1;
				flex-direction: column;
				overflow-y: auto;
			}
			.buttons {
				display: flex;
				padding-top: 1em;
				justify-content: space-between;
			}
			button, select, input {
				border: 0;
				padding: 0.5em;
				border-radius: 5px;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
			}
			.head {
				background-color: lightgrey;
				padding: 0.5em;
				text-align: center;
				border-radius: 10px 10px 0 0;
				margin-bottom: 1em;
			}
		`
	}
	constructor(){
		super()
		this.open = false
	}
	render() {
		if(!this.open) return
		return html`
			<div class="shield"></div>
			<div class="centerer" @click=${this._outsideClick}>
				
				<div class="window">
					<div class="head">${this.head}</div>
					<div class="content">
						<slot></slot>
						${this.renderButtons()}
						
					</div>
				</div>
			</div>
		`
	}
	renderButtons(){
		if(this.primary || this.secondary) return html`
			<div class="buttons">
				<button @click=${this._secondaryCb} ?disabled=${this.secondary_disabled}>${this.secondary}</button>
				<button @click=${this._primaryCb} ?disabled=${this.primary_disabled}>${this.primary}</button>
			</div>
		`
	}
	updated(changed){
		if(changed.has('open')){
			if(this.open) {
				history.pushState({ popup: true }, '', '')
				window.addEventListener('popstate', this._popStateHandler)
			}
			else {
				window.removeEventListener('popstate', this._popStateHandler)
			}
		}
	}
	_popStateHandler = () => {
		this._discard()
	}
	_outsideClick(evt){
		if(evt.target.classList.contains('centerer')) this._discard()
	}
	_primaryCb(){
		this.dispatchEvent(new CustomEvent('primary'))
		if(this.discard == "primary") this._discard()
	}
	_secondaryCb(){
		this.dispatchEvent(new CustomEvent('secondary'))
		if(this.discard == "secondary") this._discard()
	}
	_discard(){
		this.open = false
		this.dispatchEvent(new Event('discard'))
	}
}

customElements.define('app-dialog', AppDialog)
