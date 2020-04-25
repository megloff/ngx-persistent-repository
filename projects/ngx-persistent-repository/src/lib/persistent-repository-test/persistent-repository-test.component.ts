import {Component, OnInit} from "@angular/core";
import {PersistentRepositoryComponent} from "../persistent-repository-component";
import {PRGenericValues, PRUpdateTypes} from "../persistent-repository.service";

// noinspection AngularMissingOrInvalidDeclarationInModule
@Component({
    selector: "ngx-persistent-repo-persistent-repo-component",
    templateUrl: "./persistent-repository-test.component.html",
    styleUrls: ["./persistent-repository-test.component.css"]
})
export class PersistentRepositoryTestComponent extends PersistentRepositoryComponent implements OnInit {
    private lastType: string;
    private lastData: PRGenericValues;
    private lastPath: string;
    private lastValue: any;
    private lastCount: number;

    constructor() {
        super();
    }

    public getModuleName(): string {
        return "PersistentRepositoryTestComponent";
    }

    public getLastCount(): number {
        return this.lastCount;
    }

    public getLastType(): string {
        return this.lastType;
    }

    public getLastPath(): string {
        return this.lastPath;
    }

    public getLastValue(): any {
        return this.lastValue;
    }

    public hasService() {
        return !!this.getPersistentRepository();
    }

    ngOnInit(): void {
        this.lastType = "Starting";
        this.lastCount = 0;

        this.persistentRepository.enableCookies(true);

        this.getPersistentRepository().getUpdateSubject().subscribe((message) => {
            // console.log("message", message);
            switch (message.type) {
                case PRUpdateTypes.Startup:
                    this.lastType = "Startup";
                    this.lastData = message.data;
                    this.lastPath = null;
                    this.lastValue = null;
                    break;
                case PRUpdateTypes.DataRead:
                    this.lastType = "DataRead";
                    this.lastData = message.data;
                    this.lastPath = null;
                    this.lastValue = null;
                    break;
                case PRUpdateTypes.Update:
                    this.lastType = "Update";
                    this.lastData = null;
                    this.lastPath = message.path;
                    this.lastValue = message.value;
                    break;
                case PRUpdateTypes.Reset:
                    this.lastType = "Reset";
                    this.lastData = message.data;
                    this.lastPath = null;
                    this.lastValue = null;
                    break;
                case PRUpdateTypes.DataWritten:
                    this.lastType = "DataWritten";
                    this.lastData = message.data;
                    this.lastPath = null;
                    this.lastValue = null;
                    break;
            }

            this.lastCount += 1;
        });
    }
}
