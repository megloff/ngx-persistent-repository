import {Injectable, Injector} from "@angular/core";
import {CookieService} from "ngx-cookie-service";
import * as LZUTF8 from "lzutf8";
import {Subject} from "rxjs";
import * as _ from "lodash";

export interface PRGenericValues {
    [key: string]: any;
}

export interface PROptions {
    cookiesEnabled?: boolean;
    cookieConfig?: {
        name: string;
        expires?: number | Date;
        path?: string,
        domain?: string,
        secure?: boolean,
        sameSite?: "Lax" | "None" | "Strict"
    },
    databaseHandle?: number | string
    defaults?: PRGenericValues;
}

export interface PRData extends PROptions {
    data: PRGenericValues
}

export enum PRUpdateTypes {
    DataRead, Reset, Update, DataWritten
}

export interface PRUpdateMessage {
    type: PRUpdateTypes;
    databaseHandle: number | string;
    data: PRGenericValues;
    path?: string;
    value?: any;
}

export let PRGlobalInjector: Injector;

@Injectable({
    providedIn: "root"
})
export class PersistentRepositoryService {
    private readonly namespaceSection = "__namespaces__";
    private readonly repository: PRData;
    private readonly updates: Subject<PRUpdateMessage> = new Subject<PRUpdateMessage>();

    private fetchPersistentDataPromise: Promise<void>;
    private writePersistentDataPromise: Promise<void>;
    private fetchPersistentDataHook: (databaseHandle: string | number) => Promise<PRGenericValues>;
    private writePersistentDataHook: (databaseHandle: string | number, data: PRGenericValues) => Promise<void>;

    private repositoryInitialized: boolean = false;

    private cookieService: CookieService;

    private updatePersistentData = _.debounce(() => {
        if (this.repositoryInitialized) {
            this.updatePersistentDataImmediate().catch((error) => {
                console.error(error);
            });
        } else {
            // we're still starting up retry again later
            this.updatePersistentData();
        }
    }, 100, {trailing: true});

    /**
     * The core service of NgxPersistentRepository. Inject this package into your components and services to access the repository.
     */
    constructor(private appInjector: Injector) {
        PRGlobalInjector = appInjector;

        this.cookieService = appInjector.get(CookieService);

        this.repository = {
            cookiesEnabled: false,
            cookieConfig: {
                name: "ngx-persistent-repository",
                secure: false,
                sameSite: "Lax"
            },
            databaseHandle: null,
            defaults: {},
            data: {}
        };

        this.updates.subscribe((message) => {
            if (message.type == PRUpdateTypes.DataRead) {
                this.repositoryInitialized = true;
            }
        });
    }

    /**
     * Reload persistent data either directly from the cookie of, if a database handle has been set, from an external database via the `fetchPersistentDataHook`. The promise fulfills
     * when the data has been read from the source and is ready to use.
     */
    public loadPersistentData(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.repository.data = {};
            this.repositoryInitialized = false;

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
                    if (this.fetchPersistentDataPromise) {
                        this.fetchPersistentDataPromise.then((values) => {
                            resolve(values);
                        });
                    } else {
                        // obtain data via hook
                        this.fetchPersistentDataPromise = this.fetchPersistentDataHook(this.repository.databaseHandle).then((values) => {
                            this.fetchPersistentDataPromise = null;
                            this.repository.data = _.cloneDeep(values || {});
                            this.updates.next({
                                type: PRUpdateTypes.DataRead,
                                databaseHandle: this.repository.databaseHandle,
                                data: this.repository.data
                            });
                            resolve();
                        }).catch((error) => {
                            this.fetchPersistentDataPromise = null;
                            this.repository.data = {};
                            this.repository.databaseHandle = null;
                            reject(error);
                        });
                    }
                } else {
                    reject("the persistent database hooks must be set when activating a database handle");
                }
            } else {
                this.updates.next({
                    type: PRUpdateTypes.DataRead,
                    databaseHandle: this.repository.databaseHandle,
                    data: this.repository.data
                });
                resolve();
            }
        });
    }

    /**
     * Immediately update the persistence database from the repository. The promise fulfills when the synchronization is complete.
     */
    public updatePersistentDataImmediate(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // cancel any possibly pending call
            this.updatePersistentData.cancel();

            if (this.repository.cookiesEnabled) {
                this.writeCookieData();

                if (this.repository.databaseHandle) {
                    if (this.writePersistentDataHook) {
                        if (this.writePersistentDataPromise) {
                            this.writePersistentDataPromise.then(() => {
                                this.updatePersistentDataImmediate().then(() => {
                                    resolve();
                                }).catch((error) => {
                                    reject(error);
                                });
                            });
                        } else {
                            this.writePersistentDataPromise = this.writePersistentDataHook(this.repository.databaseHandle, this.repository.data).then(() => {
                                this.writePersistentDataPromise = null;
                                this.updates.next({
                                    type: PRUpdateTypes.DataWritten,
                                    databaseHandle: this.repository.databaseHandle,
                                    data: this.repository.data
                                });
                                resolve();
                            }).catch((error) => {
                                this.writePersistentDataPromise = null;
                                reject(error);
                            });
                        }
                    } else {
                        reject("the persistent database hooks must be set when activating a database handle");
                    }
                } else {
                    this.updates.next({
                        type: PRUpdateTypes.DataWritten,
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

    // noinspection JSUnusedGlobalSymbols
    /**
     * Set a hook for fetching data from an external persistence database. The hook is called with `databaseHandle` as parameter. It should fulfill its promise with an
     * object containing the complete repository to be activated.
     * @param hook
     */
    public setFetchPersistentDataHook(hook: (databaseHandle: string | number) => Promise<PRGenericValues>) {
        this.fetchPersistentDataHook = hook;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Set a hook for writing data to an external persistence database. The hook is called with `databaseHandle` and the repository data as parameter. It should fulfill its promise
     * after the data has been written to the database.
     * @param hook
     */
    public setWritePersistentDataHook(hook: (databaseHandle: string | number, data: PRGenericValues) => Promise<void>) {
        this.writePersistentDataHook = hook;
    }

    /**
     * Get a subject to observe repository activity.
     */
    public getUpdateSubject(): Subject<PRUpdateMessage> {
        return this.updates;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Update repository options and reload the repository data from the persistence database. The promise fulfills when the data has been loaded and is ready to use.
     * @param options
     */
    public setOptions(options?: PROptions): Promise<void> {
        options = _.clone(options || {});

        if (options.cookieConfig) {
            _.assign(this.repository.cookieConfig, options.cookieConfig);
            delete options.cookieConfig;
        }

        _.assign(this.repository, options);

        return this.loadPersistentData();
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Enable the use of cookies. Use this method with the result your cookie-consent tool. Note that if cookies are not enabled, the repository **will not**
     * be persistent! When this method is called with `true`, the current repository data will be synchronized with the persistence database. The promise fulfills
     * when the repository has been synchronized.
     * @param enable
     */
    public enableCookies(enable: boolean): Promise<void> {
        let promise: Promise<void>;
        if (enable) {
            this.repositoryInitialized = true;
            this.repository.cookiesEnabled = true;
            promise = this.updatePersistentDataImmediate();
        } else {
            promise = Promise.resolve();
        }

        return promise;
    }

    /**
     * Returns true when the repository has been read from the persistence database.
     */
    public isInitialized(): boolean {
        return this.repositoryInitialized;
    }

    /**
     * Update the database handle. The promise fulfills when the repository reflects the data associated with the new handle.
     * @param handle
     */
    public setDatabaseHandle(handle: number | string): Promise<void> {
        let promise: Promise<void>;

        if (this.repository.databaseHandle != handle) {
            this.repository.databaseHandle = handle;
            if (handle) {
                promise = new Promise<void>((resolve, reject) => {
                    this.loadPersistentData().then(() => {
                        // update the cookie to contain the payload pointing to the persistence database
                        this.writeCookieData();
                        resolve();
                    }).catch((error) => {
                        reject(error);
                    });
                })
            } else {
                promise = this.resetValues();
            }
        } else {
            promise = Promise.resolve();
        }

        return promise;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Clear the database handle and reset all values. The promise fulfills when the repository has been reset and is ready to use.
     */
    public clearDatabaseHandle(): Promise<void> {
        return this.setDatabaseHandle(null);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Return the current database handle.
     */
    public getDatabaseHandle(): number | string {
        return this.repository.databaseHandle;
    }

    /**
     * Reset the repository to it's default values. The promise fulfills after repository has synchronized with the persistence database.
     */
    public resetValues(): Promise<void> {
        this.repository.data = _.cloneDeep(this.repository.defaults || {});
        this.repositoryInitialized = true;

        this.updates.next({
            type: PRUpdateTypes.Reset,
            databaseHandle: this.repository.databaseHandle,
            data: this.repository.data
        });

        return this.updatePersistentDataImmediate();
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Set the repository default values to be used when `resetValues` is called. Defaults to empty repository.
     * @param defaults
     */
    public setDefaults(defaults: PRGenericValues) {
        this.repository.defaults = _.cloneDeep(defaults || {});
    }

    /**
     * If there is no repository entry for `path` then set `path` to `value` else keep the existing value. Returns the resulting value for `path`.
     * If no namespace is given the global repository is used.
     * @param path
     * @param value
     * @param namespace
     */
    public setDefaultValue<T>(path: string, value: T, namespace?: string): T {
        path = this.preparePath(path, namespace);

        if (!_.has(this.repository.data, path)) {
            this.setValue(path, value);
        }

        return this.getValue(path);
    }

    /**
     * Set `path` to `value` in the global section of the repository or in the given namespace.
     * @param path
     * @param value
     * @param namespace
     */
    public setValue(path: string, value: any, namespace?): void {
        path = this.preparePath(path, namespace);

        _.set(this.repository.data, path, value);

        this.updates.next({
            type: PRUpdateTypes.Update,
            databaseHandle: this.repository.databaseHandle,
            data: this.repository.data,
            path: path,
            value: value
        });

        this.updatePersistentData();
    }

    /**
     * Set all values of the given object in the global section of the repository or in the namespace.
     * @param values
     * @param namespace
     */
    public setValues(values: PRGenericValues, namespace?: string) {
        _.forEach(values, (value, key) => {
            this.setValue(key, value, namespace);
        });
    }

    /**
     * Get the value associated with `path` from the global section of the repository or from the namespace.
     * @param path
     * @param namespace
     */
    public getValue(path: string, namespace?: string): any {
        return _.get(this.repository.data, this.preparePath(path, namespace));
    }

    /**
     * Get a copy of the complete global repository or of a namespace.
     */
    public getValues(namespace?: string): PRGenericValues {
        return _.cloneDeep(namespace ? _.get(this.repository.data, this.preparePath("", namespace)) : this.repository.data);
    }

    /**
     * Clear the value at `path` in the global repository or in a namespace.
     * @param path
     * @param namespace
     */
    public clearValue(path: string, namespace?: string): void {
        _.unset(this.repository.data, this.preparePath(path, namespace));
    }

    /**
     * Check whether `value` exists in the array stored at `path`. The entry at `path` must be an array.
     * If no namespace is given the global repository is used.
     * @param path
     * @param value
     * @param namespace
     */
    public containsValue(path: string, value: string | number | boolean, namespace?: string): boolean {
        const values = this.getValue(path, namespace);
        return _.isArray(values) ? values.includes(value) : false;
    }

    /**
     * Write the cookie payload to the cookie. The payload is either the repository itself, or the databaseHandle to be used to read the data from the
     * persistence database.
     */
    private writeCookieData() {
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
    }

    /**
     * Prepare a path with an optionally given namespace.
     * @param path
     * @param namespace
     */
    private preparePath(path: string, namespace?: string): string {
        let fullPath: string = path;

        if (namespace) {
            fullPath = `${this.namespaceSection}.${namespace}`;
            if (path) {
                fullPath += `.${path}`;
            }
        }

        return fullPath;
    }
}
