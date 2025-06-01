import { LitElement, html } from 'lit'

export class ErrorDisplay extends LitElement {
	static get properties() {
		return {
			error: { type: Object },
			msg: { type: String }
		}
	}
	updated(changedProps){
		if(changedProps.has('error')){
			switch(this.error.type){
				case 'fetch-status': return this.handleFetchError()
				default: this.msg = this.error.detail
			}
		}

	}
	render() {
		return html`
			<div>${this.msg}</div>
		`
	}
	async handleFetchError(){
		const response = this.error.detail
    let content, jsonError
    try{
      content = await response.json()
    }catch(e){
      jsonError = e
    }
    if(response){
      this.error = `${response.url} responded with ${response.statusText} (${response.status})`
      if(content?.error) this.error += `: ${content.error}`
      console.error(response, content)
    }
    else if(jsonError) {
      console.error(jsonError.message)
    }
  }
}

customElements.define('error-display', ErrorDisplay)
