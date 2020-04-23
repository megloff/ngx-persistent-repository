import {PersistentRepositoryService} from "./persistent-repository.service";

export interface GenericValues {
    [key: string]: any;
}

export interface PersistentRepositoryComponentInterface {
    /**
     * Get the name to be used for this module in the repository
     */
    getModuleName(): string;

    /**
     * Get handle to the underlying persistent repository
     */
    getPersistentRepository(): PersistentRepositoryService;

    /**
     * Get the value associated with `path` for this module
     * @param path
     */
    getValue(path: string): any;

    /**
     * Get a copy of the complete repository section for this module
     */
    getValues(): any;

    /**
     * Clear the value associated with `path` for this module
     * @param path
     */
    clearValue(path: string): any;

    /**
     * Set the value of `path` to `value` for this module
     * @param path
     * @param value
     */
    setValue(path: string, value: any);

    /**
     * Store everything passed in `values` in the repository section for this module
     * @param values
     */
    setValues(values: GenericValues);

    /**
     * Set the value of `path` to `value` for this module if `path` has not yet a value
     * @param path
     * @param value
     */
    setValueDefault(path: string, value: any): any;

    /**
     * Store everything passed in `values` in the repository section for this module if it has not yet a value
     * @param values
     */
    setValueDefaults(values: GenericValues);
}
