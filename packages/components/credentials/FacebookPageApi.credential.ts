import { INodeParams, INodeCredential } from '../src/Interface'

class FacebookPageApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Facebook Page API'
        this.name = 'facebookPageApi'
        this.version = 1.0
        this.description = 'Meta Facebook Page Access Token and Page ID for Messenger replies and Page timeline posts.'
        this.inputs = [
            {
                label: 'Page Access Token',
                name: 'accessToken',
                type: 'password',
                description: 'Facebook Page Access Token or System User Access Token from Meta Developer App'
            },
            {
                label: 'Page ID',
                name: 'pageId',
                type: 'string',
                placeholder: 'e.g. 109876543210987',
                description: 'Facebook Page ID (found in Page Settings/About). Optional for Messenger if using /me/messages, required for Page Feed posts.',
                optional: true
            },
            {
                label: 'App Secret',
                name: 'appSecret',
                type: 'password',
                description: 'Meta App Secret for generating appsecret_proof (optional).',
                optional: true
            }
        ]
    }
}

module.exports = { credClass: FacebookPageApi }
