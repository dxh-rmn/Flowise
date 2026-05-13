import express, { Application, NextFunction, Request, Response } from 'express'
import { Platform } from './Interface'

export class IdentityManager {
    private static instance: IdentityManager
    licenseValid: boolean = true
    currentInstancePlatform: Platform = Platform.OPEN_SOURCE

    public static async getInstance(): Promise<IdentityManager> {
        if (!IdentityManager.instance) {
            IdentityManager.instance = new IdentityManager()
            await IdentityManager.instance.initialize()
        }
        return IdentityManager.instance
    }

    public async initialize() {
        // No-op for open source
    }

    public getPlatformType = () => {
        return this.currentInstancePlatform
    }

    public getPermissions = () => {
        return {}
    }

    public isEnterprise = () => {
        return false
    }

    public isCloud = () => {
        return false
    }

    public isOpenSource = () => {
        return true
    }

    public isLicenseValid = () => {
        return true
    }

    public initializeSSO = async (app: express.Application) => {
        // No-op
    }

    public static checkFeatureByPlan(feature: string) {
        return (req: Request, res: Response, next: NextFunction) => {
            return next()
        }
    }

    public async getFeaturesByPlan(subscriptionId: string, withoutCache: boolean = false) {
        return {}
    }
}
