import {PersistentRepositoryGenericValues, PersistentRepositoryInjector, PersistentRepositoryService} from "./persistent-repository.service";
import {PersistentRepositoryComponentInterface} from "./persistent-repository-component.interface";

export abstract class PersistentRepositoryComponent implements PersistentRepositoryComponentInterface {
    protected persistentRepository: PersistentRepositoryService;

    protected constructor() {
        this.persistentRepository = PersistentRepositoryInjector.get(PersistentRepositoryService);
    }

    public getPersistentRepository(): PersistentRepositoryService {
        return this.persistentRepository;
    }

    // noinspection JSUnusedGlobalSymbols
    public abstract getModuleName(): string;

    // noinspection JSUnusedGlobalSymbols
    public getValue(key: string): any {
        return this.persistentRepository.getModuleValue(this, key);
    }

    // noinspection JSUnusedGlobalSymbols
    public getValues(): any {
        return this.persistentRepository.getModuleValues(this);
    }

    // noinspection JSUnusedGlobalSymbols
    public clearValue(key: string): any {
        return this.persistentRepository.clearModuleValue(this, key);
    }

    // noinspection JSUnusedGlobalSymbols
    public setValue(key: string, value: any) {
        this.persistentRepository.setModuleValue(this, key, value);
    }

    // noinspection JSUnusedGlobalSymbols
    public setValues(values: any) {
        this.persistentRepository.setModuleValues(this, values);
    }

    // noinspection JSUnusedGlobalSymbols
    public setValueDefault(key: string, value: any): any {
        return this.persistentRepository.setModuleValueDefault(this, key, value);
    }

    // noinspection JSUnusedGlobalSymbols
    public setValueDefaults(values: PersistentRepositoryGenericValues) {
        this.persistentRepository.setModuleValueDefaults(this, values);
    }
}
