import {async, fakeAsync, tick, ComponentFixture, TestBed} from "@angular/core/testing";

import {PersistentRepositoryTestComponent} from "./persistent-repository-test.component";
import {PersistentRepositoryService} from "../persistent-repository.service";
import {CookieService} from "ngx-cookie-service";
import * as _ from "lodash";

describe("PersistentRepositoryComponentTest", () => {
    let component: PersistentRepositoryTestComponent;
    let fixture: ComponentFixture<PersistentRepositoryTestComponent>;

    beforeEach(async(() => {
        const module = TestBed.configureTestingModule({
            declarations: [PersistentRepositoryTestComponent]
        }).compileComponents();

        TestBed.inject(CookieService);
        TestBed.inject(PersistentRepositoryService);
    }));

    function testAsync(delayTime: number) { // make delay
        return new Promise<any>((resolve) => {
            _.delay(() => {
                resolve();
            }, delayTime);
        });
    }

    beforeEach(() => {
        fixture = TestBed.createComponent(PersistentRepositoryTestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
        expect(component.hasService()).toBeTrue();
    });

    it("should access persistentRepository parent class", () => {
        const persistentRepository = component.getPersistentRepository();
        persistentRepository.setValues({
            a: 1,
            b: 42
        });

        expect(persistentRepository.getValue("b")).toBe(42);
    });

    it("should should set module value", () => {
        component.setValue("test", 42);

        expect(component.getValue("test")).toBe(42);
        expect(component.getPersistentRepository().getValue("moduleValues." + component.getModuleName() + ".test")).toBe(42);
    });

    it("should clear value", () => {
        component.setValue("test", 42);
        component.clearValue("test");
        expect(component.getValue("test")).toBe(undefined);
    });

    it("should set default values", () => {
        component.setValue("test", 42);
        component.setDefaultValue("test", 1);
        expect(component.getValue("test")).toBe(42);
    });

    it("should set default values", () => {
        component.setValues({
            "test1": 2,
            "test2": 42
        });

        component.setDefaultValues({
            "test1": 1,
            "test3": 5
        });

        expect(component.getValue("test1")).toBe(2);
        expect(component.getValue("test2")).toBe(42);
        expect(component.getValue("test3")).toBe(5);
    });

    it("should trigger update messages", fakeAsync(() => {
        expect(component.getLastType()).toBe("Starting");
        component.setValue("test", 42);
        expect(component.getLastCount()).toBe(1);
        expect(component.getLastPath()).toBe("moduleValues." + component.getModuleName() + ".test");
        expect(component.getLastValue()).toBe(42);
        tick(300);
        expect(component.getLastCount()).toBe(2);
        expect(component.getLastType()).toBe("BulkWrite");
    }));
});
