import { LitElement, html, css } from 'lit'

export class AppMain extends LitElement {
  static get properties() {
    return {
      user: { type: Object }
    }
  }

  static get styles() {
    return css`
      :host {
        text-align: center;
        display: flex;
        flex-direction: column;
				flex: 1;
			}

      :host > div {
        margin: auto;
      }
    `
  }
 
  render() {
    return html`
      <div>
        <h1>Main Page</h1>
        <div>You are logged in as ${this.user?.role} "${this.user?.username}"</div>
      </div>
    `
  }
}

customElements.define('app-main', AppMain)
