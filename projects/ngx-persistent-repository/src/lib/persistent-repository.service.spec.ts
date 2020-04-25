import {TestBed} from '@angular/core/testing';

import {PersistentRepositoryService} from './persistent-repository.service';
import {CookieService} from "ngx-cookie-service";

describe('NgxPersistentRepositoryService', () => {
    let service: PersistentRepositoryService;

    beforeEach(() => {
        TestBed.configureTestingModule({});

        TestBed.inject(CookieService);

        service = TestBed.inject(PersistentRepositoryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should retrieve default value', function () {
        service.setValues({
            test: 12
        });

        expect(service.getValue("test")).toBe(12);
    });

    it('should overwrite default value', function () {
        service.setValues({
            test: 12
        });

        service.setValue("test", 42)
        expect(service.getValue("test")).toBe(42);
    });

    it('should overwrite default value', function () {
        service.setValues({
            test: 12
        });

        service.setValue("test", 42)
        expect(service.getValue("test")).toBe(42);
    });

    it('should setting default should keep existing value', function () {
        service.setValues({
            test: 12
        });

        service.setDefaultValue("test", 42)
        expect(service.getValue("test")).toBe(12);
    });

    it('should correctly reset values', function () {
        service.setDefaults({
            test1: 12,
            test2: 13
        });

        service.setValue("test1", 42);
        service.setValue("test3", 1);
        service.resetValues();

        expect(service.getValue("test1")).toBe(12);
        expect(service.getValue("test2")).toBe(13);
        expect(service.getValue("test3")).toBe(undefined);
    });

    it('should correctly clear values', function () {
        service.setValues({
            test1: 12,
            test2: 13
        });

        service.clearValue("test1");

        expect(service.getValue("test1")).toBe(undefined);
        expect(service.getValue("test2")).toBe(13);
    });

    it('should handle object values with paths', function () {
        service.setValues({
            test: {
                a: 1,
                b: 42
            }
        });

        expect(service.getValue("test.a")).toBe(1);
        expect(service.getValue("test.b")).toBe(42);

        const test = service.getValue("test")
        expect(test.a).toBe(1);
        expect(test.b).toBe(42);
    });

    it('should handle array in-value test', function () {
        service.setValues({
            test: [1, 2, 3]
        });

        expect(service.containsValue("test", 1)).toBeTrue();
        expect(service.containsValue("test", 42)).toBeFalse();
    });
});

