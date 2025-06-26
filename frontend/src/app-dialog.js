import { LitElement, html, css } from 'lit'

export class AppDialog extends LitElement {
	static get properties() {
		return {
			open: {type: Boolean},
			primary: {type: String},
			secondary: {type: String},
			discard: {type: String},
			title: {type: String}
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
			}
			.content {
				padding: 1em;	
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
			.title {
				background-color: lightgrey;
				padding: 0.5em;
				text-align: center;
				border-radius: 10px 10px 0 0;
			}
		`
	}
	constructor(){
		super()
		this.open = false
	}
	_primaryCb(){
		this.dispatchEvent(new CustomEvent('primary'))
		if(this.discard == "primary") this.open = false
	}
	_secondaryCb(){
		this.dispatchEvent(new CustomEvent('secondary'))
		if(this.discard == "secondary") this.open = false
	}
	render() {
		if(!this.open) return
		return html`
			<div class="shield"></div>
			<div class="centerer">
				
				<div class="window">
					<div class="title">${this.title}</div>
					<div class="content">
						<slot></slot>
						<div class="buttons">
							<button @click=${this._secondaryCb}>${this.secondary}</button>
							<button @click=${this._primaryCb}>${this.primary}</button>
						</div>
					</div>
				</div>
			</div>
		`
	}
}

customElements.define('app-dialog', AppDialog)
