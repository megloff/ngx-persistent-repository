import {PRGenericValues, PRGlobalInjector, PersistentRepositoryService} from "./persistent-repository.service";
import {PersistentRepositoryComponentInterface} from "./persistent-repository-component.interface";

export abstract class PersistentRepositoryComponent implements PersistentRepositoryComponentInterface {
    protected persistentRepository: PersistentRepositoryService;

    /**
     * Let your components inherit from this class to get simple access to repository values within their own namespace. Use `getModuleName()` to define the namespace name.
     */
    protected constructor() {
        this.persistentRepository = PRGlobalInjector.get(PersistentRepositoryService);
    }

    /**
     * @inheritDoc
     */
    public getPersistentRepository(): PersistentRepositoryService {
        return this.persistentRepository;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @inheritDoc
     */
    public abstract getModuleName(): string;

    // noinspection JSUnusedGlobalSymbols
    /**
     * @inheritDoc
     */
    public getValue(key: string): any {
        return this.persistentRepository.getValue(key, this.getModuleName());
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @inheritDoc
     */
    public getValues(): any {
        return this.persistentRepository.getValues(this.getModuleName());
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @inheritDoc
     */
    public clearValue(key: string): any {
        return this.persistentRepository.clearValue(key, this.getModuleName());
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @inheritDoc
     */
    public setValue(key: string, value: any) {
        this.persistentRepository.setValue(key, value, this.getModuleName());
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @inheritDoc
     */
    public setValues(values: PRGenericValues) {
        this.persistentRepository.setValues(values, this.getModuleName());
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @inheritDoc
     */
    public setDefaultValue(key: string, value: any): any {
        return this.persistentRepository.setDefaultValue(key, value, this.getModuleName());
    }
}
