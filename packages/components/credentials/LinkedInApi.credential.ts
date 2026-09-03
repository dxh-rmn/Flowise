import { INodeParams, INodeCredential } from '../src/Interface'

class LinkedInApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'LinkedIn API'
        this.name = 'linkedInApi'
        this.version = 1.0
        this.description = 'LinkedIn OAuth 2.0 Bearer Access Token and Organization ID for posting to LinkedIn Profiles and Company Pages.'
        this.inputs = [
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                description: 'LinkedIn OAuth 2.0 Bearer Access Token with w_member_social and/or w_organization_social scopes'
            },
            {
                label: 'Author Type',
                name: 'authorType',
                type: 'options',
                options: [
                    {
                        label: 'Company / Organization Page',
                        name: 'organization',
                        description: 'Publish updates on behalf of a LinkedIn Company / Organization Page'
                    },
                    {
                        label: 'Personal Profile',
                        name: 'person',
                        description: 'Publish updates on behalf of an individual LinkedIn Member profile'
                    }
                ],
                default: 'organization',
                description: 'Choose whether this credential defaults to an Organization Page or a Personal Profile.'
            },
            {
                label: 'Organization ID',
                name: 'organizationId',
                type: 'string',
                placeholder: 'e.g. 12345678 or urn:li:organization:12345678',
                description: 'LinkedIn Company / Organization Page numeric ID. Required when publishing to an Organization Page.',
                optional: true
            },
            {
                label: 'Person URN / Member ID',
                name: 'personUrn',
                type: 'string',
                placeholder: 'e.g. urn:li:person:abcdef1234 or leave blank to auto-detect',
                description: 'Optional personal Member URN or sub ID. If left blank, Flowise will auto-resolve it via /v2/userinfo.',
                optional: true
            }
        ]
    }
}

module.exports = { credClass: LinkedInApi }
