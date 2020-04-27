import {Component, Injector, OnInit} from "@angular/core";
import {PersistentRepositoryService, PRGenericValues} from "../../projects/ngx-persistent-repository/src/lib/persistent-repository.service";
import {PersistentRepositoryComponent} from "../../projects/ngx-persistent-repository/src/lib/persistent-repository-component";
import * as _ from "lodash";

@Component({
    selector: "egi-sr-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"]
})
export class AppComponent extends PersistentRepositoryComponent implements OnInit {
    // set the handle to some value to get  database persistence demo enabled (as it is mocking the database, there is no real persistence)
    public databaseHandle: string = null;
    private mockDatabaseServer: PersistentRepositoryService;

    // when using karma tests, a public constructor must be present -> wrap the protected constructor of abstract class `PersistentRepositoryComponent`
    constructor(private injector: Injector) {
        super();
    }

    // this name is used in the namespace section of the repository
    public getModuleName(): string {
        return "appComponent";
    }

    public reset() {
        this.mockDatabaseServer.resetValues().then(() => {
            this.persistentRepository.resetValues().then(() => {
                this.setDefaultValue("loadCount", 0);
            }).catch();
        }).catch();
    }

    // you normally won't switch between persistence database storage modes... this is done here for just the demo page
    public setDbChoice(dbChoice: string) {
        if (dbChoice == "cookie") {
            this.databaseHandle = null;
            this.persistentRepository.clearDatabaseHandle().catch();
        } else {
            this.databaseHandle = "my-user-id";
            this.persistentRepository.setDatabaseHandle(this.databaseHandle).catch();
        }
    }

    // setup a second repository service to mock a persistent database
    // you'll probably never use this yourself, but it's a nice trick :-)
    private setupDatabaseServer(): Promise<void> {
        this.mockDatabaseServer = new PersistentRepositoryService(this.injector);
        return this.mockDatabaseServer.setOptions({
            cookiesEnabled: true,
            cookieConfig: {
                name: "PR-mock-db",
                expires: 30 // expire after 30 days
            }
        });
    }

    ngOnInit() {
        this.setupDatabaseServer().then(() => {
            this.persistentRepository.setFetchPersistentDataHook(
                (databaseHandle) => {
                    return new Promise<PRGenericValues>((resolve, _reject) => {
                        // make a call to your database to fetch the data for the given handle then resolve with repository data
                        _.defer(() => {
                            // get the repository from the "server"
                            const data: PRGenericValues = this.mockDatabaseServer.getValue(databaseHandle.toString());
                            resolve(data);
                        }, 90);
                    });
                }
            );

            this.persistentRepository.setWritePersistentDataHook((databaseHandle: string | number, data: PRGenericValues) => {
                return new Promise<void>((resolve, reject) => {
                    // make a call to your database to fetch the data for the given handle then resolve with repository data
                    _.defer(() => {
                        // write the data to the server
                        this.mockDatabaseServer.setValue(databaseHandle.toString(), data);
                        this.mockDatabaseServer.updatePersistentDataImmediate().then(() => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });
                    }, 100);
                });
            });

            // when working with default options (ie. not using `setOptions`), you must call `enableCookies(true)` to
            // activate persistence!
            this.persistentRepository.setOptions({
                databaseHandle: this.databaseHandle,
                cookiesEnabled: true,
                cookieConfig: {
                    name: "PR-test-cookie",
                    expires: 7 // days -> omit this and the cookie expires when the browser session ends (ie. quit the browser)
                }
            }).then(() => {
                const loadCount = this.setDefaultValue("loadCount", 0);
                this.setValue("loadCount", loadCount + 1);
                this.databaseHandle = this.persistentRepository.getDatabaseHandle() as string;
            }).catch((error) => {
                console.error(error);
            });
        });
    }
}
