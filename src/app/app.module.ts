import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {PersistentRepositoryModule, PersistentRepositoryService} from "ngx-persistent-repository";
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
