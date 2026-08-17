import { INodeParams, INodeCredential } from '../src/Interface'

class WhatsAppCloudApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'WhatsApp Cloud API'
        this.name = 'whatsAppCloudApi'
        this.version = 1.0
        this.description = 'Meta WhatsApp Business Cloud API Permanent/Temporary Access Token and Phone Number ID.'
        this.inputs = [
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                description: 'Meta WhatsApp Business Cloud API Access Token'
            },
            {
                label: 'Phone Number ID',
                name: 'phoneNumberId',
                type: 'string',
                placeholder: 'e.g. 109876543210987',
                description: 'WhatsApp Business Account Phone Number ID from Meta App Dashboard'
            }
        ]
    }
}

module.exports = { credClass: WhatsAppCloudApi }
