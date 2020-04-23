import {Component, OnInit} from "@angular/core";
import {PersistentRepositoryComponent} from "ngx-persistent-repository";

@Component({
    selector: "egi-sr-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"]
})
export class AppComponent extends PersistentRepositoryComponent implements OnInit {
    public loadCount: number;

    constructor() {
        super();
    }

    public getModuleName(): string {
        return "appComponent";
    }

    public reset() {
        this.persistentRepository.resetValues();
        this.loadCount = this.setDefaultValue("loadCount", 0);
    }

    ngOnInit() {
        this.persistentRepository.setOptions({
            cookiesEnabled: true,
            cookieConfig: {
                name: "testCookie",
                expire: 7 // days
            }
        });

        this.loadCount = this.setDefaultValue("loadCount", 1);
        this.loadCount += 1;
        this.setValue("loadCount", this.loadCount);
    }
}
