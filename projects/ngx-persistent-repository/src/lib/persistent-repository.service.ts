import {Injectable, Injector} from "@angular/core";
import {PersistentRepositoryComponentInterface} from "./persistent-repository-component.interface";
import {CookieService} from "ngx-cookie-service";
import LZUTF8 from "lzutf8";

import * as _ from "lodash";
import {Subject} from "rxjs";
import {hasDirectiveDecorator} from "@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector";

export interface PersistentRepositoryGenericValues {
    [key: string]: any;
}

export interface PersistentRepositoryOptions {
    cookiesEnabled?: boolean;
    databaseHandle?: number | string
    cookieConfig?: {
        name: string;
        expires?: number | Date;
        path?: string,
        domain?: string,
        secure?: boolean,
        sameSite?: "Lax" | "None" | "Strict"
    },
    defaults?: PersistentRepositoryGenericValues;
}

export interface PersistentRepositoryData extends PersistentRepositoryOptions {
    data: PersistentRepositoryGenericValues
}

export enum PersistentRepositoryUpdateTypes {
    Startup, PersistentDataRead, Reset, Update, PersistentDataWritten
}

export interface PersistentRepositoryUpdateMessage {
    type: PersistentRepositoryUpdateTypes;
    databaseHandle: number | string;
    data: PersistentRepositoryGenericValues;
    path?: string;
    value?: any;
}

export let PersistentRepositoryInjector: Injector;

@Injectable({
    providedIn: "root"
})
export class PersistentRepositoryService {
    private readonly repository: PersistentRepositoryData;
    private readonly updates: Subject<PersistentRepositoryUpdateMessage> = new Subject<PersistentRepositoryUpdateMessage>();

    private fetchPersistentDataHook: (databaseHandle: string | number) => Promise<PersistentRepositoryGenericValues>;
    private writePersistentDataHook: (databaseHandle: string | number, data: PersistentRepositoryGenericValues) => Promise<void>;

    constructor(private appInjector: Injector, private cookieService: CookieService) {
        PersistentRepositoryInjector = appInjector;

        this.repository = {
            cookieConfig: {
                name: "NgxPersistentRepository",
                expires: 365,
                secure: false,
                sameSite: "Lax"
            },
            defaults: {},
            data: {}
        };

        this.updates.next({
            type: PersistentRepositoryUpdateTypes.Startup,
            databaseHandle: this.repository.databaseHandle,
            data: this.repository.data
        });
    }

    private updatePersistentData = _.debounce(() => {
        this.updatePersistentDataImmediate().catch();
    }, 100, {trailing: true});

    public updatePersistentDataImmediate(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.repository.cookiesEnabled) {
                let payload: any;

                if (this.repository.databaseHandle) {
                    payload = {
                        useDbData: true,
                        databaseHandle: this.repository.databaseHandle
                    };
                } else {
                    payload = this.repository.data;
                }

                const data = LZUTF8.compress(JSON.stringify(payload), {outputEncoding: "Base64"});

                if (data.length >= 4000) {
                    console.error("warning: compressed persistent repository size exceeds the maximal cookie length (4KB). Consider storing the persistent data in a database!");
                } else {
                    this.cookieService.set(
                        this.repository.cookieConfig.name,
                        data,
                        this.repository.cookieConfig.expires,
                        this.repository.cookieConfig.path,
                        this.repository.cookieConfig.domain,
                        this.repository.cookieConfig.secure,
                        this.repository.cookieConfig.sameSite
                    );
                }

                if (this.repository.databaseHandle) {
                    if (this.writePersistentDataHook) {
                        this.writePersistentDataHook(this.repository.databaseHandle, this.repository.data).then(() => {
                            this.updates.next({
                                type: PersistentRepositoryUpdateTypes.PersistentDataWritten,
                                databaseHandle: this.repository.databaseHandle,
                                data: this.repository.data
                            });
                        }).catch((error) => {
                            reject(error);
                        });
                    } else {
                        reject("the persistent database hooks must be set when activating a database handle");
                    }
                } else {
                    this.updates.next({
                        type: PersistentRepositoryUpdateTypes.PersistentDataWritten,
                        databaseHandle: this.repository.databaseHandle,
                        data: this.repository.data
                    });
                    resolve();
                }
            } else {
                if (this.repository.cookieConfig) {
                    this.cookieService.delete(this.repository.cookieConfig.name, this.repository.cookieConfig.path, this.repository.cookieConfig.domain, this.repository.cookieConfig.secure, this.repository.cookieConfig.sameSite);
                }
                resolve();
            }
        });
    }

    public setFetchPersistentDataHook(hook: (databaseHandle: string | number) => Promise<PersistentRepositoryGenericValues>) {
        this.fetchPersistentDataHook = hook;
    }

    public setWritePersistentDataHook(hook: (databaseHandle: string | number, data: PersistentRepositoryGenericValues) => Promise<void>) {
        this.writePersistentDataHook = hook;
    }

    public getUpdateSubject(): Subject<PersistentRepositoryUpdateMessage> {
        return this.updates;
    }

    // noinspection JSUnusedSymbols
    public setOptions(options?: PersistentRepositoryOptions): Promise<void> {
        options = _.clone(options || {});

        if (options.cookieConfig) {
            _.assign(this.repository.cookieConfig, options.cookieConfig);
            delete options.cookieConfig;
        }

        _.assign(this.repository, options);

        return this.loadPersistentData();
    }

    public enableCookies(enable: boolean) {
        this.repository.cookiesEnabled = enable;
    }

    public setDatabaseHandle(handle: number | string): Promise<void> {
        let promise: Promise<void>;

        if (this.repository.databaseHandle != handle) {
            this.repository.databaseHandle = handle;
            if (handle) {
                promise = this.loadPersistentData();
            } else {

                promise = this.resetValues();
            }
        } else {
            promise = Promise.resolve();
        }

        return promise;
    }

    public clearDatabaseHandle(): Promise<void> {
        return this.setDatabaseHandle(null);
    }

    public getDatabaseHandle(): number | string {
        return this.repository.databaseHandle;
    }

    public loadPersistentData(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.repository.data = {};

            if (!this.repository.databaseHandle) {
                const cookieData = this.cookieService.get(this.repository.cookieConfig.name);
                if (cookieData) {
                    try {
                        this.repository.data = JSON.parse(LZUTF8.decompress(decodeURIComponent(cookieData), {inputEncoding: "Base64"})) || {};
                    } catch (e) {
                        // ignore garbled cookies - just start over
                    }
                }

                if (this.repository.data.useDbData && this.repository.data.databaseHandle) {
                    this.repository.databaseHandle = this.repository.data.databaseHandle;
                    this.repository.data = {};
                }
            }

            if (this.repository.databaseHandle) {
                if (this.fetchPersistentDataHook) {
                    // obtain data via hook
                    this.fetchPersistentDataHook(this.repository.databaseHandle).then((values) => {
                        this.repository.data = _.cloneDeep(values);
                        this.updates.next({
                            type: PersistentRepositoryUpdateTypes.PersistentDataRead,
                            databaseHandle: this.repository.databaseHandle,
                            data: this.repository.data
                        });
                        resolve();
                    }).catch((error) => {
                        console.error(error);
                        this.repository.data = {};
                        this.repository.databaseHandle = null;
                    });
                } else {
                    reject("the persistent database hooks must be set when activating a database handle");
                }
            } else {
                this.updates.next({
                    type: PersistentRepositoryUpdateTypes.PersistentDataRead,
                    databaseHandle: this.repository.databaseHandle,
                    data: this.repository.data
                });
                resolve();
            }
        });
    }

    public resetValues(): Promise<void> {
        this.repository.data = _.cloneDeep(this.repository.defaults);
        return this.updatePersistentDataImmediate();
    }

    public setModuleValues(module: PersistentRepositoryComponentInterface, values: PersistentRepositoryGenericValues) {
        const name = module.getModuleName();
        this.setValue(`moduleValues.${name}`, values);
    }

    public setModuleDefaultValue<T>(module: PersistentRepositoryComponentInterface, path: string, value: T): T {
        const name = module.getModuleName();
        return this.setDefaultValue(`moduleValues.${name}.${path}`, value);
    }

    public setModuleValue(module: PersistentRepositoryComponentInterface, path: string, value: any) {
        const name = module.getModuleName();
        this.setValue(`moduleValues.${name}.${path}`, value);
    }

    public setModuleDefaultValues(module: PersistentRepositoryComponentInterface, defaults: PersistentRepositoryGenericValues) {
        if (_.isObject(defaults)) {
            _.forEach(defaults, (value, key) => {
                this.setModuleDefaultValue(module, key, value);
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

    public setDefaultValue<T>(path: string, value: T): T {
        if (!_.has(this.repository.data, path)) {
            this.setValue(path, value);
        }

        return this.getValue(path);
    }

    public setDefaultValues(defaults: PersistentRepositoryGenericValues, permanent?: boolean) {
        if (_.isObject(defaults)) {
            defaults = _.cloneDeep(defaults);

            if (permanent) {
                this.repository.defaults = defaults;
            }

            _.forEach(defaults, (value, key) => {
                this.setDefaultValue(key, value);
            });
        }
    }

    public setValue(path: string, value: any): void {
        _.set(this.repository.data, path, value);

        this.updates.next({
            type: PersistentRepositoryUpdateTypes.Update,
            databaseHandle: this.repository.databaseHandle,
            data: this.repository.data,
            path: path,
            value: value
        });

        this.updatePersistentData();
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

    public hasValue(path: string, value: string | number | boolean): boolean {
        const values = this.getValue(path);
        return _.isArray(values) ? values.includes(value) : false;
    }
}
