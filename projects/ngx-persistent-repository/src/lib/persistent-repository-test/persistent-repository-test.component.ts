import {Component, OnInit} from "@angular/core";
import {PersistentRepositoryComponent} from "../persistent-repository-component";
import {PersistentRepositoryGenericValues, PersistentRepositoryUpdateTypes} from "../persistent-repository.service";

@Component({
    selector: "ngx-persistent-repo-persistent-repo-component",
    templateUrl: "./persistent-repository-test.component.html",
    styleUrls: ["./persistent-repository-test.component.css"]
})
export class PersistentRepositoryTestComponent extends PersistentRepositoryComponent implements OnInit {
    private lastType: string;
    private lastData: PersistentRepositoryGenericValues;
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

    public getLastData(): PersistentRepositoryGenericValues {
        return this.lastData;
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

        this.getPersistentRepository().getUpdateSubject().subscribe((message) => {
            switch (message.type) {
                case PersistentRepositoryUpdateTypes.Initialize:
                    this.lastType = "Initialize";
                    this.lastData = message.data;
                    this.lastPath = null;
                    this.lastValue = null;
                    break;
                case PersistentRepositoryUpdateTypes.Update:
                    this.lastType = "Update";
                    this.lastData = null;
                    this.lastPath = message.data.path;
                    this.lastValue = message.data.value;
                    break;
                case PersistentRepositoryUpdateTypes.Reset:
                    this.lastType = "Reset";
                    this.lastData = message.data;
                    this.lastPath = null;
                    this.lastValue = null;
                    break;
                case PersistentRepositoryUpdateTypes.BulkWrite:
                    this.lastType = "BulkWrite";
                    this.lastData = message.data;
                    this.lastPath = null;
                    this.lastValue = null;
                    break;
            }

            this.lastCount += 1;
        });
    }
}
