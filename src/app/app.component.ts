import {Component, OnInit} from "@angular/core";
import {PersistentRepositoryComponent, PersistentRepositoryGenericValues, PersistentRepositoryUpdateTypes} from "../../dist/ngx-persistent-repository";

@Component({
    selector: "egi-sr-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"]
})
export class AppComponent extends PersistentRepositoryComponent implements OnInit {
    public loadCount: number;
    public dynamicallyLoadedValue: number;
    public databaseHandle: string = null;

    constructor() {
        super();
    }

    public getModuleName(): string {
        return "appComponent";
    }

    public reset() {
        this.persistentRepository.resetValues().then(() => {
            this.loadCount = this.setDefaultValue("loadCount", 0);
        }).catch();
    }

    ngOnInit() {
        if (this.databaseHandle) {
            this.persistentRepository.setFetchPersistentDataHook(
                (databaseHandle) => {
                    return new Promise<PersistentRepositoryGenericValues>((resolve, reject) => {
                        // make a call to your database to fetch the data for the given handle then resolve
                        const data: PersistentRepositoryGenericValues = {};
                        data.hash = databaseHandle;
                        data.dynamicallyLoadedValue = 42;
                        resolve(data);
                    });
                }
            );

            this.persistentRepository.setWritePersistentDataHook((databaseHandle: string | number, data: PersistentRepositoryGenericValues) => {
                return new Promise<void>((resolve, reject) => {
                    // make a call to your database to write the data for the given handle then resolve
                    resolve();
                });
            });
        }

        this.persistentRepository.setOptions({
            cookiesEnabled: true,
            databaseHandle: this.databaseHandle ? "abcde_hash" : null,
            cookieConfig: {
                name: "test-cookie",
                expires: 7 // days
            }
        }).then(() => {
            this.loadCount = this.setDefaultValue("loadCount", 0);
            this.loadCount += 1;
            this.setValue("loadCount", this.loadCount);

            this.dynamicallyLoadedValue = this.persistentRepository.getValue("dynamicallyLoadedValue");
        });
    }
}
