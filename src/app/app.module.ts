import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {PersistentRepositoryService} from "../../projects/ngx-persistent-repository/src/lib/persistent-repository.service";
import {PersistentRepositoryModule,} from "../../projects/ngx-persistent-repository/src/lib/persistent-repository.module";
import {AppComponent} from "./app.component";

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        PersistentRepositoryModule,
    ],
    providers: [PersistentRepositoryService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
