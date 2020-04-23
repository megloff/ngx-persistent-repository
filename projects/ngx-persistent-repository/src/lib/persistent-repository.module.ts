import {Injector, NgModule} from "@angular/core";
import {PersistentRepositoryTestComponent} from "./persistent-repository-test/persistent-repository-test.component";
import {CookieService} from "ngx-cookie-service";
import {PersistentRepositoryService} from "./persistent-repository.service";

@NgModule({
    declarations: [PersistentRepositoryTestComponent],
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
