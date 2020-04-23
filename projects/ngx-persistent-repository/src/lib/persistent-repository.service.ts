import {Injectable, Injector} from "@angular/core";
import {PersistentRepositoryComponentInterface} from "./persistent-repository-component.interface";
import {CookieService} from "ngx-cookie-service";

import * as _ from "lodash";
import {Subject} from "rxjs";

export interface PersistentRepositoryGenericValues {
    [key: string]: any;
}

export interface PersistentRepositoryOptions {
    cookiesEnabled?: boolean;
    cookieConfig?: {
        name: string;
        expire?: number | Date;
        path?: string,
        domain?: string,
        secure?: boolean,
        sameSite?: "Lax" | "None" | "Strict"
    },
    defaults?: PersistentRepositoryGenericValues;
}

export interface PersistentRepositoryData extends PersistentRepositoryOptions {
    cookieLoaded?: boolean;
    data: {
        [key: string]: any;
    }
}

export enum PersistentRepositoryUpdateTypes {
    Initialize, Reset, Update, BulkWrite, OptionsChange
}

export interface PersistentRepositoryPathValue {
    path: string;
    value: any;
}

export interface PersistentRepositoryUpdateMessage {
    type: PersistentRepositoryUpdateTypes,
    data?: PersistentRepositoryGenericValues | PersistentRepositoryPathValue
}

export let PersistentRepositoryInjector: Injector;

@Injectable({
    providedIn: "root"
})
export class PersistentRepositoryService {
    private readonly repository: PersistentRepositoryData;
    private readonly updates: Subject<PersistentRepositoryUpdateMessage> = new Subject<PersistentRepositoryUpdateMessage>();

    constructor(private appInjector: Injector, private cookieService: CookieService) {
        PersistentRepositoryInjector = appInjector;

        this.repository = {
            cookieConfig: {
                name: "NgxPersistentRepository",
                expire: 365,
                secure: false,
                sameSite: "Lax"
            },
            defaults: {},
            data: {}
        };

        this.updates.next({
            type: PersistentRepositoryUpdateTypes.Initialize,
            data: this.repository.data
        });
    }

    private updateCookie = _.debounce(() => {
        this.updateCookieImmediate();
    }, 100, {trailing: true});

    public updateCookieImmediate() {
        if (this.repository.cookiesEnabled) {
            const repositoryData = btoa(JSON.stringify(this.repository.data));
            this.cookieService.set(
                this.repository.cookieConfig.name,
                repositoryData,
                this.repository.cookieConfig.expire,
                this.repository.cookieConfig.path,
                this.repository.cookieConfig.domain,
                this.repository.cookieConfig.secure,
                this.repository.cookieConfig.sameSite
            );
        }

        this.updates.next({
            type: PersistentRepositoryUpdateTypes.BulkWrite,
            data: this.repository.data
        });
    }

    public getUpdateSubject(): Subject<PersistentRepositoryUpdateMessage> {
        return this.updates;
    }

    // noinspection JSUnusedSymbols
    public setOptions(options?: PersistentRepositoryOptions) {
        options = _.clone(options || {});

        if (options.cookieConfig) {
            _.assign(this.repository.cookieConfig, options.cookieConfig);
            delete options.cookieConfig;
        }

        _.assign(this.repository, options);

        this.updates.next({
            type: PersistentRepositoryUpdateTypes.OptionsChange
        });

        this.loadCookieData();
    }

    public setDefaults(defaults: PersistentRepositoryGenericValues) {
        this.repository.defaults = _.cloneDeep(defaults);
        this.setValueDefaults(defaults);
    }

    public enableCookies(enable: boolean) {
        this.repository.cookiesEnabled = enable;
        this.loadCookieData();
    }

    public loadCookieData(force?: boolean) {
        if (this.repository.cookiesEnabled) {
            if (force || !this.repository.cookieLoaded) {
                const base64Data = this.cookieService.get(this.repository.cookieConfig.name);
                if (base64Data) {
                    this.repository.data = JSON.parse(atob(base64Data));
                } else {
                    this.repository.data = {};
                }

                this.repository.cookieLoaded = true;
            }
        } else {
            this.repository.cookieLoaded = false;
        }
    }

    public resetValues() {
        this.repository.data = _.cloneDeep(this.repository.defaults);

        this.updateCookieImmediate();

        this.cookieService.delete(this.repository.cookieConfig.name, this.repository.cookieConfig.path, this.repository.cookieConfig.domain, this.repository.cookieConfig.secure, this.repository.cookieConfig.sameSite);
        this.repository.cookieLoaded = false;

        this.updates.next({
            type: PersistentRepositoryUpdateTypes.Reset,
            data: this.repository.data
        });

    }

    public setModuleValues(module: PersistentRepositoryComponentInterface, values: PersistentRepositoryGenericValues) {
        const name = module.getModuleName();
        this.setValue(`moduleValues.${name}`, values);
    }

    public setModuleValueDefault<T>(module: PersistentRepositoryComponentInterface, path: string, value: T): T {
        const name = module.getModuleName();
        return this.setValueDefault(`moduleValues.${name}.${path}`, value);
    }

    public setModuleValue(module: PersistentRepositoryComponentInterface, path: string, value: any) {
        const name = module.getModuleName();
        this.setValue(`moduleValues.${name}.${path}`, value);
    }

    public setModuleValueDefaults(module: PersistentRepositoryComponentInterface, defaults: PersistentRepositoryGenericValues) {
        if (_.isObject(defaults)) {
            _.forEach(defaults, (value, key) => {
                this.setModuleValueDefault(module, key, value);
            });
        }
    }

    public getModuleValue(module: PersistentRepositoryComponentInterface, path: string): any {
        const name = module.getModuleName();
        return this.getValue(`moduleValues.${name}.${path}`);
    }

    public getModuleValues(module: PersistentRepositoryComponentInterface): any {
        const name = module.getModuleName();
        return _.cloneDeep(this.getValue(`moduleValues.${name}`));
    }

    public clearModuleValue(module: PersistentRepositoryComponentInterface, path: string): void {
        const name = module.getModuleName();
        return this.clearValue(`moduleValues.${name}.${path}`);
    }

    public setValueDefault<T>(path: string, value: T): T {
        if (!_.has(this.repository.data, path)) {
            this.setValue(path, value);
        }

        return this.getValue(path);
    }

    public setValueDefaults(defaults: PersistentRepositoryGenericValues) {
        if (_.isObject(defaults)) {
            _.forEach(defaults, (value, key) => {
                this.setValueDefault(key, value);
            });
        }
    }

    public setValue(path: string, value: any): void {
        _.set(this.repository.data, path, value);

        this.updates.next({
            type: PersistentRepositoryUpdateTypes.Update,
            data: {
                path: path,
                value: value
            }
        });

        this.updateCookie();
    }

    public setValues(values: PersistentRepositoryGenericValues) {
        if (_.isObject(values)) {
            _.forEach(values, (value, key) => {
                this.setValue(key, value);
            });
        }
    }

    public getValue(path: string): any {
        return _.get(this.repository.data, path);
    }

    public getValues(): PersistentRepositoryGenericValues {
        return _.cloneDeep(this.repository.data);
    }

    public clearValue(path: string): void {
        _.unset(this.repository.data, path);
    }

    public inValue(path: string, value: string | number | boolean): boolean {
        const values = this.getValue(path);
        return _.isArray(values) ? values.includes(value) : false;
    }
}
