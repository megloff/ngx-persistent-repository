import {Injector, NgModule} from "@angular/core";
import {CookieService} from "ngx-cookie-service";
import {PersistentRepositoryService} from "./persistent-repository.service";

@NgModule({
    declarations: [],
    imports: [],
    exports: [],
    providers: [CookieService, PersistentRepositoryService]
})

export class PersistentRepositoryModule {
    // instantiate the repository together with the module to get global access to the injector
    constructor(private injector: Injector) {
        injector.get(PersistentRepositoryService);
    }
}
